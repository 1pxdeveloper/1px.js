function $module() {
	var $component = {};
	var $recipe = {};

	function define(name, recipe) {
		$recipe[name] = recipe;
	}

	function require(name) {
		if ($component.hasOwnProperty(name)) {
			return $component[name];
		}

		if ($recipe.hasOwnProperty(name)) {
			return ($component[name] = invoke($recipe[name]));
		}
	}

	function invoke(recipe) {
		var factory = recipe.pop();
		var args = recipe.map(require);
		return factory.apply(null, args);
	}

	this.factory = define;
	this.require = require;
}

var module = new $module();


module.factory("http", ["hello", function(hello) {
	return function() {
		console.log(hello() + "http");
	}
}]);


module.factory("hello", [function() {
	return function() {
		return "hello";
	}
}]);


var http = module.require("http");

console.log(http);
console.log(http());


