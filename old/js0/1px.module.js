///////////// Modules

var $modules = {};
var $factories = {};
var $directives = {};
var $directives_modules = {};

function createFactory(object) {
	if (Array.isArray(object)) {
		return createFactoryFromArray(object);
	}

	if (typeof object === "function") {
		return createFactoryFromFunction(object);
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

var module = {};
var app = module;

module.value = function(name, value) {
	$modules[name] = value;
	return this;
};

module.factory = function(name, factory) {
	$factories[name] = createFactory(factory);
	return this;
};

module.directive = function(name, factory) {
	$directives[name] = createFactory(factory);
	return this;
};

module.directive.get = function(name) {
	if (!$directives_modules[name]) {
		var factory = $directives[name];
		if (factory) {
			$directives_modules[name] = module.invoke(factory);
		}
	}

	return $directives_modules[name];
};


module.get = function(name) {
	if ($modules[name]) {
		return $modules[name];
	}

	var factory = $factories[name];
	if (factory) {
		$modules[name] = module.invoke(factory);
		return $modules[name];
	}

	throw Error("no module: " + name);
};


module.invoke = function(factory) {
	var args = [];
	foreach(factory.$inject, function(name) {
		if (factory.$inject.values[name]) {
			args.push(factory.$inject.values[name])
		}
		else {
			args.push(module.get(name));
		}
	});

	return factory.apply(window, args);
};


/// Default Module value
module.value("$timeout", function(fn, duration) {
	fn = fn || noop;

	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(fn());
		}, duration);
	})
});
