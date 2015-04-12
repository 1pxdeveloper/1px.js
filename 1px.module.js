/// @FIXME: 여기는 일단 RUN & FIX 입니다..

/*
 @TODO:

 용어를 정리하자.

 require, define - AMD 모듈 용어
 Module
 Dependency

 Component
 Recipe(factory + injection + invoker)
 Block

 Factory

 Invoker
 InvokerBlock
 BlockProvider..

 define Recipe(factory + injection + invoker) -> Invoke Factory -> create Component

 */
"use strict";

(function(window, document, undefined) {
	Object.freeze = Object.freeze || function(){};

	var _modules = {};
	var _storage = {};

	function $storage(module, namespace, value) {
		var ret = _storage[module.name] = _storage[module.name] || {};
		ret = ret[namespace] = ret[namespace] || value || {};
		return ret;
	}

	function $find(module, namespace, key) {
		var ret = _storage[module.name];
		if (!ret) return;
		ret = ret[namespace];
		if (!ret) return;
		return key in ret && {value: ret[key]};
	}

	function $lookup(module, namespace, key) {
		var ret = $find(module, namespace, key);
		if (ret) return ret;

		var i = module.dependencies.length;
		while(i--) {
			ret = $lookup($module(module.dependencies[i]), namespace, key);
			if (ret) return ret;
		}
	}



	function define(module, name, recipe, invoker) {
		recipe.$invoker = invoker;
		$storage(module, "recipe")[name] = recipe;
		return module;
	}

	function block(module, name, deps, factory) {
		factory.$inject = deps;
		$storage(module, "block/" + name, []).push(factory);
		return module;
	}

	function setComponent(module, name, value) {
		$storage(module, "components")[name] = value;
		return module;
	}


	/// @TODO: Factory에서 Component로 바뀌면 해당 Factory는 삭제하는 걸로...
	function require(module, name, stack) {
		stack = stack || [];

		/// Look up Component: return component.
		var component = $lookup(module, "components", name);
		if (component) {
			component = component.value;
			setComponent(module, name, component);
			return component;
		}


		/// Look up Recipe
		var recipe = $lookup(module, "recipe", name);
		if (!recipe) {
			throw new Error(name + " is undefined.");
		}
		recipe = recipe.value;

		var factory = recipe.pop();
		factory.$inject = recipe;
		factory.$invoker = recipe.$invoker;

		/// Circular defined
		if (stack.indexOf(name) >= 0) {
			stack.unshift(name);

			// Circular defined 문제를 exports로 해결함. @FIXME: 변수명 고민고민..
			var Exports = function(){};
			var exports = new Exports;
			setComponent(module, name, exports);
			var proto = invoke(module, factory, stack);
			if (proto && typeof proto === "object") {
				Exports.prototype = proto;
				return exports;
			}

			throw new Error("Circular dependency found. " + stack.join(" <- "));
		}

		/// Create Component from Recipe
		stack.unshift(name);
		var ret = $storage(module, "components")[name] = invoke(module, factory, stack);
		stack.shift();
		return ret;
	}


	/// --- Invoker
	function invoke(module, factory, stack) {
		var args = [], inject = factory.$inject;
		for (var i = 0, length = inject.length; i < length; i++) {
			args.push(require(module, inject[i], stack));
		}

		return (factory.$invoker || defaultInvoker)(factory, args)
	}

	function defaultInvoker(factory, args) {
		return factory.apply(null, args);
	}

	function controllerInvoker(factory, args) {
		var controller = {};
		args.unshift(controller);
		var ret = factory.apply(null, args);
		for (var prop in ret) {
			ret.hasOwnProperty(prop) && (controller[prop] = ret[prop]);
		}

		if (typeof controller["init"] === "function") {
			controller["init"]();
		}

		return controller;
	}


	/// --- Blocks -> @NOTE: 그러고 보니 얘도 invoker네~
	function invokeBlocks(module, blockName, providerHanlder) {
		var provideBlocks = $storage(module, "block/"+blockName, []);
		while(provideBlocks.length) {
			providerHanlder(module, invoke(module, provideBlocks.shift()));
		}
	}

	function invokeAllBlocks(module, blockName, providerHanlder) {
		for (var i = 0, len = module.dependencies.length; i < len; i++) {
			invokeBlocks($module(module.dependencies[i]), blockName, providerHanlder);
		}
		invokeBlocks(module, blockName, providerHanlder);
	}

	function defineBlockProvider(module, result) {
		for (var prop in result) {
			if (result.hasOwnProperty(prop)) {
				module.value(prop, result[prop]);
			}
		}
	}



	var regex_args = /\([^)]*\)/m;
	var regex_comma = /\s*,\s*/;

	function parseDependenciesFromFactory(factory) {
		var deps = factory.toString().match(regex_args)[0];
		return deps.slice(1, -1).split(regex_comma);
	}




	/// Export Module
	function $module(name, deps) {
		if (arguments.length === 1) {
			if (!_modules[name]) throw new Error("Module '" + name + "' is not defined.");
			return _modules[name];
		}

		if (arguments.length === 2) {
			/// @TODO: deps가 있으면 초기화
			deps = deps || [];
			return (_modules[name] = new Module(name, deps));
		}

		throw new SyntaxError("$module(name, deps): name is required.");
	}

	function Module(name, dependencies) {
		this.name = name;
		this.dependencies = dependencies || [];
	}

	Module.prototype = {
		require: function(name) {
			invokeAllBlocks(this, "define", defineBlockProvider);
			return require(this, name);
		},

		// define
		factory: function(name, recipe) {
			return define(this, name, recipe);
		},

		value: function(name, value) {
			return setComponent(this, name, value);
		},

		constant: function(name, constant) {
			Object.freeze(constant);
			return setComponent(this, name, constant);
		},

		/// define with provider
		directive: function(name, recipe) {
			return define(this, "directive/" + name, recipe);
		},

		controller: function(name, recipe) {
			if (typeof recipe === "function") {
				var factory = recipe;
				recipe = parseDependenciesFromFactory(factory);
				recipe.shift();
				recipe.push(factory);
			}

			return define(this, "controller/" + name, recipe, controllerInvoker);
		},


		/// blocks
		define: function(recipe) {
			var factory = recipe.pop();
			return block(this, "define", recipe, factory);
		},

		config: function(recipe) {
			var factory = recipe.pop();
			return block(this, "config", recipe, factory);
		},

		run: function(recipe) {
			var factory = recipe.pop();
			return block(this, "run", recipe, factory);
		}
	};

	window.$module = $module;


	setTimeout(function() {
		console.log("modules", _modules);
		console.log("storage", _storage);
	}, 500);


	var module = $module("1px", []);
	module.value("window", window);
	module.value("document", document);

})(window, document);
