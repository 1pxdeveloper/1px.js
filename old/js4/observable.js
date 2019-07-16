Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});

class Observable {
	constructor(subscriber) {
		if (typeof subscriber !== "function") {
			throw new TypeError("Observable initializer must be a function");
		}

		this._subscriber = subscriber;
	}

	subscribe(observer, error, complete) {
		if (typeof observer === "function") {
			observer = {next: observer, error, complete};
		} else if (typeof observer !== "object") {
			observer = {};
		}

		return new Subscription(observer, this._subscriber);
	}

	[Symbol.observable]() {
		return this;
	}

	static from(x) {
		if (Object(x) !== x) {
			throw new TypeError(x + " is not an object");
		}

		let cls = typeof this === "function" ? this : Observable;

		// observable
		let method = x[Symbol.observable];
		if (method) {
			let observable = method.call(x);

			if (Object(observable) !== observable)
				throw new TypeError(observable + " is not an object");

			if (observable.constructor === cls)
				return observable;

			return new cls(observer => observable.subscribe(observer));
		}


		// iteratorable
		method = x[Symbol.iterator];
		if (!method) {
			throw new TypeError(x + " is not observable");
		}

		return new cls(observer => {

			for (let item of method.call(x)) {
				observer.next(item);
				if (observer.closed)
					return;
			}

			observer.complete();
		});
	}

	static of(...items) {
		let cls = typeof this === "function" ? this : Observable;

		return new cls(observer => {
			for (let item of items) {
				observer.next(item);
				if (observer.closed)
					return;
			}

			observer.complete();
		});
	}
}

function cleanupSubscription(subscription) {
	let cleanup = subscription._cleanup;
	if (!cleanup)
		return;

	delete subscription._cleanup;
	cleanup();
}

class Subscription {
	constructor(observer, subscriber) {
		this._cleanup = undefined;
		this._observer = observer;

		observer.start && observer.start(this);
		if (this.closed) {
			return;
		}

		observer = new SubscriptionObserver(this);

		try {
			let cleanup = subscriber.call(undefined, observer);

			if (cleanup instanceof Subscription)
				this._cleanup = function() {
					cleanup.unsubscribe()
				};

			else if (typeof cleanup === "function")
				this._cleanup = cleanup;
		} catch (e) {
			console.error(e);
			observer.error(e);
			return;
		}

		if (this.closed) {
			cleanupSubscription(this);
		}
	}

	get closed() {
		return this._observer === undefined;
	}

	unsubscribe() {
		if (this.closed) return;
		delete this._observer;
		cleanupSubscription(this);
	}
}


class SubscriptionObserver {
	constructor(subscription) {
		this._subscription = subscription;
	}

	get closed() {
		return this._subscription.closed;
	}

	next(value) {
		if (this.closed) return;
		this._subscription._observer.next && this._subscription._observer.next(value);
	}

	error(value) {
		if (this.closed) return;
		this._subscription._observer.error && this._subscription._observer.error(value);
		cleanupSubscription(this._subscription);
	}

	complete() {
		if (this.closed) return;
		this._subscription._observer.complete && this._subscription._observer.complete();
		cleanupSubscription(this._subscription);
	}
}


/// Operators
Observable.prototype.pipe = function(fn) {
	return new Observable(observer => {
		let o = fn(observer) || {};
		o.next = o.next || observer.next.bind(observer);
		o.error = o.error || observer.error.bind(observer);
		o.complete = o.complete || observer.complete.bind(observer);

		return this.subscribe(o);
	});
};


Observable.prototype.count = function(fn) {
	let count = 0;

	return this.pipe(observer => {
		return {
			next() {
				count++;
			},

			complete() {
				observer.next(count);
				count = 0;
			}
		}
	});
};


Observable.prototype.map = function(fn) {
	return this.pipe(observer => {
		return {
			next() {
				observer.next(fn(...arguments));
			}
		}
	});
};

Observable.prototype.do = function(fn) {
	return this.pipe(observer => {
		return {
			next(value) {
				fn(value);
				observer.next(value);
			}
		}
	});
};


