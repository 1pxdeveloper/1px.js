const Observable = (function() {

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

		next() {
			if (this.closed) return;
			this._subscription._observer.next && this._subscription._observer.next(...arguments);
		}

		error(value) {
			if (this.closed) return;
			this._subscription._observer.error && this._subscription._observer.error(...arguments);
			cleanupSubscription(this._subscription);
		}

		complete() {
			if (this.closed) return;
			this._subscription._observer.complete && this._subscription._observer.complete();
			cleanupSubscription(this._subscription);
		}
	}

	return Observable;
}());


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
				observer.next(fn.apply(observer, arguments));
			}
		}
	});
};

Observable.prototype.do = function(fn) {
	return this.pipe(observer => {
		return {
			next() {
				fn.apply(observer, arguments);
				observer.next(...arguments);
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

Observable.prototype.takeUntil = function(observable$) {
	return this.pipe(function(observer) {
		function complete() {
			observer.complete();
		}

		observable$.subscribe(complete, complete, complete);
	});
};


Observable.prototype.share = function() {
	let observers = [];
	let subscription;

	return new Observable(observer => {

		observers.push(observer);

		subscription = subscription || this.subscribe({
			next() {
				observers.forEach(observer => observer.next(...arguments));
			},

			error() {
				observers.forEach(observer => observer.error(...arguments));
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
			next() {
				if (index++ < count) {
					return;
				}
				observer.next(...arguments);
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
Observable.never = new Observable(function() {
});
Observable.empty = new Observable(observer => observer.complete());

Observable.interval = function(delay) {
	let i = 0;
	return new Observable(observer => {
		let id = setInterval(() => observer.next(i++), delay);
		return () => clearInterval(id);
	});
};

Observable.timeout = function(delay) {
	return new Observable(observer => {
		setTimeout(() => observer.next(0), delay);
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
				observer.next.apply(observer, result);
			});
		});

		return function() {
			s.forEach(subscription => subscription.unsubscribe());
		}
	});
};


Observable.race = function(array) {

	let subscription = array.map(o => o.subscribe({}))
};