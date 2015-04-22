$module("1px", [], function(module) {

	function each(obj, fn) {
		if (!obj) return;
		for (var prop in obj) {
			obj.hasOwnProperty(prop) && fn(prop);
		}
	}

	function foreach(collection, fn) {
		if (typeof collection !== "object" || collection == null) {
			return collection;
		}

		if (+collection.length) {
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
			each(arguments[i], function(value, key) {
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

	module.value({
		"foreach": foreach,
		"extend": extend,
		"makeArray": makeArray,
		"trim": trim,
		"$cache": $cache // @FIXME: 글로벌 저장 공간에 대한 구성 필요!!
	});
});

