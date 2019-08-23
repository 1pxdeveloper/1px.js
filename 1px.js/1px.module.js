(function() {
	"use strict";
	
	const {Observable, AsyncSubject} = require("./observable");

	function noop() {}
	
	function _makeInjectable(callback) {
		if (Array.isArray(callback)) {
			let array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}
		
		if (typeof callback !== "function") {
			throw TypeError("factory must be array or function.");
		}
		
		if (!callback.$inject) {
			let s = callback.toString();
			callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(x => x);
		}
		
		return callback;
	}
	
	function _makePrefixModuleProvider($module, prefix) {
		function factory(name, callback) {
			$module.factory(prefix + name, callback);
		}
		
		factory.value = function(name, value) {
			$module.value(prefix + name, value);
		};
		
		factory.require = function(callback, resolve) {
			callback = _makeInjectable(callback);
			callback.$inject = callback.$inject.map(name => prefix + name);
			$module.require(callback, resolve);
		};
		
		return factory;
	}
	
	
	function createModule() {
		let values = Object.create(null);
		
		function value(name, _value) {
			let v = values[name] = values[name] || new AsyncSubject();
			
			if (arguments.length === 1) {
				return v;
			}
			
			v.next(_value);
			v.complete();
		}
		
		function require(callback, resolve) {
			resolve = resolve || noop;
			callback = _makeInjectable(callback);
			
			let args$ = callback.$inject.map(name => value(name));
			
			Observable.forkjoin(...args$).subscribe(args => {
				// @TODO: decorator(callback, args)
				resolve(callback.apply(null, args));
			})
		}
		
		function factory(name, callback) {
			require(callback, result => value(name, result))
		}
		
		let $module = {};
		$module._values = values;
		$module.value = value;
		$module.factory = factory;
		$module.require = require;
		$module.directive = _makePrefixModuleProvider($module, "directive.");
		$module.service = _makePrefixModuleProvider($module, "service.");
		$module.pipe = _makePrefixModuleProvider($module, "pipe.");
		
		return $module;
	}
	
	let $module = createModule();
	$module._makeInjectable = _makeInjectable;
	
	exports.$module = $module;
})();