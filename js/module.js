(function() {

	function createFactoryFromArray(array) {
		array = array.slice();
		let factory = array.pop();
		if (typeof factory !== "function") {
			throw SyntaxError(array);
		}

		factory.$inject = array;
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
			return factory;
		}

		let injector = factory.toString().match(/\([^)]*\)/m)[0];
		factory.$inject = injector.slice(1, -1).split(/\s*,\s*/);
		return factory;
	}

	function createFactory(mixed) {
		if (typeof mixed === "function") {
			return createFactoryFromFunction(mixed);
		}

		if (Array.isArray(mixed)) {
			return createFactoryFromArray(mixed);
		}

		throw SyntaxError(mixed);
	}


	function fillFactoryArguments(factory, args, index, callback) {
		if (index >= factory.$inject.length) {
			callback(args);
			return;
		}

		let name = factory.$inject[index];

		if (name in $values) {
			args[index] = $values[name];
			return fillFactoryArguments(factory, args, index + 1, callback);
		}

		$queue[name] = $queue[name] || [];
		$queue[name].push(arguments);

		if (name in $factories) {
			let f = createFactory($factories[name]);
			return fillFactoryArguments(f, [], 0, function(args) {
				module.value(name, f(...args));
			});
		}
	}


	/// Module
	let $values = Object.create(null);
	let $factories = Object.create(null);
	let $queue = Object.create(null);

	let module = {};

	module.value = function(name, value) {
		$values[name] = value;

		if ($queue[name]) {
			let q = $queue[name].slice();
			$queue[name] = [];
			q.forEach(args => {
				fillFactoryArguments(...args);
			});
		}

		return this;
	};

	module.factory = function(name, mixed) {
		$factories[name] = mixed;
		return this;
	};

	module.require = function(mixed) {
		let factory = createFactory(mixed);

		let ret;
		fillFactoryArguments(factory, [], 0, function(args) {
			ret = factory(...args);
		});

		return ret;
	};


	/// Short Cuts
	function createPrefixFactory(fn) {
		function create(name, mixed) {
			module.factory(fn(name), mixed);
		}

		create.require = function(name, callback) {
			return module.require([fn(name), callback]);
		};

		return create;
	}

	module.directive = createPrefixFactory(name => "@" + name);
	module.pipe = createPrefixFactory(name => "|" + name);
	module.component = createPrefixFactory(name => "<" + name.toUpperCase() + ">");


	/// @FIXME: 임시 확인용
	module.$values = $values;
	module.$factories = $factories;
	module.$queue = $factories;


	window.module = module;
})();
