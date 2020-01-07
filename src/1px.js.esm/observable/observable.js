if (!Symbol.observable) {
	Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});
}

class Observable {
	constructor(subscriber) {
		if (typeof subscriber !== "function") {
			throw new TypeError("Observable initializer must be a function.");
		}

		this._subscriber = subscriber;
	}

	subscribe(observer, error, complete) {
		if (typeof observer === "function") {
			observer = {next: observer, error, complete};
		}
		else if (typeof observer !== "object") {
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

		const cls = typeof this === "function" ? this : Observable;

		// observable
		let method = x[Symbol.observable];
		if (method) {
			let observable = method.call(x);

			if (Object(observable) !== observable) {
				throw new TypeError(observable + " is not an object");
			}

			if (observable instanceof cls) {
				return observable;
			}

			return new cls(observer => observable.subscribe(observer));
		}


		// iteratorable
		method = x[Symbol.iterator];
		if (method) {
			return new cls(observer => {
				for (const item of method.call(x)) {
					observer.next(item);
					if (observer.closed) {
						return;
					}
				}

				observer.complete();
			});
		}

		throw new TypeError(x + " is not observable");
	}

	static of(...items) {
		const cls = typeof this === "function" ? this : Observable;

		return new cls(observer => {
			for (const item of items) {
				observer.next(item);
				if (observer.closed) {
					return;
				}
			}

			observer.complete();
		});
	}
}

Observable.hostErrorHandler = (error) => {
	if (error instanceof Error) {
		console.error(error);
	}
};


function cleanupSubscription(subscription) {
	delete subscription._observer;

	let cleanup = subscription._cleanup;
	delete subscription._cleanup;

	if (cleanup) cleanup();
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

			if (cleanup instanceof Subscription) {
				this._cleanup = () => cleanup.unsubscribe();
			}
			else if (typeof cleanup === "function") {
				this._cleanup = cleanup;
			}
		} catch (e) {
			Observable.hostErrorHandler(e);
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
		try {
			if (this._subscription._observer.next) this._subscription._observer.next(value);
		} catch (error) {
			Observable.hostErrorHandler(error);
			this.error(error);
		}
	}

	error(error) {
		if (this.closed) return;
		try {
			if (this._subscription._observer.error) this._subscription._observer.error(error);
			cleanupSubscription(this._subscription);
		} catch (error) {
			Observable.hostErrorHandler(error);
		}
	}

	complete() {
		if (this.closed) return;
		try {
			if (this._subscription._observer.complete) this._subscription._observer.complete();
			cleanupSubscription(this._subscription);
		} catch (error) {
			Observable.hostErrorHandler(error);
		}
	}
}


/// -------------------------------------------------------------------------------------------
/// Subject
/// -------------------------------------------------------------------------------------------
class Subject extends Observable {
	constructor() {
		super(observer => {
			if (this.closed) return;
			this.observers.push(observer);
			return () => this.observers = this.observers.filter(o => o !== observer);
		});

		this.observers = [];
	}

	get closed() {
		return this.observers === undefined;
	}

	next(value) {
		if (this.closed) return;
		for (const observer of this.observers) observer.next(value);
	}

	error(error) {
		if (this.closed) return;
		for (const observer of this.observers) observer.error(error);
		delete this.observers;
	}

	complete() {
		if (this.closed) return;
		for (const observer of this.observers) observer.complete();
		delete this.observers;
	}
}


class BehaviorSubject extends Subject {
	constructor(value) {
		super();
		if (arguments.length > 0) {
			this.value = value;
		}

		let _subscriber = this._subscriber;
		this._subscriber = (observer) => {
			if (this.closed) return;
			if (arguments.length > 0) {
				observer.next(this.value);
			}
			return _subscriber.call(null, observer);
		}
	}

	next(value) {
		this.value = value;
		super.next(value);
	}
}

class AsyncSubject extends Subject {
	constructor() {
		super();

		this._subscriber = (_subscriber => (observer) => {
			if (this.closed) {
				observer.next(this.value);
				observer.complete();
				return;
			}

			return _subscriber.call(null, observer);
		})(this._subscriber)
	}

	next(value) {
		if (this.closed) return;
		this.value = value;
	}

	complete() {
		if (this.closed) return;
		for (const observer of this.observers) observer.next(this.value);
		super.complete();
	}
}


class ReplaySubject extends Subject {
	constructor(bufferSize) {
		super();

		this.value = [];
		this.bufferSize = bufferSize;

		this._subscriber = (_subscriber => (observer) => {
			for (const value of this.value) {
				observer.next(value);
			}

			if (this.closed) {
				observer.complete();
				return;
			}

			return _subscriber.call(null, observer);

		})(this._subscriber)
	}

	next(value) {
		if (this.closed) return;
		this.value.push(value);
		this.value = this.value.slice(-this.bufferSize);
		super.next(value);
	}
}


export {
	Observable,
	Subject,
	AsyncSubject,
	BehaviorSubject,
	ReplaySubject
}