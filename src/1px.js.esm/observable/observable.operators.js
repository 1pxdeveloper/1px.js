import {Observable} from "./observable.js"


/// -------------------------------------------------------------------------------------------
/// Operators
/// -------------------------------------------------------------------------------------------
const noop = () => {};
const just = _ => _;

const pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);

const lift = (callback) => (observable) => new Observable(observer => {
	const o = callback(observer) || {};
	const s = observable.subscribe(Object.setPrototypeOf(o, observer));
	return () => {
		s.unsubscribe();
		o.finalize && o.finalize();
	}
});

const filterCallback = (callback) => {
	if (Object(callback) !== callback) return _.is(callback);
	if (typeof callback === "function") return callback;
	
	return (object) => {
		for (let [key, _callback] of Object.entries(callback)) {
			if (typeof _callback !== "function") _callback = _.is(_callback);
			if (_callback(object && object[key])) return true;
		}
		return false;
	}
};

const mapCallback = (callback) => {
	if (Object(callback) !== callback) return callback;
	if (typeof callback === "function") return callback;
	
	return (object) => {
		object = {...object};
		for (let [key, _callback] of Object.entries(callback)) {
			if (typeof _callback !== "function") {
				object[key] = _callback;
			}
			else {
				object[key] = _callback(object[key]);
			}
		}
		
		return object;
	}
};


Observable.prototype.pipe = function(...operators) { return pipe(...operators)(this) };
Observable.prototype.lift = function(callback) { return lift(callback)(this) };

Observable.prototype.toPromise = function() {
	return new Promise((resolve, reject) => {
		let _value;
		let s;
		
		s = this.subscribe({
			next(value) {
				_value = value;
			},
			
			error(error) {
				if (s && s.closed) return;
				reject(error);
			},
			
			complete() {
				if (s && s.closed) return;
				resolve(_value);
			}
		})
	});
};

/// -------------------------------------------------------------------------------------------
/// Operators
/// -------------------------------------------------------------------------------------------
const map = (callback) => lift((observer, index = 0) => ({
	next(value) {
		observer.next(mapCallback(callback)(value, index++))
	}
}));

const mapTo = (value) => lift(observer => ({
	next() {
		observer.next(value)
	}
}));

const filter = (callback) => lift((observer, index = 0) => ({
	next(value) {
		if (filterCallback(callback)(value, index++)) observer.next(value)
	}
}));

const scan = (accumulator, seed) => lift((observer, ret = seed) => ({
	next(value) {
		observer.next((ret = accumulator(ret, value)));
	}
}));

const reject = (callback) => filter((...args) => !filterCallback(callback)(...args));

const tap = (onNext, onError = noop, onComplete = noop) => {
	if (!_.isFunction(onNext)) onNext = noop;
	if (!_.isFunction(onError)) onError = noop;
	if (!_.isFunction(onComplete)) onComplete = noop;
	
	return lift((observer, index = 0) => ({
		next(value) {
			onNext(value, index++);
			observer.next(value)
		},
		
		error(error) {
			onError(error);
			observer.error(error);
		},
		
		complete() {
			onComplete();
			observer.complete();
		}
	}));
};

const take = (num) => lift((observer, count = num) => ({
	start() {
		if (count <= 0) observer.complete()
	},
	
	next(value) {
		observer.next(value);
		if (--count <= 0) observer.complete();
	}
}));

const takeLast = (num = 1) => lift((observer, res = []) => ({
	next(value) {
		res.push(value);
		res = res.slice(-num);
	},
	
	complete() {
		observer.next(res);
		observer.complete();
	}
}));

const finalize = (finalize) => lift(() => ({finalize}));

const initialize = (initialize) => (observable) => new Observable(observer => {
	
	const o = Object.setPrototypeOf({
		next(value) {
			initialize(value);
			observer.next(value);
			delete o.next;
		}
	}, observer);
	
	return observable.subscribe(o);
});

const count = () => lift((observer, count = 0) => ({
	next() { count++ },
	complete() { observer.next(count) }
}));


const concat = (...observables) => (observable) => Observable.concat(observable, ...observables);

const startWith = (value) => (observable) => Observable.of(value).concat(observable);

const skip = (count) => (observable) => observable.filter((value, index) => index >= count);

const last = () => lift((observer, ret) => ({
	next(value) {ret = value},
	
	complete() {
		observer.next(ret);
		observer.complete();
	}
}));


