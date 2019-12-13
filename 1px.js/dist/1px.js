(function () {
	'use strict';

	const filterCallback = (callback) => {
		if (Object(callback) !== callback) return _$1.is(callback);
		if (typeof callback === "function") return callback;
		
		return (object) => {
			for (let [key, _callback] of Object.entries(callback)) {
				if (typeof _callback !== "function") _callback = _$1.is;
				if (_callback(object[key])) return true;
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


	const _$1 = () => {};

	/// Common
	_$1.noop = () => {};
	_$1.identity = (value) => value;
	_$1.pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
	_$1.go = (value, ...pipes) => _$1.pipe(...pipes)(value);
	_$1.itself = _$1.always = (value) => () => value;

	_$1.is = (a) => (b) => Object.is(a, b);
	_$1.isUndefined = (value) => value === undefined;
	_$1.isTrue = (value) => value === true;
	_$1.isFalse = (value) => value === false;
	_$1.isNumber = (value) => +value === value;
	_$1.isNumberLike = (value) => _$1.isNumber(+value);
	_$1.isBoolean = (value) => typeof value === "boolean";
	_$1.isString = (value) => typeof value === "string";
	_$1.isStringLike = (value) => _$1.isString(value) || _$1.isNumber(value);
	_$1.isFunction = (value) => typeof value === "function";
	_$1.isArray = (value) => Array.isArray(value);
	_$1.isArrayLike = (value) => Array.isArray(value) || Object(value) === value && "number" === typeof value.length;
	_$1.isObject = (value) => Object(value) === value;
	_$1.isNil = (value) => value === undefined || value === null;

	_$1.isNot = (a) => (b) => !Object.is(a, b);

	_$1.hasLength = (value) => value.length && value.length > 0;
	_$1.instanceof = (constructor) => (object) => (object instanceof constructor);


	/// Array
	_$1.slice = (start, end) => (a) => a.slice(start, end);

	_$1.map = (callback) => (a) => a.map(mapCallback(callback));
	_$1.filter = (callback) => (a) => a.filter(filterCallback(callback));
	_$1.every = (callback) => (a) => a.every(filterCallback(callback));
	_$1.some = (callback) => (a) => a.some(filterCallback(callback));

	_$1.remove = (callback) => _$1.filter(_$1.not(callback));
	_$1.removeItem = (item) => _$1.remove(_$1.is(item));
	_$1.append = _$1.push = (item) => (array) => [...array, item];
	_$1.prepend = _$1.unshift = (item) => (array) => [item, ...array];
	_$1.patch = (target, object) => _$1.map(item => item !== target ? item : ({...item, ...object}));
	_$1.patchAll = (object) => _$1.map(item => ({...item, ...object}));

	_$1.sort = (callback) => (array) => (array => (array.sort(callback), array))(array.slice());

	_$1.replaceIndex = (object, index) => (array) => {
		if (index < 0) index = array.length + index;
		const r = array.slice();
		r[index] = object;
		return r;
	};

	_$1.last = (array) => array[array.length - 1];


	/// Object
	_$1.cloneObject = (obj) => {
		const type = _$1.typeof(obj);
		if ("object" === type || "array" === type) {
			if ("function" === typeof obj.clone) {
				return obj.clone();
			}
			
			let clone = "array" === type ? [] : {}, key;
			for (key in obj) {
				clone[key] = _$1.cloneObject(obj[key]);
			}
			return clone;
		}
		
		return obj;
	};

	_$1.merge = (object) => (source) => ({...source, ...object});
	_$1.defaults = (object) => (source) => ({...object, ...source});
	_$1.mapValues = (callback) => (object) => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapCallback(callback)(value)]));


	/// Function
	_$1.apply = (func, thisObj) => (args) => Function.prototype.apply.call(func, thisObj, args);
	_$1.not = (func) => (...args) => !func(...args);
	_$1.spread = (callback) => (array) => callback(...array);
	_$1.memoize1 = (func) => {
		const cache = Object.create(null);
		return (key, ...args) => {
			return (cache[key] = key in cache ? cache[key] : func(key, ...args));
		};
	};


	/// Util
	_$1.typeof = (value) => {
		const s = typeof value;
		
		if ("object" === s) {
			if (value) {
				if (value instanceof Array) {
					return "array";
				}
				if (value instanceof Object) {
					return s;
				}
				
				const className = Object.prototype.toString.call(value);
				
				if ("[object Window]" === className) {
					return "object";
				}
				
				if ("[object Array]" === className || "number" == typeof value.length && "undefined" != typeof value.splice && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("splice")) {
					return "array";
				}
				
				if ("[object Function]" === className || "undefined" != typeof value.call && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("call")) {
					return "function";
				}
			}
			else {
				return "null";
			}
		}
		else {
			if ("function" === s && "undefined" == typeof value.call) {
				return "object";
			}
		}
		
		return s;
	};

	_$1.identity = _$1.exist = (value) => value;
	_$1.toType = (obj) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
	_$1.castArray = (a) => _$1.isArray(a) ? a : [a];
	_$1.with = _$1.alias = (...args) => (callback) => callback(...args);
	_$1.throw = (error) => () => { throw error; };
	_$1.if = (cond, callback, elseCallback = _$1.itself) => (value) => cond(value) ? callback(value) : elseCallback(value);
	_$1.cond = (pairs) => (...args) => {
		for (const [predicate, transform] of pairs) {
			if (predicate(...args)) {
				return transform(...args);
			}
		}
	};
	_$1.switch = (table) => (id) => table[id];
	_$1.if = (cond, callback, elseCallback = _$1.identity) => (value) => cond(value) ? callback(value) : elseCallback(value);


	/// String
	_$1.capitalize = (string) => string.slice(0, 1).toUpperCase() + string.slice(1);
	_$1.trim = (string) => _$1.isStringLike(string) ? String(string).trim() : "";
	_$1.split = (...args) => (string) => string.split(...args);
	_$1.splitAt = (index) => (string) => [string.slice(0, index), string.slice(index)];
	_$1.rpartition = (sep) => (string) => {
		const lastIndex = string.lastIndexOf(sep);
		if (lastIndex === -1) return [string, "", ""];
		return [string.slice(0, lastIndex), string.slice(lastIndex, lastIndex + sep.length), string.slice(lastIndex + sep.length)];
	};
	_$1.startsWith = (searchString, position) => (string) => String(string).startsWith(searchString, position);


	/// Effect
	_$1.log = (...args) => console.log.bind(console, ...args);
	_$1.warn = (...args) => console.warn.bind(console, ...args);


	(function() {
		let $uuid = 0;
		
		_$1.debug = {};
		
		_$1.debug.group = (...args) => {
			console.group(...args);
			return $uuid++;
		};
		
		_$1.debug.groupEnd = (uuid = ($uuid - 1)) => {
			console.groupEnd();
			return;
		};
	})();


	/// JSON
	_$1.json = {};
	_$1.json.parse = JSON.parse.bind(JSON);
	_$1.json.stringify = JSON.stringify.bind(JSON);


	/// localStorage
	_$1.localStorage = {};
	_$1.localStorage.getItem = (key, defaults) => JSON.parse(localStorage.getItem(key)) || defaults;
	_$1.localStorage.setItem = (key) => (value) => localStorage.setItem(key, JSON.stringify(value));


	/// requestAnimationFrame
	_$1.rAF = window.requestAnimationFrame.bind(window);
	_$1.rAF.cancel = window.cancelAnimationFrame.bind(window);


	/// window
	_$1.alert = (...args) => window.alert(...args);


	/// LCS
	_$1.LCS = (s1, s2) => {
		s1 = s1 || [];
		s2 = s2 || [];
		
		let M = [];
		for (let i = 0; i <= s1.length; i++) {
			M.push([]);
			
			for (let j = 0; j <= s2.length; j++) {
				let currValue = 0;
				if (i === 0 || j === 0) {
					currValue = 0;
				}
				else if (s1[i - 1] === s2[j - 1]) {
					currValue = M[i - 1][j - 1] + 1;
				}
				else {
					currValue = Math.max(M[i][j - 1], M[i - 1][j]);
				}
				
				M[i].push(currValue);
			}
		}
		
		let i = s1.length;
		let j = s2.length;
		
		// let s3 = [];
		let s4 = Array(i).fill(null);
		let s5 = Array(j).fill(null);
		
		while(M[i][j] > 0) {
			if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
				// s3.unshift(s1[i - 1]);
				
				s4[i - 1] = s1[i - 1];
				s5[j - 1] = s1[i - 1];
				
				i--;
				j--;
			}
			else if (M[i - 1][j] > M[i][j - 1]) {
				i--;
			}
			else {
				j--;
			}
		}
		
		return [s4, s5];
	};


	_$1.importScripts = (...sources) => {
		const script = Array.from(document.querySelectorAll("script")).pop();
		const prefix = script.src.slice(0, script.src.lastIndexOf("/") + 1);
		for (const src of sources) document.write(`<script src="${prefix}${src}"></script>`);
	};

	if (!Symbol.observable) {
		Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});
	}

	class Observable$1 {
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
			
			const cls = typeof this === "function" ? this : Observable$1;
			
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
			const cls = typeof this === "function" ? this : Observable$1;
			
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
				if (error instanceof Error) console.error(error);
				this.error(error);
			}
		}
		
		error(error) {
			if (this.closed) return;
			try {
				if (this._subscription._observer.error) this._subscription._observer.error(error);
				cleanupSubscription(this._subscription);
			} catch (error) {
				if (error instanceof Error) console.error(error);
			}
		}
		
		complete() {
			if (this.closed) return;
			try {
				if (this._subscription._observer.complete) this._subscription._observer.complete();
				cleanupSubscription(this._subscription);
			} catch (error) {
				if (error instanceof Error) console.error(error);
			}
		}
	}


	/// -------------------------------------------------------------------------------------------
	/// Subject
	/// -------------------------------------------------------------------------------------------
	class Subject extends Observable$1 {
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
			};
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
			})(this._subscriber);
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
				
			})(this._subscriber);
		}
		
		next(value) {
			if (this.closed) return;
			this.value.push(value);
			this.value = this.value.slice(-this.bufferSize);
			super.next(value);
		}
	}

	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const noop = () => {};
	const just = _ => _;

	const pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);

	const lift = (callback) => (observable) => new Observable$1(observer => {
		const o = callback(observer) || {};
		const s = observable.subscribe(Object.setPrototypeOf(o, observer));
		return () => {
			s.unsubscribe();
			o.finalize && o.finalize();
		}
	});

	const filterCallback$1 = (callback) => {
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

	const mapCallback$1 = (callback) => {
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


	Observable$1.prototype.pipe = function(...operators) { return pipe(...operators)(this) };
	Observable$1.prototype.lift = function(callback) { return lift(callback)(this) };

	Observable$1.prototype.toPromise = function() {
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
			});
		});
	};

	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const map = (callback) => lift((observer, index = 0) => ({
		next(value) {
			observer.next(mapCallback$1(callback)(value, index++));
		}
	}));

	const mapTo = (value) => lift(observer => ({
		next() {
			observer.next(value);
		}
	}));

	const filter = (callback) => lift((observer, index = 0) => ({
		next(value) {
			if (filterCallback$1(callback)(value, index++)) observer.next(value);
		}
	}));

	const scan = (accumulator, seed) => lift((observer, ret = seed) => ({
		next(value) {
			observer.next((ret = accumulator(ret, value)));
		}
	}));

	const reject = (callback) => filter((...args) => !filterCallback$1(callback)(...args));

	const tap = (onNext, onError = noop, onComplete = noop) => {
		if (!_.isFunction(onNext)) onNext = noop;
		if (!_.isFunction(onError)) onError = noop;
		if (!_.isFunction(onComplete)) onComplete = noop;
		
		return lift((observer, index = 0) => ({
			next(value) {
				onNext(value, index++);
				observer.next(value);
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
			if (count <= 0) observer.complete();
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

	const initialize = (initialize) => (observable) => new Observable$1(observer => {
		
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
		next() { count++; },
		complete() { observer.next(count); }
	}));


	const concat = (...observables) => (observable) => Observable$1.concat(observable, ...observables);

	const startWith = (value) => (observable) => Observable$1.of(value).concat(observable);

	const skip = (count) => (observable) => observable.filter((value, index) => index >= count);

	const last = () => lift((observer, ret) => ({
		next(value) {ret = value;},
		
		complete() {
			observer.next(ret);
			observer.complete();
		}
	}));


	const catchError = (callback) => (observable) => {
		const caught = observable.lift(o => ({
			error: noop
		}));
		return observable.lift((observer) => ({
			next(value) {
				observer.next(value);
			},
			
			error(error) {
				// if (okay) return observer.error(error);
				const o$ = callback(error, caught) || Observable$1.EMPTY; /// @FIXME:.. Observable.async 이런거 해야되나??
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


	const timeoutFirstOnly = (timeout) => lift((observer, id) => ({
		start() {
			clearTimeout(id);
			id = setTimeout(() => {
				observer.error();/// @TODO: 여기에 뭘 보내야 할까??
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
			console.log(...tag, ".next", value);
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
			
			s = Observable$1.castAsync(callback(value)).subscribe({
				complete() {
					pending = false;
				}
			});
		},
		
		finalize() {
			if (s) s.unsubscribe();
		}
	}));

	const throttleTime = (duration) => throttle(() => Observable$1.timeout(duration));

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
						observer.error(error);
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
		return new Observable$1(observer => {
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
		return new Observable$1(observer => {
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
		next(value) { ret.push(value); },
		complete() { observer.next(ret); }
	}));


	/// @TODO: inclusive
	const takeWhile = (callback = just, inclusive) => lift((observer, index = 0) => ({
		next(value) {
			Observable$1.castAsync(callback(value, index++)).subscribe(cond => {
				observer.next(value);
				if (!cond) observer.complete();
			});
		}
	}));


	const share = () => (observable) => {
		let subscription, observers = [];
		
		return new Observable$1(observer => {
			observers.push(observer);
			
			subscription = subscription || observable.subscribe({
				next(value) { for (const observer of observers) observer.next(value); },
				error(error) { for (const observer of observers) observer.error(error); },
				complete() { for (const observer of observers) observer.complete(); }
			});
			
			return function() {
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
		
		return new Observable$1(observer => {
			if (subscription) {
				console.warn("shareReplay", "hassubscription", buffer);
				
				
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
					for (const observer of observers) observer.next(value);
					buffer.push(value);
					buffer = buffer.slice(-bufferSize);
					
					
					console.warn("shareReplay", buffer);
				},
				
				error(error) {
					for (const observer of observers) observer.error(error);
				},
				
				complete() {
					for (const observer of observers) observer.complete();
				}
			});
			
			return function() {
				observers = observers.filter(o => o !== observer);
				
				if (observers.length === 0) {
					subscription.unsubscribe();
					// subscription = null;
				}
			}
		});
	};


	const retry = (count = Infinity, error) => (observable) => {
		if (count <= 0) {
			return Observable$1.throw(error);
		}
		
		return new Observable$1(observer => {
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
				subscriptions.push(Observable$1.castAsync(callback(value)).subscribe(mergeMapObserver));
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
		
		const complete = () => completed && subscription.closed && observer.complete();
		const switchMapObserver = Object.setPrototypeOf({complete}, observer);
		
		return {
			next(value) {
				if (subscription) subscription.unsubscribe();
				subscription = Observable$1.castAsync(callback(value)).subscribe(switchMapObserver);
			},
			
			complete() {
				completed = true;
				complete();
			},
			
			finalize() {
				if (subscription) subscription.unsubscribe();
			}
		}
	});


	const exhaustMap = (callback = just) => lift(observer => {
		let completed = false;
		let subscription;
		
		const complete = () => completed && (!subscription || (subscription && subscription.closed)) && observer.complete();
		const exhaustMapObserver = Object.setPrototypeOf({complete}, observer);
		
		return {
			next(value) {
				if (subscription && !subscription.closed) return;
				subscription = Observable$1.castAsync(callback(value)).subscribe(exhaustMapObserver);
			},
			
			complete() {
				completed = true;
				complete();
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
				
				console.warn("connectMap", "next", value);
				
				
				if (subscription) subscription.unsubscribe();
				subscription = Observable$1.castAsync(callback(value)).subscribe(observer);
			},
			
			complete() {},
			
			finalize() {
				if (subscription) subscription.unsubscribe();
			}
		}
	});


	const concatMap = (callback = just) => lift(observer => {
		
		const queue = [];
		
		let allSourceCompleted = false;
		let running = false;
		let subscription;
		
		function doQueue() {
			if (running) return;
			
			if (queue.length === 0) {
				if (allSourceCompleted) {
					observer.complete();
				}
				return;
			}
			
			running = true;
			const value = queue.shift();
			const observable = Observable$1.castAsync(callback(value));
			
			let completed = false;
			const _observer = Object.setPrototypeOf({complete: () => completed = true}, observer);
			
			subscription = observable
				.finalize(() => {
					if (completed) {
						running = false;
						doQueue();
					}
				})
				.subscribe(_observer);
		}
		
		return {
			next(value) {
				queue.push(value);
				doQueue();
			},
			
			complete() {
				allSourceCompleted = true;
				if (running === false && queue.length === 0) {
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
	Observable$1.never = () => new Observable$1(noop);
	Observable$1.empty = () => new Observable$1(observer => observer.complete());

	Observable$1.NEVER = Observable$1.never();
	Observable$1.EMPTY = Observable$1.empty();


	/// -------------------------------------------------------------------------------------------
	/// Creation
	/// -------------------------------------------------------------------------------------------
	Observable$1.defer = (callback, thisObj, ...args) => new Observable$1(observer =>
		Observable$1.castAsync(Function.prototype.apply.call(callback, thisObj, args)).subscribe(observer)
	);

	Observable$1.timeout = (timeout, value) => new Observable$1((observer, id) => {
		id = setTimeout(() => {
			observer.next(value);
			observer.complete();
		}, timeout);
		
		return () => clearTimeout(id);
	});

	Observable$1.interval = (timeout) => new Observable$1((observer, i = 0, id) => {
		id = setInterval(() => observer.next(i++), timeout);
		return () => clearInterval(id);
	});

	Observable$1.fromEvent = (el, type, useCapture) => new Observable$1(observer => {
		type = _.castArray(type);
		const handler = observer.next.bind(observer);
		type.forEach(type => el.addEventListener(type, handler, useCapture));
		return () => type.forEach(type => el.removeEventListener(type, handler, useCapture));
	}).share();

	Observable$1.throwError = Observable$1.throw = (error) => new Observable$1(observer => observer.error(error));

	Observable$1.fromPromise = (promise) => new Observable$1(observer => {
		promise.then(
			res => {
				observer.next(res);
				observer.complete();
			},
			
			err => observer.error(err)
		);
	});


	/// -------------------------------------------------------------------------------------------
	/// Utils
	/// -------------------------------------------------------------------------------------------
	// @FIXME: 내가 만든거
	Observable$1.fromAsync = Observable$1.castAsync = (value) => {
		if (value instanceof Observable$1) {
			return value;
		}
		
		if (value instanceof Promise) {
			return Observable$1.fromPromise(value);
		}
		
		if (typeof value === "function") {
			return Observable$1.defer(value);
		}
		
		return Observable$1.of(value);
	};


	/// -------------------------------------------------------------------------------------------
	/// Combination
	/// -------------------------------------------------------------------------------------------
	Observable$1.forkjoin = (...observables) => new Observable$1(observer => {
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
		});
	});

	Observable$1.concat = (...observables) => Observable$1.of(...observables).concatMap(Observable$1.castAsync);

	Observable$1.zip = (...observables) => new Observable$1(observer => {
		const stack = new Array(observables.length).fill(null).map(() => []);
		const subscriptions = observables.map((observable, index) => {
			
			return observable.subscribe(value => {
				stack[index].push(value);
				// console.log(JSON.stringify(stack), index);
				
				if (stack.every(v => v.length > 0)) {
					const ret = [];
					stack.forEach(v => ret.push(v.shift()));
					observer.next(ret);
				}
			});
		});
		
		return function() {
			for (const s of subscriptions) s.unsubscribe();
		}
	});


	Observable$1.merge = (...observables) => new Observable$1(observer => {
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


	Observable$1.combine = Observable$1.combineLatest = (...observables) => new Observable$1(observer => {
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
		
		return function() {
			for (const s of subscriptions) s.unsubscribe();
		}
	});


	Observable$1.combineAnyway = function(...observables) {
		return new Observable$1(observer => {
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
			
			return function() {
				for (const s of subscriptions) s.unsubscribe();
			}
		});
	};


	Observable$1.reducer = function() {
		const reducers = Array.from(arguments);
		
		return new Observable$1(_observer => {
			let value;
			
			const observer = Object.setPrototypeOf({
				next(_value) {
					value = _value;
					_observer.next(value);
				}
			}, _observer);
			
			
			const subscriptions = [];
			
			for (const reducer of reducers) {
				
				if (reducer instanceof Observable$1) {
					const subscription = reducer.subscribe(payload => {
						
						if (payload instanceof Observable$1) {
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
	Observable$1.operators = {
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

	for (const [key, value] of Object.entries(Observable$1.operators)) {
		if (!Observable$1.prototype[key]) {
			Observable$1.prototype[key] = function(...args) { return this.pipe(value(...args)) };
		}
	}

	let action_index = 0;
	let depth = false;

	const _action_log_begin = (type, payload) => {
		action_index++;
		depth = true;
		const signature = payload === undefined ? "" : _$1.toType(payload);
		const msg = `#${action_index} ${type}(${signature})`;
		_$1.debug.group(msg);
		payload !== undefined && console.log(payload);
	};

	const _action_log_end = () => {
		_$1.debug.groupEnd();
		if (depth === true) console.log("\n");
		depth = false;
	};


	const memo = {};

	class Action extends Observable$1 {
		constructor(type, ...pipes) {
			
			// @TODO: memo를 쓰니 override를 할 수가 없다;;
			if (memo[type]) return memo[type];
			
			const subject = new Subject;
			const observable = subject.pipe(...pipes);
			
			let s, s2;
			if (pipes.length) {
				s = observable.subscribe();
			}
			
			super(observer => {
				s2 = observable.subscribe(observer);
				if (s) s.unsubscribe();
				return s2;
			});
			
			this.type = type;
			this.toString = () => type;
			this.pipes = pipes;
			
			const f = payload => {
				_action_log_begin(type, payload);
				subject.next(payload);
				_action_log_end();
				
				return Observable$1.EMPTY;
			};
			
			Object.setPrototypeOf(f, this);
			
			memo[type] = f;
			return f;
		}
		
		call(...args) {
			return Function.prototype.apply.apply(this, this, args);
		}
		
		apply(args) {
			return Function.prototype.apply.apply(this, this, args);
		}
	}

	const RequestAction = class extends Action {
		constructor(type, ...pipes) {
			pipes = [...pipes, $ => $.tap(value => f.REQUEST(value)).share()];
			const _f = super(type, ...pipes);
			
			let subscription;
			const f = (payload) => {
				if (subscription) subscription.unsubscribe();
				
				const id = payload && payload.id;
				const ret = Observable$1.merge(f.SUCCESS, f.FAILURE, f.CANCEL).filter({id}).take(1).shareReplay(1);
				subscription = ret.subscribe();
				_f(payload);
				return ret;
			};
			
			Object.setPrototypeOf(f, this);
			
			f.CANCEL = new Action(type + ".CANCEL");
			f.REQUEST = new Action(type + ".REQUEST");
			f.SUCCESS = new Action(type + ".SUCCESS");
			f.FAILURE = new Action(type + ".FAILURE");
			return f;
		}
	};


	const StreamAction = class extends Action {
		constructor(type, ...pipes) {
			pipes = [...pipes, $ => $.tap(value => f.START(value)).share()];
			const _f = super(type, ...pipes);
			
			let subscription;
			
			const f = (payload) => {
				if (subscription) subscription.unsubscribe();
				
				const id = payload && payload.id;
				const ret = Observable$1.merge(f.ERROR, f.COMPLETE, f.CANCEL).filter({id}).take(1).shareReplay(1);
				subscription = ret.subscribe();
				_f(payload);
				return ret;
			};
			
			
			Object.setPrototypeOf(f, this);
			
			f.CANCEL = new Action(type + ".CANCEL");
			f.START = new Action(type + ".START");
			f.NEXT = new Action(type + ".NEXT");
			f.ERROR = new Action(type + ".ERROR");
			f.COMPLETE = new Action(type + ".COMPLETE");
			
			return f;
		}
	};

	Action.prototype.isolate = function(id) {
		const f = (payload) => {
			if (Object(payload) !== payload) payload = {payload};
			return this({id, ...payload});
		};
		
		Object.assign(f, _$1.mapValues(_$1.if(_$1.instanceof(Action), (action) => action.isolate(id)))(this));
		
		const o = this.pipe($ => $.filter({id: _$1.is(id)}));
		Object.setPrototypeOf(f, o);
		return f;
	};

	Action.isolate = (id, object) => {
		return _$1.memoize1((id) => _$1.mapValues(_$1.if(_$1.instanceof(Action), (action) => action.isolate(id)))(object))(id);
	};

	/// Utils
	const {castArray, noop: noop$1} = _$1;

	/// Operator precedence
	let bp = 1000;

	function precedence(type, ...operators) {
		for (let operator of operators) {
			type[operator] = bp;
		}
		bp -= 10;
	}

	const PREFIX = precedence.PREFIX = Object.create(null);
	const INFIX = precedence.INFIX = Object.create(null);

	precedence(PREFIX, "(");
	precedence(PREFIX, "#", "@");
	precedence(INFIX, ".", "[", "(");
	precedence(PREFIX, "!", "-", "+", "[", "{");
	precedence(INFIX, "**");
	precedence(INFIX, "*", "/", "%", "%%");
	precedence(INFIX, "+", "-");
	precedence(INFIX, "|");
	precedence(INFIX, "<", ">", ">=", "in");
	precedence(INFIX, "===", "!==", "==", "!=");
	precedence(INFIX, "&&");
	precedence(INFIX, "||");
	precedence(INFIX, "?");
	precedence(INFIX, "as");
	precedence(INFIX, "=>");
	precedence(INFIX, "=");
	precedence(INFIX, "if");
	precedence(INFIX, ";");


	/// expression
	let $tokens;
	let $token;
	let $script;

	function next(id) {
		if (id && $token && $token.id !== id) {
			$token.error("Unexpected token: " + $token.id);
			return;
		}
		
		const t = $token;
		$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
		return t;
	}

	function expression(rbp = 0) {
		let t = $token;
		next();
		
		let left = t.nud() || t;
		while($token.lbp > rbp) {
			t = $token;
			next();
			left = t.led(left) || t;
		}
		
		return left;
	}


	/// Symbol
	const $symbol_table = {};

	const $symbol_prototype = {
		length: 0,
		
		lbp: 0,
		nbp: 0,
		
		error(err) { throw SyntaxError($script + " " + err) },
		
		nud() { throw SyntaxError($script + " Unexpected token: " + this.id) },
		
		led() { throw SyntaxError($script + " Missing Operator: " + this.id) },
		
		push() {
			let token;
			for (token of arguments) {
				this[this.length++] = token;
			}
			
			return token;
		},
		
		watch(object, prop) {}
	};

	function symbol(id) {
		const s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
		s.id = id;
		return s;
	}

	function nud_of_constant() {
		this.id = "(literal)";
	}

	function nud_of_prefix() {
		this.push(expression(this.nbp));
	}

	function led_of_infix(left) {
		this.push(left, expression(this.lbp));
	}

	function lef_of_infixr(left) {
		this.push(left, expression(this.lbp - 1));
	}


	///
	function constant(id, value) {
		const s = symbol(id);
		s.value = value;
		s.nud = nud_of_constant;
		return s;
	}

	function prefix(id, nud) {
		for (id of castArray(id)) {
			const s = symbol(id);
			s.nbp = precedence.PREFIX[id];
			s.nud = nud || nud_of_prefix;
		}
	}

	function infix(id, led) {
		for (id of castArray(id)) {
			const s = symbol(id);
			s.lbp = precedence.INFIX[id];
			s.led = led || led_of_infix;
		}
	}

	function infixr(id, led) {
		for (id of castArray(id)) {
			const s = symbol(id);
			s.lbp = precedence.INFIX[id];
			s.led = led || lef_of_infixr;
		}
	}


	/// Define Symbols
	symbol(":");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol(",");
	symbol("=>");

	symbol("(end)").nud = noop$1;
	symbol("(literal)").nud = noop$1;
	symbol("(name)").nud = noop$1;
	symbol("this").nud = noop$1;


	/// Constants
	constant("true", true);
	constant("false", false);
	constant("undefined", undefined);
	constant("null", null);
	constant("NaN", NaN);
	constant("Math", Math);
	constant("Date", Date);
	constant("Boolean", Boolean);
	constant("Number", Number);
	constant("Array", Array);
	constant("Object", Object);
	constant("JSON", JSON);
	constant("Infinity", Infinity);


	/// Basic Operators
	prefix(["+", "-", "!"]);
	infix(["+", "-", "*", "/", "%", "%%"]);
	infixr(["===", "!==", "==", "!=", "<", "<=", ">", ">=", "&&", "||", ";", "if"]);


	/// @foo
	prefix("@", function() {
		this.push(next("(name)"));
	});

	/// #foo
	prefix("#", function() {
		this.push(next("(name)"));
	});

	/// foo.bar
	infix(".", function(left) {
		this.push(left, next("(name)"));
	});

	/// foo[bar]
	infix("[", function(left) {
		this.push(left, expression());
		next("]");
	});

	/// foo ? bar : baz
	infix("?", function(left) {
		this.push(left, expression(), next(":") && expression());
	});

	/// [foo, bar, baz, ...]
	prefix("[", function() {
		const args = this.push([]);
		
		if ($token.id !== "]") {
			do { args.push(expression()); }
			while($token.id === "," && next(","));
		}
		
		next("]");
	});


	/// {foo: bar, ...}
	prefix("{", function() {
		const args = this.push([]);
		
		if ($token.id !== "}") {
			do {
				if ($token.id !== "(name)" && $token.id !== "(literal)") {
					throw SyntaxError("Unexpected token: " + $token.id);
				}
				
				let o = next();
				const key = o.value;
				
				if ($token.id === "," || $token.id === "}") {
					o.key = key;
					args.push(o);
					continue;
				}
				next(":");
				
				o = expression();
				o.key = key;
				args.push(o);
				
			} while($token.id === "," && next(","))
		}
		
		next("}");
	});


	/// foo(bar, ...)
	/// foo.bar(baz, ...)
	infix("(", function(left) {
		const args = this.push(left, []);
		
		if ($token.id !== ")") {
			do { args.push(expression()); }
			while($token.id === "," && next(","))
		}
		
		next(")");
	});


	/// (foo, ...) => bar
	/// () => bar
	/// (foo) => bar
	/// (foo)
	prefix("(", function() {
		
		let lookahead = $tokens[$tokens.index];
		let lookahead2 = $tokens[$tokens.index + 1];
		
		/// (foo, ...) => bar
		/// (foo) => bar
		if (lookahead.id === "," || (lookahead.id === ")" && lookahead2 && lookahead2.id === "=>")) {
			this.id = "=>";
			
			let args = this.push([]);
			do {
				args.push(next("(name)"));
			} while($token.id === "," && next(","));
			
			next(")");
			
			next("=>");
			
			this.push(expression());
			return;
		}
		
		/// (foo)
		const e = expression();
		next(")");
		return e;
	});


	/// foo as bar, baz
	infix("as", function(left) {
		this.push(left, next("(name)"));
		
		if ($token.id === ",") {
			next(",");
			this.push(next("(name)"));
		}
		else {
			this.push({});
		}
	});


	/// foo => bar
	infix("=>", function(left) {
		this.push([left], expression());
	});


	/// foo = bar
	infixr("=", function(left) {
		if (left.id !== "." && left.id !== "[" && left.id !== "(name)") {
			left.error("Invalid left-hand side in assignment.");
		}
		
		this.push(left);
		this.push(expression(this.lbp - 1));
	});


	/// foo | bar: baz, ...
	infix("|", function(left) {
		let args = this.push(left, next("(name)"), []);
		
		if ($token.id === ":") {
			next(":");
			
			do {
				args.push(expression());
			} while($token.id === "," && next(","))
		}
	});


	/// Tokenizer
	const lex = [
		["(name)", /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)/],
		["(number)", /((?:\d*\.\d+)|\d+)/],
		["(string)", /('[^']*'|"[^"]*")/],
		["(operator)", /(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/%!#@?:;.,<>=\[\]\(\){}])/],
		["(ws)", /(\s)/],
		["(unknown)", /./]
	];

	const regex = new RegExp(lex.map(v => v[1].source).join("|"), "g");


	function createTokenOfName(value) {
		const token = Object.create($symbol_table[value] || $symbol_table["(name)"]);
		token.value = "value" in token ? token.value : value;
		return token;
	}

	function tokenize(script) {
		/// assert: typeof script === "string";
		
		const tokens = [];
		tokens.index = 0;
		
		script.replace(regex, function(value, ...args) {
			
			/// Parse Type
			const type = lex[args.findIndex(v => v)][0];
			
			/// Create Token
			switch (type) {
				case "(name)": {
					const token = createTokenOfName(value);
					tokens.push(token);
					break;
				}
				
				case "(number)": {
					const token = Object.create($symbol_table["(literal)"]);
					token.value = +value;
					tokens.push(token);
					break;
				}
				
				case "(string)": {
					const token = Object.create($symbol_table["(literal)"]);
					token.value = value.slice(1, -1);
					tokens.push(token);
					break;
				}
				
				case "(operator)": {
					const token = Object.create($symbol_table[value] || null);
					token.value = value;
					tokens.push(token);
					break;
				}
				
				case "(unknown)":
					throw SyntaxError("Unexpected token: " + value);
			}
			
			return value;
		});
		
		
		/// Make Parse Tree
		$tokens = tokens;
		$script = script;
		next();
		
		const root = expression();
		root.tokens = tokens;
		
		return root;
	}

	/// WATCH
	const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
	const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

	function mutationObservableFromClass$$(object, methods) {
		const key = methods[0];
		let observable$;

		return observable$ = object[key].observable$ || new Observable$1(observer => {

			const prototype = Object.getPrototypeOf(object);
			const hook = Object.create(prototype);
			Object.setPrototypeOf(object, hook);

			for (const method of methods) {
				hook[method] = function() {
					const result = prototype[method].apply(this, arguments);
					observer.next(object);
					return result;
				};
			}
			hook[key].observable$ = observable$;

			observer.next(object);

			return () => {
				delete hook[key].observable$;
				Object.setPrototypeOf(object, prototype);
			}

		}).shareReplay(1)
	}


	function mutationObservable$$(value) {
		if (Array.isArray(value)) return mutationObservableFromClass$$(value, ARRAY_METHODS);
		if (value instanceof Date) return mutationObservableFromClass$$(value, DATE_METHODS);
		if (value instanceof Observable$1 && typeof value !== "function") return value;
		return Observable$1.of(value);
	}

	const getOwnObservable = (object, prop) => {
		const value = object && object[prop];

		if (Object.isFrozen(object)) {
			return Observable$1.of(value);
		}

		if (Array.isArray(object) && +prop === prop) {
			return Observable$1.of(value);
		}

		const desc = Object.getOwnPropertyDescriptor(object, prop);

		// 기 생성된 observable
		if (desc && desc.set && desc.set.observable$) {
			return desc.set.observable$;
		}

		// 수정불가
		if (desc && desc.configurable === false) {
			return Observable$1.of(value);
		}

		// desc가 없고 확장불가능이면 SKIP
		if (!desc && !Object.isExtensible(object)) {
			return Observable$1.EMPTY;
		}


		// // 이미 getter, setter가 있는 경우..
		// if (desc && desc.set) {
		// 	/// @TODO:
		// }
	};


	function watch$$(object, prop) {

		let observable$;

		return observable$ = getOwnObservable(object, prop) || new Observable$1(observer => {

			// Subscribe Mutation(Array, Date, Observable)
			let value = object[prop];
			let subscription = mutationObservable$$(value).subscribe(value => observer.next(value));


			// Define Getter/Setter
			const set = (newValue) => {
				if (Object.is(value, newValue)) {
					return;
				}
				value = newValue;

				subscription && subscription.unsubscribe();
				subscription = mutationObservable$$(value).subscribe(value => observer.next(value));
			};

			set.observable$ = observable$;


			const desc = Object.getOwnPropertyDescriptor(object, prop);

			Object.defineProperty(object, prop, {
				configurable: true,
				enumerable: desc && desc.enumerable || true,
				get: () => value,
				set,
			});


			// Clean Up
			return () => {

				// Unsubscribe
				subscription && subscription.unsubscribe();
				subscription = null;


				// Rollback Property
				if (desc && "value" in desc) {
					desc.value = value;
					Object.defineProperty(object, prop, desc);
				}
				else {
					delete object[prop];
					object[prop] = value;
				}
			}

		}).shareReplay(1);
	}

	const modules$ = new ReplaySubject();

	const makeInjectable = (callback) => {
		if (_$1.isArray(callback)) {
			const array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}
		
		if (!_$1.isFunction(callback)) {
			throw TypeError("factory must be array or function.");
		}
		
		if (!callback.$inject) {
			const s = callback.toString();
			callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(_$1.exist);
		}
		
		return callback;
	};


	const inject = callback$ => callback$
		
		.map(makeInjectable)
		
		.mergeMap(callback => Observable.combine(Observable.of(callback), Observable.combine(...callback.$inject.map(get))))
		
		.map(([callback, args]) => _$1.apply(callback)(args));


	const get = _$1.memoize1((name) => modules$
		
		.filter(pair => pair[0] === name)
		
		.map(([name, callback]) => callback)
		
		.tap(() => console.group("import", name))
		
		.pipe(inject)
		
		.timeoutFirstOnly(1000)
		
		.catch(() => {
			console.warn(name + " is not loaded.");
			return Observable.of();
		})
		
		.tap(() => console.groupEnd())
		
		.shareReplay(1)
	);

	const makeSubfactory = (module, postfix) => {
		const factory = (name, callback) => module.factory(name + postfix, callback);
		factory.value = (name, value) => factory(name, () => value);
		
		factory.require = (callback, resolve) => {
			callback = makeInjectable(callback);
			callback.$inject = callback.$inject.map(name => name + postfix);
			return module.require(callback, resolve);
		};
		
		return factory;
	};

	const $module = {};
	$module.factory = (name, callback) => modules$.next([name, callback]);
	$module.value = (name, value) => $module.factory(name, () => value);
	$module.require = (callback, resolve) => Observable.of(callback).pipe(inject).subscribe(resolve);

	$module.pipe = makeSubfactory($module, "Pipe");
	$module.directive = makeSubfactory($module, "Directive");
	$module.controller = makeSubfactory($module, "Controller");

	/// -----------------------------------------------------------------------
	/// Evaluate
	/// -----------------------------------------------------------------------
	const {combine, of} = Observable$1;

	const $evaluateRules = Object.create(null);

	const evaluate = (token) => {
		// console.log(token.id, token.length, token);
		
		try {
			return $evaluateRules[token.id][token.length].apply(token, token);
		} catch (error) {
			console.warn(token.id, token.length, token);
			console.error(error);
			
			return Observable$1.throw(error);
		}
	};


	/// Operators
	const unary = (callback) => (a) => evaluate(a).map(callback);
	const binary = (callback) => (a, b) => combine(evaluate(a), evaluate(b)).map(callback);
	const params = (array) => combine(...array.map(evaluate));


	/// Rules
	const evaluateRule = (id, callback) => {
		$evaluateRules[id] = $evaluateRules[id] || Object.create(null);
		$evaluateRules[id][callback.length] = callback;
	};

	evaluateRule("(end)", () => of(undefined));

	evaluateRule("(literal)", function() { return of(this.value) });

	evaluateRule("this", function() { return of(this.context.thisObj) });

	/// [1,2,3]
	evaluateRule("[", params);

	/// {foo: 123, bsr: 'abc'}
	evaluateRule("{", (a) => {
		return params(a).map(values => values.reduce((object, value, index) => {
			object[a[index].key] = value;
			return object;
		}, {}));
	});

	evaluateRule("#", (a) => {
		
		
		console.log($module.$actions);
		
		return Observable$1.of($module.$actions[a.value])
	});

	evaluateRule("+", unary(a => +a));
	evaluateRule("-", unary(a => -a));
	evaluateRule("!", unary(a => !a));

	evaluateRule("+", binary(([a, b]) => a + b));
	evaluateRule("-", binary(([a, b]) => a - b));
	evaluateRule("*", binary(([a, b]) => a * b));
	evaluateRule("/", binary(([a, b]) => a / b));
	evaluateRule("%", binary(([a, b]) => a % b));

	evaluateRule("&&", binary(([a, b]) => a && b));
	evaluateRule("||", binary(([a, b]) => a || b));
	evaluateRule("===", binary(([a, b]) => a === b));
	evaluateRule("!==", binary(([a, b]) => a !== b));
	evaluateRule("==", binary(([a, b]) => a == b));
	evaluateRule("!=", binary(([a, b]) => a != b));
	evaluateRule("<", binary(([a, b]) => a < b));
	evaluateRule("<=", binary(([a, b]) => a <= b));
	evaluateRule(">", binary(([a, b]) => a > b));
	evaluateRule(">=", binary(([a, b]) => a >= b));
	evaluateRule(";", binary(([a, b]) => a));

	evaluateRule("?", (a, b, c) => evaluate(a).switchMap(bool => bool ? evaluate(b) : evaluate(c)));


	/// foo
	evaluateRule("(name)", function() {
		
		const prop = this.value;
		
		return this.context.locals$
			.switchMap(locals => {
				if (prop in locals) {
					return this.watch(locals, prop);
				}
				
				const object = this.context.thisObj;
				this.object = object;
				this.prop = prop;
				
				return this.watch(object, prop);
			});
	});


	/// foo.bar
	evaluateRule(".", function(a, b) {
		return evaluate(a)
			.tap(object => {
				this.object = object;
				this.prop = b.value;
			})
			.switchMap(object => this.watch(object, b.value));
	});

	/// foo[bar]
	evaluateRule("[", function(a, b) {
		return combine(evaluate(a), evaluate(b))
			.tap(([object, prop]) => {
				this.object = object;
				this.prop = prop;
			})
			.switchMap(([object, prop]) => this.watch(object, prop));
	});

	/// foo(bar, ...baz)
	evaluateRule("(", (a, b) => combine(evaluate(a), params(b))
		.map(([func, args]) => {
			if (typeof func !== "function") return;
			return Function.prototype.apply.call(func, a.object, args);
		})
	);

	/// foo if bar
	evaluateRule("if", (a, b) => evaluate(b).filter(_$1.isTrue).switchMap(() => evaluate(a)));


	/// foo.bar = baz
	evaluateRule("=", (a, b) => combine(evaluate(a), evaluate(b))
		.tap(([__, value]) => {
			if (Object(a.object) !== a.object) {
				return;
			}
			
			a.object[a.prop] = value;
		})
	);

	/// foo|bar:baz
	evaluateRule("|", (a, b, c) => combine(evaluate(a), of(b.value), params(c))
		.switchMap(([value, pipe, args]) => {
			
			return new Observable$1(observer => {
				$module.pipe.require([pipe, (pipe) => {
					observer.next(pipe(value, ...args));
				}]);
			});
		})
	);

	function makeString(strings) {
		return Object(strings) === strings ? String.raw.apply(String, arguments) : String(strings);
	}

	const noWatch$$ = (object, prop) => Observable$1.of(object[prop]);


	class JSContext {

		constructor(thisObj, locals = Object.create(null)) {
			this.thisObj = thisObj;
			this.locals$ = new BehaviorSubject(locals);

			this._disconnect$ = new Subject();

			const f = (...args) => {
				const root = tokenize(makeString(...args));
				for (const token of root.tokens) {
					token.context = this;
					token.watch = watch$$;
				}

				return evaluate(root).takeUntil(this._disconnect$);
			};

			Object.setPrototypeOf(f, this);
			return f;
		}

		evaluate(script) {
			const root = tokenize(script);
			for (const token of root.tokens) {
				token.context = this;
				token.watch = noWatch$$;
			}

			// @FIXME: subscribe를 해야 하나??
			return evaluate(root).takeUntil(this._disconnect$);
		}

		assign(script, value) {
			const root = tokenize(script);
			for (const token of root.tokens) {
				token.context = this;
				token.watch = noWatch$$;
			}

			// @FIXME: subscribe를 해야 하나??
			return evaluate(root).tap(() => root.object[root.prop] = value);
		}

		disconnect() {
			this._disconnect$.complete();
		}

		fork(locals) {
			return new JSContext(this.thisObj, Object.setPrototypeOf(locals, this.locals$.value));
		}

		fromEvent(el, type, useCapture = false) {
			return Observable$1.fromEvent(el, type, useCapture);
		}
	}

	/// -----------------------------------------------------------------------
	/// traverseDOM
	/// -----------------------------------------------------------------------
	const traverseDOM = (node, callback) => {
		if (!node) return;
		
		const queue = ("length" in node) ? Array.from(node) : [node];
		
		while(queue.length) {
			node = queue.shift();
			
			if (!node) continue;
			
			// Option: Closing,
			if (typeof node === "function") {
				node();
				continue;
			}
			
			// Option: Skip children,
			let ret = callback(node);
			if (ret === false) {
				continue;
			}
			
			// Traverse ChildNodes
			if (node.childNodes) {
				if (typeof ret === "function") queue.unshift(ret);
				queue.unshift.apply(queue, node.childNodes);
			}
		}
	};


	/// -----------------------------------------------------------------------
	/// templateSyntax
	/// -----------------------------------------------------------------------
	const templateSyntax = (context, el, attr, start, callback, end) => {
		const {nodeName, nodeValue} = attr;
		
		if (nodeName.startsWith(start) && nodeName.endsWith(end)) {
			callback(context, el, nodeValue, nodeName.slice(start.length, -end.length || undefined));
			// el.removeAttributeNode(attr); // @TODO: DEBUG mode
			return true;
		}
	};


	/// -----------------------------------------------------------------------
	/// renderPipeLine
	/// -----------------------------------------------------------------------
	const rAF$ = (value) => new Observable$1(observer => {
		
		if (document.readyState !== "complete") {
			observer.next(value);
			observer.complete();
			return;
		}
		
		return _$1.rAF(() => {
			observer.next(value);
			observer.complete();
		});
	});


	const renderPipeLine = $ => $.distinctUntilChanged().switchMap(rAF$);

	/// -----------------------------------------------------------------------


	function _nodeValue(node, value) {
		
		/// HTML Element
		if (node.__node__) {
			node.__node__.remove();
			delete node.__node__;
		}
		
		if (Object(value) !== value) {
			node.nodeValue = value === undefined ? "" : value;
			return;
		}
		
		if (value instanceof DocumentFragment) {
			node.nodeValue = "";
			const content = value.cloneNode(true);
			const ref = Array.from(content.childNodes);
			node.__node__ = {remove: () => ref.forEach(node => node.remove())};
			node.before(content);
			return;
		}
		
		if (value instanceof Text) {
			node.nodeValue = value.nodeValue;
			return;
		}
		
		if (value instanceof Element) {
			node.nodeValue = "";
			node.__node__ = value.cloneNode(true);
			node.before(value);
			return;
		}
	}


	function $compile_text_node(node, context) {
		let index = node.nodeValue.indexOf("{{");
		
		while(index >= 0) {
			node = node.splitText(index);
			index = node.nodeValue.indexOf("}}");
			if (index === -1) return;
			
			let next = node.splitText(index + 2);
			let script = node.nodeValue.slice(2, -2);
			node.nodeValue = "";
			context(script).pipe(renderPipeLine).subscribe(_nodeValue.bind(null, node));
			
			node = next;
			index = node.nodeValue.indexOf("{{");
		}
	}

	/// -----------------------------------------------------------------------
	/// Compile Element
	/// -----------------------------------------------------------------------
	const localSVG = {};

	function $compile_element_node(el, context, to = el) {
		const tagName = el.tagName.toLowerCase();
		
		if (tagName === "script") return false;
		if (tagName === "style") return false;
		
		
		const attributes = Array.from(el.attributes);
		
		let ret;
		
		const hasTemplateDirective = ["*foreach", "*if", "*else", "*template"].some(attrName => {
			const attr = el.getAttributeNode(attrName);
			if (!attr) return false;
			
			$module.directive.require([attr.nodeName, (directive) => {
				directive(context, el, attr.nodeValue, attr.nodeName);
			}]);
			
			return true;
		});
		
		if (hasTemplateDirective) {
			return false;
		}
		
		
		/// @TODO: make Directive Hook
		if (tagName === "svg") {
			const svg = el;
			
			const loadSVG = () => {
				let src = svg.getAttributeNode("src");
				if (!src || !src.nodeValue) return;
				
				if (src) {
					if (localSVG[src.nodeValue]) {
						svg.replaceWith(localSVG[src.nodeValue]);
					}
					else {
						fetch(src.nodeValue).then(res => res.text()).then(res => {
							
							let template = document.createElement("template");
							template.innerHTML = res;
							localSVG[src.nodeValue] = template.content;
							
							svg.replaceWith(localSVG[src.nodeValue]);
						});
					}
				}
			};
			
			
			const observer = new MutationObserver(function(mutations) {
				mutations.forEach((mutation) => {
					if (mutation.attributeName === "src") {
						loadSVG();
					}
				});
			});
			
			observer.observe(svg, {attributes: true});
			loadSVG();
		}
		
		
		for (const attr of attributes) {
			
			// /// Custom Directives
			// /// @TODO: custom-directive 등록할때 아래처럼 syntax를 등록하는건 어떨까?
			// let customDefaultPrevent = false;
			// $module.directive.require([attr.nodeName, directive => {
			// 	if (typeof directive === "function") {
			// 		let ret = directive(context, el, attr.nodeValue);
			// 		customDefaultPrevent = ret === false;
			// 	}
			// }]);
			// if (customDefaultPrevent) continue;
			
			
			/// Basic Directives
			if (templateSyntax(context, to, attr, "(", _event, ")")) continue;
			if (templateSyntax(context, to, attr, "[attr.", _attr, "]")) continue;
			if (templateSyntax(context, to, attr, "[visible", _visible, "]")) continue;
			if (templateSyntax(context, to, attr, "[class.", _class, "]")) continue;
			if (templateSyntax(context, to, attr, "[style.", _style, "]")) continue;
			// if (templateSyntax(context, to, attr, "[show.", _transition, "]")) continue;
			if (templateSyntax(context, to, attr, "[(", _twoway, ")]")) continue;
			if (templateSyntax(context, to, attr, "[", _prop, "]")) continue;
			if (templateSyntax(context, to, attr, "$", _ref2, "")) continue;
			// if (templateSyntax(context, to, attr, "#", _ref, "")) continue;
			// if (templateSyntax(context, to, attr, ".", _call, ")")) continue;
			
			if (el !== to) {
				to.setAttributeNode(attr.cloneNode(true));
			}
		}
		
		
		/// @TODO: Iframe Component
		// if (tagName === "iframe" && el.hasAttribute("is")) {
		//
		// 	const iframe = el;
		// 	const is = el.getAttribute("is");
		//
		// 	window.customElements.whenDefined(is).then(() => {
		// 		const Component = window.customElements.get(is);
		// 		const component = new Component;
		// 		component.iframe = iframe;
		// 		iframe.contentDocument.body.appendChild(component);
		// 	});
		//
		// 	return false;
		// }
		
		
		/// Bind Controller
		if (el.hasAttribute("is")) {
			$module.controller.require([el.getAttribute("is"), (Controller) => {
				const controller = new Controller;
				const context = $compile(el.content || el.childNodes, controller);
				typeof controller.init === "function" && controller.init(context);
				
				if (el.content) {
					el.replaceWith(el.content);
				}
				
				ret = false;
			}]);
			
			return ret;
		}
	}


	/// Render From Template Syntax
	function _attr(context, el, script, attr) {
		return context(script)
			.pipe(renderPipeLine)
			.tap(value => (value || _$1.isStringLike(value)) ? el.setAttribute(attr, value) : el.removeAttribute(attr))
			.subscribe()
	}

	function _class(context, el, script, name) {
		return context(script)
			.mergeMap(value => Observable$1.castAsync(value))
			.pipe(renderPipeLine)
			.tap(value => value ? el.classList.add(name) : el.classList.remove(name))
			.subscribe()
	}

	function _style(context, el, script, name) {
		const [prop, unit = ""] = name.split(".", 2);
		
		return context(script)
			.pipe(renderPipeLine)
			.map(value => {
				switch (unit) {
					case "url":
						return "url('" + encodeURI(value) + "')";
					
					default:
						return value + unit;
				}
			})
			.tap(value => el.style[prop] = value)
			.subscribe();
	}

	function _visible(context, el, script) {
		return context(script)
			.pipe(renderPipeLine)
			.tap(value => el["hidden"] = !value)
			.subscribe()
	}

	function _prop(context, el, script, prop) {
		return context(script)
		// .pipe(renderPipeLine) // @TODO: hasOwnProperty가 없는데 HTMLElement가 가지고 있는 경우에는 renderPipe를 통해야함. ex) id, src 등...
			.tap(value => el[prop] = value)
			.subscribe();
	}


	function _twoway(context, el, script, value) {
		
		let [prop, eventType, ...options] = value.split(".");
		
		context.fromEvent(el, eventType || "input")
			.mergeMap(() => context.assign(script, el[prop]))
			.subscribe();
		
		return context(script)
			.reject(_$1.isUndefined)
			.reject(value => el[prop] === value)
			.tap(value => el[prop] = value)
			.subscribe();
	}


	function _ref2(context, el, script, name) {
		context.thisObj["$" + name] = el;
	}


	Event.pipes = {
		prevent: $ => $.tap(e => e.preventDefault()),
		stop: $ => $.tap(e => e.stopPropagation()),
		capture: $ => $,
		self: ($, element) => $.filter(e => e.target === element),
		once: $ => $.take(1),
		shift: $ => $.filter(e => e.shiftKey),
		alt: $ => $.filter(e => e.altKey),
		ctrl: $ => $.filter(e => e.ctrlKey),
		meta: $ => $.filter(e => e.metaKey),
		cmd: $ => $.filter(e => e.ctrlKey || e.metaKey)
	};


	function _event(context, el, script, value) {
		
		let [type, ...options] = value.split(/\s*\|\s*/);
		const useCapture = options.includes("capture");
		
		/// @FIXME: Keyboard Event
		let keys = [];
		if (type.startsWith("keydown") || type.startsWith("keypress") || type.startsWith("keyup")) {
			[type, ...keys] = type.split(".");
		}
		
		/// Normal Event
		let event$ = context.fromEvent(el, type, useCapture);
		if (keys.length) {
			event$ = event$.filter(e => keys.includes(e.key.toLowerCase()));
		}
		
		/// Event Pipe
		options.forEach(pipe => {
			let handler = Event.pipes[pipe];
			if (!handler) throw new Error(pipe + " is not registered event pipe.");
			event$ = handler(event$, el);
		});
		
		/// Event Handler
		return event$
		// .trace("(event)", type)
			.switchMap(event => context.fork({event, el}).evaluate(script))
			.switchMap(ret => Observable$1.castAsync(ret))
			.subscribe()
	}

	/// -----------------------------------------------------------------------
	/// Compile
	/// -----------------------------------------------------------------------
	const $compile$1 = (el, context, to) => {
		
		if (!(context instanceof JSContext)) {
			context = new JSContext(context);
		}
		
		if (el.tagName === "TEMPLATE") {
			$compile_element_node(el, context, to);
			el = el.content;
		}
		
		traverseDOM(el, (node) => {
			if (!node) return;
			
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					return $compile_element_node(node, context);
				
				case Node.TEXT_NODE:
					return $compile_text_node(node, context);
			}
		});
		
		return context;
	};

	class WebComponent extends HTMLElement {
		
		connectedCallback() {
			
			/// @FIXME: Make Once
			if (this.__connected) {
				this.connected();
				return;
			}
			this.__connected = true;
			
			
			/// Load Template
			const html = this.hasAttribute("inline-template") ?
				this.innerHTML :
				this.constructor.templateHTML;
			
			const wrap = document.createElement("template");
			wrap.innerHTML = html || "";
			const template = wrap.content.querySelector("template") || wrap;
			
			
			/// Compile
			const context = $compile$1(template, this, this);
			
			/// Import Template
			const frag = document.createDocumentFragment();
			for (const node of Array.from(this.childNodes)) {
				frag.appendChild(node);
			}
			this.appendChild(template.content);
			
			
			/// Import Content
			for (const content of Array.from(this.querySelectorAll("content"))) {
				content.replaceWith(frag);
			}
			
			/// Init Component
			this.init(context);
			this.connected();
		}
		
		init() {}
		
		connected() {}
	}

	$module.component = function(name, callback) {
		
		const decorator = Object.create(null);
		const _callback = callback.bind(decorator);
		_callback.$inject = makeInjectable(callback).$inject;
		
		return $module.require(_callback, Component => {
			Component = Component || class extends WebComponent {};
			Object.assign(Component, decorator);
			
			window.customElements.define(name, Component);
		})
	};


	$module.value("JSContext", {});
	$module.value("WebComponent", WebComponent);

	/// Default Template Directive
	$module.directive("*foreach", function() {
		
		function createRepeatNode(node, context, local) {
			node = node.cloneNode(true);
			context = context.fork(local);
			$compile$1(node, context);
			
			return {node, context, local};
		}
		
		return function(context, el, _script) {
			
			/// Parse [script] as [ROW], [INDEX]
			const [script, ROW, INDEX] = _$1.go(
				_script,
				_$1.rpartition(" as "),
				_$1.spread((script, sep, rest) => [script, ...rest.split(",", 2)]),
				_$1.map(_$1.trim)
			);
			
			/// Prepare Placeholder
			const repeatNode = el.cloneNode(true);
			repeatNode.removeAttribute("*foreach");
			
			const placeholder = document.createComment("foreach: " + _script);
			const placeholderEnd = document.createComment("endforeach");
			el.before(placeholder);
			el.replaceWith(placeholderEnd);
			
			
			////
			let container = [];
			
			context(script)
				.map(value => _$1.isArrayLike(value) ? value : [])
				.map(array => Array.from(array))
				.scan((prevArray, array) => {
					
					
					/// LCS Diff: LCS를 이용해서 같은건 유지하고, 삭제할 노드와 replace될 노드를 구분하는 로직을 짤것.
					/// @NOTE: d == undeinfed 삭제후보, e === undefined 교체.. e에 없는거 추가...
					const [d, e] = _$1.LCS(prevArray, array);
					
					let willRemoved = [];
					let noChanged = [];
					
					prevArray.forEach((value, index) => (d[index] === null ? willRemoved : noChanged).push(container[index]));
					noChanged.push({node: placeholderEnd});
					
					
					/// Render Diff
					let cursor = noChanged[0].node;
					
					container = array.map((value, index) => {
						
						/// 변화없음.
						if (e[index] !== null) {
							const r = noChanged.shift();
							cursor = noChanged[0].node;
							return r;
						}
						
						const local = Object.create(null);
						ROW && (local[ROW] = value);
						INDEX && (local[INDEX] = index);
						
						
						/// 추가
						if (!container[index] || willRemoved.length === 0) {
							const r = createRepeatNode(repeatNode, context, local);
							cursor.before(r.node);
							
							
							/// @FIXME: css-transition
							if (r.node.hasAttribute("css-transition")) {
								requestAnimationFrame(() => {
									requestAnimationFrame(() => {
										const enter = r.node.getAttribute("css-transition") || "transition";
										r.node.classList.add(enter + "-enter");
									});
								});
							}
							
							return r;
						}
						
						
						/// 교체
						container[index].context.locals$.next(local);
						willRemoved = willRemoved.filter(x => x !== container[index]);
						return container[index];
					});
					
					
					/// 삭제
					willRemoved.forEach(r => r.node.remove());
					
					return array;
					
				}, [])
				.subscribe();
			
			return false;
		}
	});

	/// Directive: "*if"
	$module.directive("*if", function() {
		return function(context, el, script) {
			el.removeAttribute("*if");
			$compile$1(el, context);
			
			let placeholder = document.createComment("if: " + script);
			el._ifScript = placeholder._ifScript = script;
			
			context(script)
				.subscribe((bool) => {
					if (bool) {
						placeholder.replaceWith(el);
					}
					else {
						el.replaceWith(placeholder);
					}
				});
		}
	});


	/// @TODO: 사실은 *if watch에서 모든것을 처리하고 placeholder는 1개만 가져가는게 더 좋을텐데...
	/// @TODO: *if 부터 false일때 => 전달 => 전달 하는 식으로...


	/// Directive: "*else"
	$module.directive("*else", function() {
		return function(context, el, script) {
			el.removeAttribute("*else");
			let placeholder = document.createComment("else: " + script);
			
			/// prev가 ifScript가 있거나...
			
			let prev = el.previousSibling;
			for (let i = 0; i < 5; i++) {
				prev = prev.previousSibling;
				if (prev._ifScript) {
					script = prev._ifScript;
					// console.log("#############", prev, prev.ifScript);
					break;
				}
			}
			
			script = "!(" + script + ")";
			
			// console.log(script);
			
			
			context(script).subscribe((bool) => {
				
				if (bool) {
					if (placeholder.parentNode) {
						placeholder.replaceWith(el);
					}
				}
				else {
					el.replaceWith(placeholder);
				}
				
				// console.log("if", script, bool);
			});
		}
	});

	/// Default Template Directive
	$module.directive("*template", function() {
		
		return function(context, el, script) {
			el.removeAttribute("*template");
			
			context(script)
				.map(id => document.querySelector("template#" + id))
				.filter(template => template)
				.map(template => template.cloneNode(true))
				.tap(template => {
					$compile$1(template.content, context);
					el.innerHTML = "";
					el.appendChild(template.content);
				})
				.subscribe();
		}
	});

	$module.factory("http", function() {

		function Callable(f) {
			return Object.setPrototypeOf(f, new.target.prototype);
		}

		Callable.prototype = Function.prototype;


		let timerId = 0;

		class HttpService extends Callable {
			constructor(init = {}, http) {
				super(body => {
					const _body = body;

					const url = this.init.url;
					let init = this.init;

					if (body) {
						body = init.body ? init.body(body) : body;
						init = {...this.init, body};
					}

					/// @FIXME:
					if (init.method === "GET" || init.method === "DELETE" || init.method === "HEAD") {
						init = {...this.init};
						delete init.body;
					}

					// if (typeof init.preScript === "function") {
					// 	init = {...init, ...init.preScript(init)};
					// }

					const response = init.response || ((v) => v);

					return new Observable(observer => {
						console.group(init.method, url);
						console.log("Request", _body);
						console.time("Time" + (++timerId));
						console.groupEnd();

						return Observable.fromAsync(fetch(url, init).then(response))
							.tap(res => console.group("Response", init.method, url))
							.tap(_.log("Response"))
							.tap(() => console.timeEnd("Time" + (timerId--)))
							.finalize(() => {
								console.groupEnd();
							})
							.subscribe(observer);
					});
				});

				this.init = http ? {...http.init, ...init} : {...init};
			}

			/// Request
			resource(data) { return new HttpService(data, this) }

			/// Request
			url(url) { return this.resource({url}) }

			headers(headers) { return this.resource({headers}) }

			method(method, ...url) { return this.resource({method, url: url.join("/")}) }

			body(body) { return this.resource({body}) }

			GET(...url) { return this.method("GET", ...url) }

			POST(...url) { return this.method("POST", ...url) }

			PUT(...url) { return this.method("PUT", ...url) }

			DELETE(...url) { return this.method("DELETE", ...url) }

			PATCH(...url) { return this.method("PATCH", ...url) }

			HEAD(...url) { return this.method("HEAD", ...url) }

			OPTION(...url) { return this.method("OPTION", ...url) }


			/// Request
			preScript(preScript) {
				return this.resource({preScript});
			}

			body(body) {
				return this.resource({body});
			}

			/// Response
			response(response) {
				return this.resource({response});
			}
		}

		return new HttpService();
	});

	Object.assign(window, {
		_: _$1,
		
		Observable: Observable$1,
		Subject,
		BehaviorSubject,
		ReplaySubject,
		AsyncSubject,
		
		Action,
		RequestAction,
		StreamAction,
		
		JSContext,
		WebComponent,
		
		$module
	});


	$module.value("_", _$1);
	$module.value("Observable", Observable$1);
	$module.value("Subject", Subject);
	$module.value("BehaviorSubject", BehaviorSubject);
	$module.value("ReplaySubject", ReplaySubject);
	$module.value("AsyncSubject", AsyncSubject);
	$module.value("Action", Action);
	$module.value("RequestAction", RequestAction);
	$module.value("StreamAction", StreamAction);
	$module.value("JSContext", JSContext);
	$module.value("WebComponent", WebComponent);

}());