Observable.prototype.mergeMap = function(fn) {
	return this.pipe(observer => {
		return {
			next() {
				Observable.of(fn.apply(observer, arguments)).subscribe(value => {
					observer.next(value);
				});
			}
		}
	});
};


Observable.prototype.mergeAll = function() {
	return new Observable(observer => {
		let ret = [];

		this.subscribe({
			next(value) {
				ret.push(value)
			},

			complete() {
				observer.next(ret);
			}
		})
	});
};


Observable.prototype.filter = function(fn) {
	return this.pipe(observer => {
		return {
			next() {
				fn.apply(observer, arguments) && observer.next(...arguments);
			}
		}
	});
};

Observable.prototype.take = function(num) {
	let ret = [];

	return new Observable(observer => {
		this.subscribe({
			next(value) {
				ret.push(value);
				if (ret.length === num) {
					observer.next(ret);
					observer.complete();
				}
			}
		})
	})
};

Observable.prototype.takeUntil = function(observable$) {
	return new Observable(observer => {
		let s = this.subscribe(observer);
		let stop = s.unsubscribe.bind(s);


		observable$.subscribe(stop, stop, function() {


			console.log("complete!!");


			stop();


		});
	});
};


Observable.prototype.share = function() {
	let observers = [];
	let subscription;

	return new Observable(observer => {
		// console.log('share', observers.length, observers.indexOf(observer));

		observers.push(observer);

		subscription = subscription || this.subscribe({
			next(value) {
				observers.forEach(observer => observer.next(value));
			},

			error(err) {
				observers.forEach(observer => observer.error(err));
			},

			complete() {
				observers.forEach(observer => observer.complete());
			}
		});

		return function() {
			observers.splice(observers.indexOf(observer), 1);
			if (observers.length === 0) {
				subscription.unsubscribe();
			}
		}
	});
};


Observable.prototype.skip = function(count) {
	let index = 0;

	return this.pipe(observer => {
		return {
			next(value) {
				if (index++ < count) {
					return;
				}
				observer.next(value);
			},

			error() {
				index = 0;
			},

			complete() {
				index = 0;
			}
		}
	});
};


/// Static
function noop() {
}

Observable.NEVER = new Observable(noop);
Observable.empty = () => new Observable(observer => observer.complete());

Observable.interval = function(delay) {
	let i = 0;
	return new Observable(observer => {
		let id = setInterval(() => observer.next(i++), delay);
		return () => clearInterval(id);
	});
};

Observable.timeout = function(delay) {
	return new Observable(observer => {
		let id = setTimeout(() => observer.next(0), delay);
		return () => clearTimeout(id);
	});
};

Observable.fromEvent = function(el, type, useCapture) {
	return new Observable(observer => {
		function handler(event) {
			observer.next(event);
		}

		el.addEventListener(type, handler, useCapture);
		return () => el.removeEventListener(type, handler, useCapture);
	});
};

Observable.zip = function(...observables) {

	let result = new Array(observables.length);

	return new Observable(observer => {

		let s = observables.map((observable, index) => {
			return observable.subscribe(function(value) {
				result[index] = value;
				observer.next(result);
			});
		});

		return function() {
			s.forEach(subscription => subscription.unsubscribe());
		}
	});
};

Observable.merge = function(...observables) {

	let index = 0;
	let len = observables.length;

	return new Observable(observer => {

		observables.forEach(observable => {

			console.info(observable);


			return observable.subscribe({
				next(value) {
					observer.next(value)
				},
				error(err) {
					observer.error(err)
				},
				complete() {
					len++;
					if (len === index) {
						observer.complete();
					}
				}
			});
		});
	});
};

Observable.subject = function() {

	let o = new Observable(observer => {
		o.next = observer.next.bind(observer);
		o.error = observer.error.bind(observer);
		o.complete = observer.complete.bind(observer);
	}).share();

	o.next = noop;
	o.error = noop;
	o.complete = noop;

	return o;
};


exports.Observable = Observable;