const catchError = (callback) => (observable) => {
	const caught = observable.lift(o => ({
		error: noop
	}));
	
	let okay = false;
	return observable.lift((observer) => ({
		next(value) {
			okay = true;
			observer.next(value);
		},
		
		error(error) {
			// if (okay) return observer.error(error);
			const o$ = callback(error, caught) || Observable.EMPTY; /// @FIXME:.. Observable.async 이런거 해야되나??
			o$.subscribe(observer);
		}
	}));
};


const distinctUntilChanged = (compare = Object.is) => lift((observer, lastValue, index = 0) => ({
	next(value) {
		if (index++ === 0) return observer.next(value);
		if (!compare(lastValue, value)) observer.next(value);
		lastValue = value;
	}
}));


const debounce = (timeout) => lift((observer, timer) => ({
	
	next(value) {
		clearTimeout(timer);
		timer = setTimeout(() => observer.next(value), timeout);
	}
}));


const delay = (timeout) => lift((observer, id, completed = false) => ({
	next(value) {
		id = setTimeout(() => {
			observer.next(value);
			if (completed) observer.complete();
		}, timeout);
	},
	
	complete() {
		completed = true;
	},
	
	finalize() {
		clearTimeout(id);
	}
}));


const duration = (timeout) => lift((observer, id, queue = [], completed = false) => ({
	next(value) {
		if (!id) {
			observer.next(value);
		}
		else {
			queue.push(value);
		}
		
		id = setTimeout(() => {
			if (queue.length) {
				observer.next(queue.shift());
			}
			if (completed) observer.complete();
		}, timeout);
	},
	
	complete() {
		completed = true;
	},
	
	finalize() {
		clearTimeout(id);
	}
}));


const timeout = (timeout) => lift((observer, id) => ({
	start() {
		clearTimeout(id);
		id = setTimeout(() => {
			observer.error();/// @TODO: 여기에 뭘 보내야 할까??
		}, timeout);
	},
	
	next(value) {
		clearTimeout(id);
		id = setTimeout(() => {
			observer.error();/// @TODO: 여기에 뭘 보내야 할까??
		}, timeout);
		
		observer.next(value);
	},
	
	finalize() {
		clearTimeout(id);
	}
}));


const timeoutFirstOnly = (timeout, error) => lift((observer, id) => ({
	start() {
		clearTimeout(id);
		id = setTimeout(() => {
			observer.error(error);
		}, timeout);
	},
	
	next(value) {
		observer.next(value);
		clearTimeout(id);
	},
	
	finalize() {
		clearTimeout(id);
	}
}));


const debug = (...tag) => lift(observer => ({
	start() {
		console.warn(...tag, ".start");
	},
	
	next(value) {
		console.warn(...tag, ".next", value);
		observer.next(value);
	},
	
	error(error) {
		console.error(...tag, ".error", error);
		observer.error(error);
	},
	
	complete() {
		console.warn(...tag, ".complete");
		observer.complete();
	},
	
	finalize() {
		// console.groupEnd();
	}
}));


const trace = (...tag) => lift(observer => ({
	start() {
		// console.group(tag);
		// console.groupEnd();
	},
	
	next(value) {
		console.warn(...tag, value);
		observer.next(value);
	},
	
	error(error) {
		console.error(...tag, error);
		observer.error(error);
	}
	
	// complete() {
	// 	console.log(...tag, "completed!");
	// 	observer.complete();
	// },
	
	// finalize() {
	// 	// console.groupEnd();
	// }
}));


const throttle = (callback) => lift((observer, pending = false, s) => ({
	
	next(value) {
		if (!pending) {
			observer.next(value);
		}
		
		pending = true;
		
		s = Observable.castAsync(callback(value)).subscribe({
			complete() {
				pending = false;
			}
		})
	},
	
	finalize() {
		if (s) s.unsubscribe();
	}
}));

const throttleTime = (duration) => throttle(() => Observable.timeout(duration));

const withLatestFrom = (other) => (observable) => {
	
	let s;
	let value2 = null;
	let emitted = false;
	let queue = [];
	
	return observable.lift(observer => ({
		start() {
			s = other.subscribe({
				next(value) {
					emitted = true;
					value2 = value;
					
					for (const v of queue) {
						observer.next([v, value2]);
					}
					queue = [];
				},
				
				error(error) {
					observer.error(error)
				}
			});
		},
		
		next(value) {
			if (!emitted) {
				queue.push(value);
				return;
			}
			observer.next([value, value2]);
		},
		
		finalize() {
			if (s) s.unsubscribe();
		}
	}));
};

