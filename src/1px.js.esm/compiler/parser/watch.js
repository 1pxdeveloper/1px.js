import {Observable} from "../../observable";

/// WATCH
const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

function mutationObservableFromClass$$(object, methods) {
	const key = methods[0];
	let observable$;

	return observable$ = object[key].observable$ || new Observable(observer => {

		const prototype = Object.getPrototypeOf(object);
		const hook = Object.create(prototype);
		Object.setPrototypeOf(object, hook);

		for (const method of methods) {
			hook[method] = function() {
				const result = prototype[method].apply(this, arguments);
				observer.next(object);
				return result;
			}
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
	if (value instanceof Observable && typeof value !== "function") return value;
	return Observable.of(value);
}

const getOwnObservable = (object, prop) => {
	const value = object && object[prop];

	if (Object.isFrozen(object)) {
		return Observable.of(value);
	}

	if (Array.isArray(object) && +prop === prop) {
		return Observable.of(value);
	}

	const desc = Object.getOwnPropertyDescriptor(object, prop);

	// 기 생성된 observable
	if (desc && desc.set && desc.set.observable$) {
		return desc.set.observable$;
	}

	// 수정불가
	if (desc && desc.configurable === false) {
		return Observable.of(value);
	}

	// desc가 없고 확장불가능이면 SKIP
	if (!desc && !Object.isExtensible(object)) {
		return Observable.EMPTY;
	}


	// // 이미 getter, setter가 있는 경우..
	// if (desc && desc.set) {
	// 	/// @TODO:
	// }
};


export function watch$$(object, prop) {

	let observable$;

	return observable$ = getOwnObservable(object, prop) || new Observable(observer => {

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