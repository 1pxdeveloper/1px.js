(function() {
	"use strict";
	
	function noop() {}
	
	function Register(value) {
		this.queue = Object.create(null);
		this.value = value || Object.create(null);
	}
	
	Register.prototype = {
		
		get(name) {
			return this.value[name];
		},
		
		delete(name) {
			delete this.value[name];
			delete this.queue[name];
		},
		
		define(name, value) {
			this.value[name] = value;
			
			if (this.queue[name]) {
				this.queue[name].forEach(callback => {
					callback(name, value);
				});
			}
		},
		
		isDefined(name) {
			return name in this.value;
		},
		
		whenDefined(name, callback) {
			this.queue[name] = this.queue[name] || [];
			this.queue[name].push(callback);
			
			if (name in this.value) {
				callback(name, this.value[name]);
			}
		},
	};
	
	
	const value$$ = new Register();
	const factory$$ = new Register();
	
	function _makeInjectable(callback) {
		if (Array.isArray(callback)) {
			let array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}
		
		if (typeof callback !== "function") {
			throw TypeError("factory must be array or function.");
		}
		
		if (callback.$inject) {
			return callback;
		}
		
		let s = callback.toString();
		callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(x => x);
		return callback;
	}
	
	function _invokeValue(resolve, callback, args, index, name, value) {
		args[index] = value;
		for (let k = 0; k < args.length; k++) if (!(k in args)) return;
		resolve(callback.apply(null, args));
	}
	
	function _invokeFactory(name, factory) {
		if (!value$$.isDefined(name)) {
			$module.require(factory, value$$.define.bind(value$$, name));
		}
	}
	
	function _makePrefixModuleProvider(prefix) {
		function factory(name, callback) {
			$module.factory(prefix + name, callback);
		}
		
		factory.value = function(name, value) {
			$module.value(prefix + name, value);
		};
		
		factory.require = function(callback) {
			callback = _makeInjectable(callback);
			callback.$inject = callback.$inject.map(name => prefix + name);
			$module.require(callback);
		};
		
		return factory;
	}
	
	
	/// exports
	function $module() {
		/// @TODO ...
	}
	
	$module.value = function(name, value) {
		value$$.define(name, value);
	};
	
	$module.factory = function(name, callback) {
		value$$.delete(name);
		factory$$.define(name, _makeInjectable(callback));
	};
	
	$module.require = function(callback, resolve) {
		resolve = resolve || noop;
		callback = _makeInjectable(callback);
		if (!callback.$inject.length) {
			resolve(callback());
		}
		
		let args = Array(callback.$inject.length);
		callback.$inject.forEach((name, index) => {
			factory$$.whenDefined(name, _invokeFactory);
			value$$.whenDefined(name, _invokeValue.bind(null, resolve, callback, args, index));
		});
	};
	
	$module.directive = _makePrefixModuleProvider("directive.");
	$module.service = _makePrefixModuleProvider("service.");
	$module.pipe = _makePrefixModuleProvider("pipe.");
	
	
	exports.$module = $module;
})();