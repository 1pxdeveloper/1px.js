(function(self) {

	let module = {};


	/// Module - Value
	let $values = {};

	module.value = function(name, obj) {
		$values[name] = obj;
		return this;
	};


	/// Module - Factory
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

	function invokeFactory$(name) {
		if (!$factories[name]) {
			return watch$($factories, "name").map(_ => invokeFactory$(name));
		}

		let factory = $factories[name];

		/// Dependancy
		return Observable.from(factory.$inject).mergeMap(name => {
			return factory.$inject.values[name] || $values[name] || invokeFactory$(name);
		}).mergeAll().map(args => {
			$values[name] = factory.apply(null, args);
			return $values[name];
		});
	}

	module.factory = function(name, mixed) {
		$factories[name] = createFactory(mixed);
		return this;
	};

	module.get$ = function(name) {
		return $values[name] ? Observable.of($values[name]) : invokeFactory$(name);
	};


	/// Short Cuts
	function createPrefixFactory(fn) {
		function create(name, factory) {
			$factories[fn(name)] = createFactory(factory);
		}

		create.get$ = function(name) {
			return module.get$(fn(name));
		};

		return create;
	}

	module.directive = createPrefixFactory(name => "@" + name);
	module.pipe = createPrefixFactory(name => "|" + name);
	module.component = createPrefixFactory(name => "<" + name.toUpperCase() + ">");


	/// @FIXME: 임시 확인용
	module.$values = $values;
	module.$factories = $factories;

	window.module = module;
})(this);
