(function(self) {

	///////////// Modules
	let $modules = {};
	let $factories = {};

	function createFactoryFromArray(array) {
		let factory = array.pop();
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

		let injector = factory.toString().match(/\([^)]*\)/m)[0];
		factory.$inject = injector.slice(1, -1).split(/\s*,\s*/);
		factory.$inject.values = {};
		return factory;
	}

	function createFactory(object) {
		if (typeof object === "function") {
			return createFactoryFromFunction(object);
		}

		if (Array.isArray(object)) {
			return createFactoryFromArray(object);
		}

		throw SyntaxError(object);
	}

	function invokeFactory(factory) {
		let args = [];
		for (let i = 0; i < factory.$inject.length; i++) {
			let name = factory.$inject[i];
			let module = factory.$inject.values[name] || getModule(name);
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

		let factory = $factories[name];
		if (factory) {
			$modules[name] = invokeFactory(factory);
			return $modules[name];
		}
	}

	let module = {};

	module.get = getModule;

	module.value = function(name, value) {
		$modules[name] = value;
		return this;
	};

	module.factory = function(name, factory) {
		$factories[name] = createFactory(factory);
		return this;
	};

	function createPrefixFactory(fn) {
		function create(name, factory) {
			$factories[fn(name)] = createFactory(factory);
		}

		create.get = function(name) {
			return getModule(fn(name));
		};

		return create;
	}

	module.directive = createPrefixFactory((name) => "@" + name);
	module.pipe = createPrefixFactory((name) => "|" + name);
	module.component = createPrefixFactory((name) => "<" + name.toUpperCase() + ">");

	module.require = function(factory) {
		invokeFactory(createFactory(factory));
	};


	self.app = self.module = module;

})(this);
