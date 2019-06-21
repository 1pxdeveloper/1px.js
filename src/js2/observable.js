(function() {
	"use strict";
	
	if (!Symbol.observable) {
		Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});
	}
	
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
			
			let cls = typeof this === "function" ? this : Observable;
			
			// observable
			let method = x[Symbol.observable];
			if (method) {
				let observable = method.call(x);
				
				if (Object(observable) !== observable)
					throw new TypeError(observable + " is not an object");
				
				if (observable instanceof cls)
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
	
	function callMethod(obj, key, value) {
		let fn = obj[key];
		if (!fn) return;
		if (typeof fn !== "function") throw TypeError(fn + " is not function");
		return fn.call(obj, value);
	}
	
	class Subscription {
		constructor(observer, subscriber) {
			this._cleanup = undefined;
			this._observer = observer;
			
			callMethod(observer, "start", this);
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
			callMethod(this._subscription._observer, "next", value);
		}
		
		error(err) {
			if (this.closed) return;
			console.error(err);
			callMethod(this._subscription._observer, "error", err);
			cleanupSubscription(this._subscription);
		}
		
		complete() {
			if (this.closed) return;
			callMethod(this._subscription._observer, "complete");
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
				},
			}
		});
	};
	
	
	Observable.prototype.map = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					observer.next(fn(...arguments));
				},
			}
		});
	};
	
	Observable.prototype.do = function(fn) {
		return this.pipe(observer => {
			return {
				next(value) {
					fn(value);
					observer.next(value);
				},
			}
		});
	};
	
	
	Observable.prototype.complete = function(fn) {
		
		return this.pipe(observer => {
			return {
				complete() {
					fn();
					observer.complete();
				},
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
				},
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
				},
			})
		});
	};
	
	
	Observable.prototype.filter = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					fn.apply(observer, arguments) && observer.next(...arguments);
				},
			}
		});
	};
	
	Observable.prototype.take = function(num) {
		
		let count = 0;
		return this.pipe(observer => {
			return {
				next(value) {
					observer.next(value);
					if (++count >= num) {
						observer.complete();
					}
				},
			}
		});
	};
	
	Observable.prototype.takeUntil = function(observable$) {
		return new Observable(observer => {
			let s = this.subscribe(observer);
			let stop = s.unsubscribe.bind(s);
			observable$.subscribe(stop, stop, stop);
		});
	};
	
	
	Observable.prototype.toPromise = function() {
		return new Promise((resolve, reject) => {
			let _value;
			this.subscribe({
				next(value) {
					_value = value;
				},
				
				error(error) {
					reject(error);
				},
				
				complete() {
					resolve(_value);
				}
			})
		});
	};
	
	
	Observable.prototype.share = function() {
		let observers = [];
		let subscription;
		
		return new Observable(observer => {
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
				},
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
				},
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
		
		
		return new Observable(observer => {
			
			let index = 0;
			let len = observables.length;
			
			let s = observables.map(observable => {
				
				return observable.subscribe({
					next(value) {
						observer.next(value)
					},
					error(err) {
						observer.error(err)
					},
					complete() {
						index++;
						if (len === index) {
							observer.complete();
						}
					},
				});
			});
			
			return function() {
				s.forEach(s => s.unsubscribe());
			}
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
	
})();