/// @FIXME: 여기는 일단 RUN & FIX 입니다..

/*
 @TODO:
 0. 무엇보다 소스 정리
 */
(function(window) {
	var _modules = {};
	var _components = {};
	var _sources = {};

	setTimeout(function() {
		console.log(_components)
	}, 100);

	function store() {

	}

	function define(module, name, deps, factory) {
		factory.$inject = deps;
		_sources[name] = factory;
	}

	function require(name, stack) {
		stack = stack || [];

		return (_components[name] || function(factory) {
			if (!factory) {
				throw new Error(name + " is undefined.");
			}
			if (stack.indexOf(name) >= 0) {

				/// Circular defined 문제를 exports로 해결함. @FIXME: 변수명 고민고민..
				function exports() {}

				_components[name] = new exports();

				var ret = invoke(factory, stack);
				if (ret && typeof ret === "object") {
					exports.prototype = ret;
					return _components[name];
				}

				stack.unshift(name);
				throw new Error("Circular dependency found. " + stack.join(" <- "));
			}

			stack.unshift(name);
			return (_components[name] = invoke(factory, stack));

		}(_sources[name]));
	}

	function invoke(factory, stack) {
		var args = [], inject = factory.$inject;
		for (var i = 0, length = inject.length; i < length; i++) {
			args.push(require(inject[i], stack));
		}
		return factory.apply(null, args);
	}

	function createController(name, stack) {
		var modules = _components,
			sources = _sources;

		return (modules[name] || function() {
			var factory = sources[name];
			var injections = [];
			factory.$inject.forEach(function(name) {
				injections.push(require(name, stack));
			});

			var self = {};
			injections.unshift(self);
			var controller = factory.apply(window, injections);

			for (var prop in controller) {
				if (controller.hasOwnProperty(prop)) {
					self[prop] = controller[prop];
				}
			}

			if (typeof self.init === "function") {
				self.init();
			}

			modules[name] = self;
			return modules[name];
		}());
	}

	function itself(value) {
		return function() {
			return value;
		};
	}

	function parseDepsFromFactory(factory) {
		var deps = factory.toString().match(/\([^)]*\)/m)[0];
		return deps.slice(1, -1).split(/\s*,\s*/);
	}

	function Module(name, dependencies) {
		this.name = name;
		this.dependencies = dependencies;
	}

	Module.prototype = {
		factory: function(name, deps, factory) {
			define(this, name, deps, factory);
			return this;
		},

		require: function(name) {
			var prefix = "controller/";
			if (name.slice(0, prefix.length) === prefix) {
				return createController(name);
			}

			return require(name)
		},

		provide: function(deps, factory) {
			factory.$inject = deps;
			var obj = invoke(factory);

			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					define(this, prop, [], itself(obj[prop]));
				}
			}
			return this;
		},

		directive: function(name, deps, factory) {
			define(this, "directive/" + name, deps, factory);
			return this;
		},

		controller: function(name, deps, factory) {
			if (arguments.length === 2) {
				factory = deps;
				deps = parseDepsFromFactory(factory);
				deps.shift();
			}

			define(this, "controller/" + name, deps, factory);
			return this;
		},

		value: function(name, value) {
			_components[name] = value;
			return this;
		},

		run: function(deps, fn) {
			fn.$inject = deps;
			invoke(fn);
			return this;
		}
	};

	function $module(name, deps) {
		if (_modules[name]) {
			return _modules[name];
		}

		_modules[name] = new Module(name, deps);
		return _modules[name];
	}

	window.$module = $module;

}(window));