const takeUntil = (notifier) => (observable) => {
	return new Observable(observer => {
		const complete = observer.complete.bind(observer);
		const s = observable.subscribe(observer);
		const s2 = notifier.subscribe(complete, complete, complete);
		
		return () => {
			s.unsubscribe();
			s2.unsubscribe();
		}
	});
};

const until = (notifier) => (observable) => {
	return new Observable(observer => {
		const s = observable.subscribe(observer);
		
		const unsubscribe = () => s.unsubscribe();
		const s2 = notifier.subscribe(unsubscribe, unsubscribe, unsubscribe);
		
		return () => {
			s.unsubscribe();
			s2.unsubscribe();
		}
	});
};


const mergeAll = () => lift((observer, ret = []) => ({
	next(value) { ret.push(value) },
	complete() { observer.next(ret) }
}));


/// @TODO: inclusive
const takeWhile = (callback = just, inclusive) => lift((observer, index = 0) => ({
	next(value) {
		Observable.castAsync(callback(value, index++)).subscribe(cond => {
			observer.next(value);
			if (!cond) observer.complete();
		});
	}
}));


const share = () => (observable) => {
	let subscription, observers = [];
	
	return new Observable(observer => {
		observers.push(observer);
		
		subscription = subscription || observable.subscribe({
			next(value) { for (const observer of observers) observer.next(value) },
			error(error) { for (const observer of observers) observer.error(error) },
			complete() { for (const observer of observers) observer.complete() }
		});
		
		return () => {
			observers = observers.filter(o => o !== observer);
			
			if (observers.length === 0) {
				subscription.unsubscribe();
				subscription = null;
			}
		}
	});
};


const shareReplay = (bufferSize = Infinity) => (observable) => {
	let observers = [];
	let subscription;
	let buffer = [];
	
	return new Observable(observer => {
		if (subscription) {
			for (const value of buffer) {
				observer.next(value);
			}
			
			if (subscription.closed) {
				observer.complete();
				return;
			}
		}
		
		observers.push(observer);
		
		subscription = subscription || observable.subscribe({
			next(value) {
				buffer.push(value);
				buffer = buffer.slice(-bufferSize);
				for (const observer of observers) observer.next(value);
			},
			
			error(error) {
				for (const observer of observers) observer.error(error);
			},
			
			complete() {
				for (const observer of observers) observer.complete();
			}
		});
		
		return () => {
			observers = observers.filter(o => o !== observer);
			
			if (observers.length === 0) {
				subscription.unsubscribe();
			}
		}
	});
};


const retry = (count = Infinity, error) => (observable) => {
	if (count <= 0) {
		return Observable.throw(error);
	}
	
	return new Observable(observer => {
		let s1, s2;
		
		s1 = observable.subscribe(Object.setPrototypeOf({
			error: (err) => {
				s1.unsubscribe();
				s2 = observable.retry(--count, err).subscribe(observer);
			}
		}, observer));
		
		return () => {
			s1.unsubscribe();
			s2 && s2.unsubscribe();
		};
	})
};

/// -------------------------------------------------------------------------------------------
/// Flatten Map Functions
/// -------------------------------------------------------------------------------------------
const mergeMap = (callback = just) => lift((observer) => {
	let completed = false;
	let subscriptions = [];
	
	const complete = () => completed && subscriptions.every(s => s.closed) && observer.complete();
	const mergeMapObserver = Object.setPrototypeOf({complete}, observer);
	
	return {
		next(value) {
			subscriptions.push(Observable.castAsync(callback(value)).subscribe(mergeMapObserver))
		},
		
		complete() {
			completed = true;
			complete();
		},
		
		finalize() {
			for (const subscription of subscriptions) subscription.unsubscribe();
		}
	}
});

const switchMap = (callback = just) => lift(observer => {
	let completed = false;
	let subscription;
	
	const switchMapObserver = Object.setPrototypeOf({
		complete() {
			completed && observer.complete();
		}
	}, observer);
	
	return {
		next(value) {
			if (subscription) subscription.unsubscribe();
			subscription = Observable.castAsync(callback(value)).subscribe(switchMapObserver);
		},
		
		complete() {
			completed = true;
			if (!subscription || (subscription && subscription.closed)) {
				observer.complete();
			}
		},
		
		finalize() {
			if (subscription) subscription.unsubscribe();
		}
	}
});


