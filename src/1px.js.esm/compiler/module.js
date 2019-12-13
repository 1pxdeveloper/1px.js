import {_} from "../fp";
import {ReplaySubject} from "../observable";

const modules$ = new ReplaySubject();

const makeInjectable = (callback) => {
	if (_.isArray(callback)) {
		const array = callback;
		callback = array[array.length - 1];
		callback.$inject = array.slice(0, -1);
	}
	
	if (!_.isFunction(callback)) {
		throw TypeError("factory must be array or function.");
	}
	
	if (!callback.$inject) {
		const s = callback.toString();
		callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(_.exist);
	}
	
	return callback;
};


const inject = callback$ => callback$
	
	.map(makeInjectable)
	
	.mergeMap(callback => Observable.combine(Observable.of(callback), Observable.combine(...callback.$inject.map(get))))
	
	.map(([callback, args]) => _.apply(callback)(args));


const get = _.memoize1((name) => modules$
	
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


export {
	makeInjectable,
	$module
}