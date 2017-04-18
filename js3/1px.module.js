(function(self) {

	///////////// Modules
	var $modules = {};
	var $factories = {};

	function createFactory(object) {
		if (typeof object === "function") {
			return createFactoryFromFunction(object);
		}

		if (Array.isArray(object)) {
			return createFactoryFromArray(object);
		}

		throw SyntaxError(object);
	}

	function createFactoryFromArray(array) {
		var factory = array.pop();
		if (typeof factory !== "function") {
			throw SyntaxError(array);
		}

		factory.$inject = array;
		factory.$inject.values = {};
		return factory;
	}

	function createFactoryFromFunction(factory) {
		if (typeof factory !== "function") {
			throw TypeError('factory is must be function.');
		}

		if (Array.isArray(factory.$inject)) {
			return factory;
		}

		if (factory.length === 0) {
			factory.$inject = [];
			factory.$inject.values = {};
			return factory;
		}

		var injector = factory.toString().match(/\([^)]*\)/m)[0];
		factory.$inject = injector.slice(1, -1).split(/\s*,\s*/);
		factory.$inject.values = {};
		return factory;
	}

	function invokeFactory(factory) {
		var args = [];
		for (var i = 0; i < factory.$inject.length; i++) {
			var name = factory.$inject[i];
			var module = factory.$inject.values[name] || getModule(name);
			if (!module) {
				throw "no module: " + name;
			}
			args.push(module);
		}

		return factory.apply(window, args);
	}

	function getModule(name) {
		if ($modules[name]) {
			return $modules[name];
		}

		var factory = $factories[name];
		if (factory) {
			$modules[name] = invokeFactory(factory);
			return $modules[name];
		}
	}


	var module = {};

	module.get = getModule;

	module.value = function(name, value) {
		$modules[name] = value;
		return this;
	};

	module.factory = function(name, factory) {
		$factories[name] = createFactory(factory);
		return this;
	};

	module.directive = function(name, factory) {
		return module.factory("@" + name, factory);
	};

	module.directive.get = function(name) {
		return module.get("@" + name);
	};

	module.require = function(factory) {
		invokeFactory(createFactory(factory));
	};

	module.components = {};

	module.component = function(name, factory) {
		module.components[name] = createFactory(factory);
	};

	function checkString(prefix, str, suffix, fn) {
		if (str.slice(0, prefix.length) === prefix && str.slice(-suffix.length) === suffix) {
			return fn(str.slice(prefix.length, -suffix.length));
		}
	}

	module.component.create = function(element) {
		var factory = module.components[element.tagName.toLowerCase()];
		if (!factory) {
			return;
		}

		factory.$inject.values["self"] = element;
		var props = invokeFactory(factory);
		foreach(props, function(value, name) {
			checkString("(", name, ")", function(prop) {
				element.addEventListener(prop, value);
				delete props[name];
			});
		});

		Object.assign(element, props);
	};


	self.module = module;
	self.app = module;


	/// Default Module value

	// $timeout
	module.value("$timeout", function(fn, duration) {
		fn = fn || noop;

		return new Promise(function(resolve) {
			setTimeout(function() {
				resolve(fn());
			}, duration);
		})
	});


	// $nextFrame
	module.factory("$nextFrame", function() {

		var callbacks = [];

		function enterFrame() {
			var _callbacks = callbacks.slice();
			callbacks = [];

			for (var i = 0, len = _callbacks.length; i < len; i++) {
				_callbacks[i].apply(window, arguments);
			}
		}

		function $nextFrame(callback) {
			if (typeof callback !== "function") {
				throw TypeError("argument 0 is must be function.");
			}

			if (callbacks.length === 0) {
				window.requestAnimationFrame(enterFrame);
			}
			callbacks.push(callback);
		}

		return $nextFrame;
	});


	// $nextFrame
	module.factory("$nextTick", function() {

		var callbacks = [];

		function enterFrame() {
			var _callbacks = callbacks.slice();
			callbacks = [];

			for (var i = 0, len = _callbacks.length; i < len; i++) {
				_callbacks[i].apply(window, arguments);
			}
		}

		function $nextTick(callback) {
			if (typeof callback !== "function") {
				throw TypeError("argument 0 is must be function.");
			}

			if (callbacks.length === 0) {
				Promise.resolve().then(enterFrame);
			}

			callbacks.push(callback);
		}

		return $nextTick;
	});



})(this);