const exhaustMap = (callback = just) => lift(observer => {
	let completed = false;
	let subscription;
	
	const exhaustMapObserver = Object.setPrototypeOf({
		complete() {
			completed && observer.complete();
		}
	}, observer);
	
	return {
		next(value) {
			if (subscription && !subscription.closed) return;
			subscription = Observable.castAsync(callback(value)).subscribe(exhaustMapObserver);
		},
		
		complete() {
			completed = true;
			
			if (!subscription || (subscription && subscription.closed)) {
				observer.complete();
			}
		},
		
		finalize() {
			if (subscription) subscription.unsubscribe();
		}
	}
});


const connectMap = (callback = just) => lift(observer => {
	let subscription;
	
	return {
		next(value) {
			if (subscription) subscription.unsubscribe();
			subscription = Observable.castAsync(callback(value)).subscribe(observer);
		},
		
		complete() {},
		
		finalize() {
			if (subscription) subscription.unsubscribe();
		}
	}
});


const concatMap = (callback = just) => lift(observer => {
	
	let sourceCompleted = false;
	let running = false;
	let subscription;
	
	const queue = [];
	
	function doQueue() {
		if (running) return;
		
		if (queue.length === 0) {
			if (sourceCompleted) {
				observer.complete();
			}
			return;
		}
		
		running = true;
		const value = queue.shift();
		const observable = Observable.castAsync(callback(value));
		
		let completed = false;
		const concatMapObserver = Object.setPrototypeOf({complete: () => completed = true}, observer);
		
		subscription = observable
			.finalize(() => {
				if (completed) {
					running = false;
					doQueue();
				}
			})
			.subscribe(concatMapObserver);
	}
	
	return {
		next(value) {
			queue.push(value);
			doQueue();
		},
		
		complete() {
			sourceCompleted = true;
			if (queue.length === 0 && running === false) {
				observer.complete();
			}
		},
		
		finalize() {
			queue.length = 0;
			if (subscription) subscription.unsubscribe();
		}
	}
});


/// -------------------------------------------------------------------------------------------
/// Static Operators
/// -------------------------------------------------------------------------------------------
Observable.never = () => new Observable(noop);
Observable.empty = () => new Observable(observer => observer.complete());

Observable.NEVER = Observable.never();
Observable.EMPTY = Observable.empty();


/// -------------------------------------------------------------------------------------------
/// Creation
/// -------------------------------------------------------------------------------------------
Observable.defer = (callback, thisObj, ...args) => new Observable(observer =>
	Observable.castAsync(Function.prototype.apply.call(callback, thisObj, args)).subscribe(observer)
);

Observable.timeout = (timeout, value) => new Observable((observer, id) => {
	id = setTimeout(() => {
		observer.next(value);
		observer.complete();
	}, timeout);
	
	return () => clearTimeout(id);
});

Observable.interval = (timeout) => new Observable((observer, i = 0, id) => {
	id = setInterval(() => observer.next(i++), timeout);
	return () => clearInterval(id);
});

Observable.fromEvent = (el, type, useCapture) => new Observable(observer => {
	type = _.castArray(type);
	const handler = observer.next.bind(observer);
	type.forEach(type => el.addEventListener(type, handler, useCapture));
	return () => type.forEach(type => el.removeEventListener(type, handler, useCapture));
}).share();

Observable.throwError = Observable.throw = (error) => new Observable(observer => observer.error(error));

Observable.fromPromise = (promise) => new Observable(observer => {
	promise.then(
		res => {
			observer.next(res);
			observer.complete();
		},
		
		err => observer.error(err)
	)
});


/// -------------------------------------------------------------------------------------------
/// Utils
/// -------------------------------------------------------------------------------------------
// @FIXME: 내가 만든거
Observable.castAsync = (value) => {
	if (value instanceof Observable) {
		return value;
	}
	
	if (value instanceof Promise) {
		return Observable.fromPromise(value);
	}
	
	if (typeof value === "function") {
		return Observable.defer(value);
	}
	
	return Observable.of(value);
};


/// -------------------------------------------------------------------------------------------
/// Combination
/// -------------------------------------------------------------------------------------------
Observable.forkjoin = (...observables) => new Observable(observer => {
	let ret = new Array(observables.length);
	let count = 0;
	
	if (ret.length === 0) {
		observer.next(ret);
		observer.complete();
		return;
	}
	
	observables.forEach((observable, index) => {
		observable.last().subscribe(value => {
			ret[index] = value;
			if (++count === ret.length) {
				observer.next(ret);
				observer.complete();
			}
		});
	})
});

