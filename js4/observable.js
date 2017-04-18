(function(window) {

	function noop() {}

	class Observable {
		constructor(subscriber) {
			this._subscriber = subscriber;
		}

		subscribe(observer, error, complete) {

			if (typeof observer === "function") {
				observer = {next: observer};
				error && (observer.error = error);
				complete && (observer.complete = complete);
			}

			else if (Object(observer) !== observer) {
				observer = {};
			}

			return new Subscription(this._subscriber, observer);
		}

		static of(...items) {
			return new Observable(observer => {
				for (let item of items) {
					observer.next(item);
					if (observer.closed) {
						return;
					}
				}

				observer.complete();
			});
		}
	}

	class Subscription {
		constructor(subscriber, observer) {
			observer = new SubscriptionObserver(this, observer);

			this._cleanup = noop;

			try {
				let cleanup = subscriber(observer);

				if (cleanup instanceof Subscription) {
					this._cleanup = function() { cleanup.unsubscribe(); }
				}
				else if (typeof cleanup === "function") {
					this._cleanup = cleanup;
				}
			}
			catch (err) {
				observer.error(err);
			}

			if (this.closed) {
				this._cleanup();
				delete this._cleanup;
			}
		}

		unsubscribe() {
			if (this.closed) return;
			this._cleanup();
			delete this._cleanup;
		}

		get closed() {
			return this._cleanup === undefined;
		}
	}

	class Observer {
		start() {}

		next() {}

		error() {}

		complete() {}
	}

	class SubscriptionObserver {

		constructor(subscription, observer) {
			this._subscription = subscription;
			this._observer = Object.assign(new Observer(), observer instanceof SubscriptionObserver ? observer._observer : observer);
			this._observer.start(subscription);
		}

		next(...value) {
			if (this.closed) return;
			this._observer.next.apply(this._subscription, value);
		}

		error(...err) {
			if (this.closed) return;
			this._observer.error.apply(this._subscription, err);
		}

		complete() {
			if (this.closed) return;
			this._observer.complete.apply(this._subscription);
			this._subscription.unsubscribe();
		}

		get closed() {
			return this._subscription.closed;
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


	Observable.prototype.map = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					observer.next(fn.apply(observer, arguments));
				}
			}
		});
	};


	Observable.prototype.filter = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					fn.apply(observer, arguments) && observer.next.apply(observer, arguments);
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
					next(...value) {
						observers.forEach((observer) => observer.next.apply(observer, value));
					},

					error(...err) {
						observers.forEach((observer) => observer.error.apply(observer, err));
					},

					complete() {
						observers.forEach((observer) => observer.complete());
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


	/// Static
	Observable.empty = new Observable(noop);
	Observable.never = new Observable(observer => observer.complete());

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



	window.Observable = Observable;

})(window);


