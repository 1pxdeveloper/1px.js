const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

function mutationObservableFromClass$(object, cls, methods) {
	let key = methods[0];

	if (object[key].observable$) {
		return object[key].observable$;
	}

	let observable$ = new Observable(function(observer) {
		let prototype = Object.getPrototypeOf(object);
		let o = Object.create(prototype);
		Object.setPrototypeOf(object, o);

		for (let method of methods) {
			o[method] = function() {
				let result = cls[method].apply(this, arguments);
				observer.next(this);
				observer.complete();
				return result;
			}
		}

		o[key].observable$ = observable$;

		return function() {
			delete o[key].observable$;
			Object.setPrototypeOf(object, prototype);
		}

	});

	return observable$;
}

function mutationObservable$(object) {
	if (Array.isArray(object)) return mutationObservableFromClass$(object, Array.prototype, ARRAY_METHODS);
	if (object instanceof Date) return mutationObservableFromClass$(object, Date.prototype, DATE_METHODS);
	return Observable.never;
}


function watch$(object, prop) {
	if (Object(object) !== object) {
		return Observable.never;
	}

	if (Array.isArray(object) && +prop >= object.length) {
		return Observable.never;
	}

	let desc = Object.getOwnPropertyDescriptor(object, prop);
	if (desc && (desc.configurable === false || desc.writable === false || (desc.get && !desc.set))) {
		return Observable.never;
	}

	if (desc && desc.set && desc.set.observable$) {
		return desc.set.observable$;
	}

	let observable$ = new Observable(function(observer) {
		let value = object[prop];
		let subscription = mutationObservable$(value).subscribe(observer);

		function set(newValue) {
			if (Object.is(value, newValue)) {
				return;
			}

			value = newValue;
			subscription.unsubscribe();
			subscription = mutationObservable$(value).subscribe(observer);
			observer.next(value);
			observer.complete();
		}

		set.observable$ = observable$;

		Object.defineProperty(object, prop, {
			enumerable: true,
			configurable: true,
			get: function() {
				return value;
			},
			set: set
		});

		/// cleanup!
		return function() {
			subscription.unsubscribe();
			delete set.observable$;
			delete object[prop];
			if (value !== undefined) {
				object[prop] = value;
			}
		}
	});

	return observable$;
}