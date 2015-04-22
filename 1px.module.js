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
(function(window, document, undefined) { "use strict";

	var _module = {};
	var _component = {};
	var _recipe = {};

	function noop() {}

	function each(obj, fn) {
		if (!obj) return;
		for(var prop in obj) {
			obj.hasOwnProperty(prop) && fn(obj[prop], prop);
		}
	}

	function $component(name) {
		return (_component[name] = _component[name] || {});
	}

	function $recipe(name) {
		return (_recipe[name] = _recipe[name] || {});
	}

	function createRecipeFromFactory(factory) {
		if (typeof factory !== "function") {
			throw TypeError('factory is must be function.');
		}

		if (factory.length === 0) return [factory];
		var deps = factory.toString().match(/\([^)]*\)/m)[0];
		var recipe = deps.slice(1, -1).split(/\s*,\s*/);
		recipe.push(factory);
		return recipe;
	}

	function define(module, name, recipe, invoker) {
		if (typeof recipe === "function") {
			recipe = createRecipeFromFactory(recipe);
		}
		recipe.$invoker = invoker || defaultInvoker;
		$recipe(module.name)[name] = recipe;
	}

	function block(module, name, recipe) {
//		var module = $block(module.name)["block/"+name] = recipe;
	}

	function require(module, name, stack) {
		stack = stack || [];

		var modules = module.dependencies.concat([module.name]);
		var index = modules.length;
		while(index--) {
			var module_name = modules[index];
			var component = $component(module_name);
			var recipe = $recipe(module_name);

			if (component.hasOwnProperty(name)) {
				return component[name];
			}

			if (recipe.hasOwnProperty(name) === false) {
				continue;
			}

			if (stack.indexOf(name) >= 0) {
				stack.unshift(name);
				throw Error("circurlar defined. " + stack.join(" <- "));
			}

			stack.unshift(name);
			var result = component[name] = invoke(module, recipe[name], stack);
			stack.pop();
			return result;
		}

		throw Error("'" + name + "' is not defined. ");
	}

	function invoke(module, recipe, stack) {
		stack = stack || [];

		var inject = recipe.slice();
		var factory = inject.pop();

		return recipe.$invoker(module, factory, inject, stack);
	}

	function defaultInvoker(module, factory, inject, stack) {
		var args = [];
		inject.forEach(function(name) {
			args.push(require(module, name, stack));
		});

		return factory.apply(null, args);
	}

	function controllerInvoker(module, factory, inject, stack) {
		var $scope = {};
		$component(module.name)["self"] = $scope;

		var args = [];
		inject.forEach(function(name) {
			args.push(require(module, name, stack));
		});

		var methods = factory.apply(null, args);

		each(methods, function(method, prop) {
			$scope[prop] = method;
		});
		if (typeof $scope["init"] === "function") {
			$scope["init"]();
		}

		delete $component(module.name)["self"];

		return $scope;
	}


	function Module(name, dependencies) {
		this.name = name;
		this.dependencies = dependencies;
	}
	Module.prototype = {
		require: function(name) {
			return require(this, name);
		},

		factory: function(name, recipe) {
			return define(this, name, recipe);
		},

		value: function(name, value) {
			if (arguments.length === 1) {
				var self = this;
				each(name, function(value, name) {
					self.value(name, value);
				});
				return self;
			}

			return $component(this.name)[name] = value;
		},

		directive: function(name, recipe) {
			return define(this, "directive/" + name, recipe);
		},

		controller: function(name, recipe) {
			return define(this, "controller/" + name, recipe, controllerInvoker);
		}
	};


	function $module(name, dependencies, define) {
		var module = _module[name] = _module[name] || new Module(name, ["1px"]);
		if (arguments.length === 1) {
			return module;
		}

		if (typeof dependencies === "function") {
			define = dependencies;
		}
		else if (+dependencies.length) {
			for (var i = 0, len = dependencies.length; i < len; i++) {
				var name = dependencies[i];
				if (!module.dependencies[name]) {
					module.dependencies.push(name);
				}
				module.dependencies[name] = name;
			}
		}

		if (typeof define === "function") {
			define.call(null, module);
		}

		return module;
	}

	$module("1px", [], function(module) {
		module.value({
			"window": window,
			"document": document,
			"noop": noop
		});
	});

	window.$module = $module;

})(window, document);
