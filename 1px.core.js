$module("1px").define([function() {

	function noop(){}

	function foreach(collection, fn) {
		if (typeof collection !== "object" || collection == null) {
			return collection;
		}

		if (collection.length >= 0) {
			for (var i = 0, len = collection.length; i < len; i++) {
				if (fn(collection[i], i) === false) {
					return collection;
				}
			}
			return collection;
		}

		for (var key in collection) {
			if (collection.hasOwnProperty(key)) {
				if (fn(collection[key], key) === false) {
					return collection;
				}
			}
		}

		return collection;
	}

	function extend(target) {
		if (target === null || typeof target !== "object") return target;

		for (var i = 1, len = arguments.length; i < len; i++) {
			foreach(arguments[i], function(value, key) {
				target[key] = value;
			});
		}

		return target;
	}

	function makeArray(arr) {
		var len = arr.length, result = Array(len), i;
		for (i = 0; i < len; i++) {
			result[i] = arr[i];
		}
		return result;
	}

	var regex_trim = /^\s+|\s+$'/g;
	function trim(str) {
		return str && str.replace(regex_trim, "");
	}



	var ua = navigator.userAgent;
	var msie = +(/msie (\d+)/i.exec(ua) || [])[1];
	if (!msie) {
		msie = /trident/i.test(ua) ? 11 : NaN;
	}
	var ios = +(/iphone|ipad (\d+)/i.exec(ua) || [])[1];



	var _cache = {};
	function $cache(name) {
		return (_cache[name] = _cache[name] || {});
	}


	function $timeout(fn, delay) {
		setTimeout(function() {
			fn();
			/// @FIXME: document.update를 어떻게는 없애는 걸로...
			document.update();
		}, delay)
	}

	return {
		"noop": noop,
		"foreach": foreach,
		"extend": extend,
		"makeArray": makeArray,
		"trim": trim,
		"msie": msie,
		"ios": ios,
		"$cache": $cache,

		"$timeout": $timeout
	}
}]);