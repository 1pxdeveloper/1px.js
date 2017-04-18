$module("1px").factory("$localStorage", [function() {
	"use strict";

	//var localStorage = window.localStorage;
	//if (typeof localStorage === "undefined") {
	//	var storage = {};
	//	localStorage.setItem = function(key, value) { storage[key] = value; };
	//	localStorage.getItem = function(key, value) { return storage[key]; };
	//	localStorage.removeItem = function(key, value) { delete storage[key]; };
	//}
	//

	function get_localStorage(key) {
		try {
			return JSON.parse(localStorage.getItem(key));
		} catch(e) {
			return null;
		}
	}

	function set_localStorage(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	function remove_localStorage(key) {
		localStorage.removeItem(key);
	}


	/// export $localStorage
	return function() {
		function $localStorage(key, value) {
			if (arguments.length === 1) return get_localStorage(key);
			if (arguments.length === 2 && value === undefined) return remove_localStorage(key);
			if (arguments.length === 2) return set_localStorage(key, value);
		}

		$localStorage.clear = function() {
			localStorage.clear();
		};

		return $localStorage;
	}();
}]);