Observable.concat = (...observables) => Observable.of(...observables).concatMap(Observable.castAsync);

Observable.zip = (...observables) => new Observable(observer => {
	const stack = new Array(observables.length).fill(null).map(() => []);
	const subscriptions = observables.map((observable, index) => {
		
		return observable.subscribe(value => {
			stack[index].push(value);
			
			if (stack.every(v => v.length > 0)) {
				const ret = [];
				stack.forEach(v => ret.push(v.shift()));
				observer.next(ret);
			}
		});
	});
	
	return () => {
		for (const s of subscriptions) s.unsubscribe();
	}
});


Observable.merge = (...observables) => new Observable(observer => {
	const length = observables.length;
	let count = 0;
	
	const mergeObserver = Object.setPrototypeOf({
		complete() {
			if (++count === length) {
				observer.complete();
			}
		}
	}, observer);
	
	const subscriptions = observables.map(observable => observable.subscribe(mergeObserver));
	
	return () => {
		for (const s of subscriptions) s.unsubscribe();
	}
});


Observable.combine = Observable.combineLatest = (...observables) => new Observable(observer => {
	const arr = Array(observables.length);
	
	if (!arr.length) {
		observer.next([]);
		observer.complete();
		return;
	}
	
	const combine = (observable, index) => observable.subscribe({
		next(value) {
			arr[index] = value;
			
			let count = 0;
			arr.forEach(() => count++);
			
			if (count === arr.length) {
				observer.next(arr);
			}
		},
		
		error(error) {
			observer.error(error);
		},
		
		complete() {
		
		}
	});
	
	const subscriptions = observables.map(combine);
	
	return () => {
		for (const s of subscriptions) s.unsubscribe();
	}
});


Observable.combineAnyway = (...observables) => {
	return new Observable(observer => {
		let arr = Array(observables.length);
		
		if (!arr.length) {
			observer.next([]);
			observer.complete();
			return;
		}
		
		for (let i = 0; i < arr.length; i++) {
			arr[i] = undefined;
		}
		
		const combine = (observable, index) => observable.subscribe({
			next(value) {
				arr[index] = value;
				observer.next(arr);
			},
			
			error(error) {
				observer.error(error);
			},
			
			complete() {
			
			}
		});
		
		const subscriptions = observables.map(combine);
		
		return () => {
			for (const s of subscriptions) s.unsubscribe();
		}
	});
};


Observable.reducer = function() {
	const reducers = Array.from(arguments);
	
	return new Observable(_observer => {
		let value;
		
		const observer = Object.setPrototypeOf({
			next(_value) {
				value = _value;
				_observer.next(value);
			}
		}, _observer);
		
		
		const subscriptions = [];
		
		for (const reducer of reducers) {
			
			if (reducer instanceof Observable) {
				const subscription = reducer.subscribe(payload => {
					
					if (payload instanceof Observable) {
						payload.subscribe(observer);
						return;
					}
					
					if (typeof payload === "function") {
						payload = payload(value);
					}
					
					observer.next(payload);
				});
				
				subscriptions.push(subscription);
				continue;
			}
			
			observer.next(reducer);
		}
		
		return () => {
			for (const s of subscriptions) s.unsubscribe();
		}
		
	}).shareReplay(1);
};


/// 임시 Operators
Observable.operators = {
	catch: catchError,
	catchError,
	concat,
	concatMap,
	connectMap,
	count,
	debounce,
	debug,
	delay,
	distinctUntilChanged,
	duration,
	exhaustMap,
	filter,
	finalize,
	initialize,
	last,
	map,
	mapTo,
	mergeAll,
	mergeMap,
	reject,
	retry,
	scan,
	share,
	shareReplay,
	skip,
	startWith,
	switchMap,
	tap,
	take,
	takeLast,
	takeUntil,
	takeWhile,
	timeout,
	timeoutFirstOnly,
	throttle,
	throttleTime,
	trace,
	withLatestFrom,
	until
};

for (const [key, value] of Object.entries(Observable.operators)) {
	if (!Observable.prototype[key]) {
		Observable.prototype[key] = function(...args) { return this.pipe(value(...args)) }
	}
}