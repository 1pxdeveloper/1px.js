(function(window, document, undefined) {

	// @TODO: Object.observe, Array.observe를 사용하는 기법도 만들어 보자

	var DATE_SET_METHOD = [
		"setDate",
		"setFullYear",
		"setHours",
		"setMilliseconds",
		"setMinutes",
		"setMonth",
		"setSeconds",
		"setTime",
		"setUTCDate",
		"setUTCFullYear",
		"setUTCHours",
		"setUTCMilliseconds",
		"setUTCMinutes",
		"setUTCMonth",
		"setUTCSeconds",
		"setYear"
	];

	var $count = 0;

	function $dirtyCheck(object, prop, callback, value) {
		if (!Object.is(value, object[prop])) {
			if (callback(object[prop], value) === false) {
				return;
			}
		}

		if (callback.$canceled) {
			delete callback.$canceled;

			//$count--;
			//console.log("canceled!!!", object, prop, $count);

			return;
		}

		value = object[prop];
		$nextFrame(function() {
			$dirtyCheck(object, prop, callback, value);
		});
	}

	function applyWatchCallback(object, prop, newValue, oldValue) {

		var desc = Object.getOwnPropertyDescriptor(object, prop);
		if (!desc || !desc.set || !desc.set.$isWatch) {
			return;
		}

		var setter = desc.set;
		var callbacks = setter.$callbacks.slice();

		for (var i = 0, len = callbacks.length; i < len; i++) {
			var callback = callbacks[i];
			var ret = callback.call(object, prop, newValue, oldValue);
			if (ret === false) {
				$unwatch(object, prop, callback);
			}
		}
	}

	var count = 0;

	function $watch(object, prop, callback) {

		/// arguments 에외처리
		if (!object || typeof object !== "object") {
			return;
		}

		if (typeof callback !== "function") {
			throw TypeError("arguments 2 is must be function.");
		}

		var desc = Object.getOwnPropertyDescriptor(object, prop);
		if (desc && desc.set && desc.set.$isWatch) {
			desc.set.$callbacks.push(callback);
			return;
		}


		/// @TODO: 여기 정리 필요!!
		// @TODO: 1) dirtyCheck와 Property Setter를 구분하는 로직 정리
		// @TODO: 2) Object.observe와 Array.observe 사용 추가

		if (Array.isArray(object) && +prop === +prop && +prop >= object.length) {
			return;
		}

		// setter watch를 사용할 수 없는 경우,
		if (
			//(Array.isArray(object) && +prop === +prop)
			 (prop in object && !desc)
			|| (desc && desc.configurable === false)
			|| (desc && desc.writable === false)
			|| (desc && desc.get)
		) {
			//$count++;
			//console.log("add!!", object, prop, $count);

			return $dirtyCheck(object, prop, callback, object[prop]);
		}

		/// setter에 watcher를 등록한다.
		var value = object[prop];
		var setter = function(newValue) {

			var oldValue = value;

			if (Object.is(value, newValue)) {
				return;
			}

			//if (newValue instanceof Date) {
			//	DATE_SET_METHOD.forEach(function(p) {
			//		newValue[p] = function() {
			//			Date.prototype[p].apply(this, arguments);
			//			applyWatchCallback(object, prop, newValue, oldValue);
			//		}
			//	});
			//}

			value = newValue;
			applyWatchCallback(object, prop, newValue, oldValue);
		};
		setter.$isWatch = true;
		setter.$callbacks = [callback];


		Object.defineProperty(object, prop, {
			enumerable: true,
			configurable: true,
			set: setter,
			get: function() {
				return value;
			}
		});
	}


	function $unwatch(object, prop, callback) {
		if (!object || typeof object !== "object") {
			return;
		}

		// for dirty Check
		callback.$canceled = true;

		// ...
		var desc = Object.getOwnPropertyDescriptor(object, prop);
		if (desc && desc.set && desc.set.$isWatch) {
			var setter = desc.set;
			var index = setter.$callbacks.indexOf(callback);

			setter.$callbacks.splice(index, 1);
			if (setter.$callbacks.length === 0) {
				var value = object[prop];
				delete object[prop];
				object[prop] = value;
			}
		}
	}


	window.$watch = $watch;
	window.$unwatch = $unwatch;


	module.factory("$watch", function() {
		return $watch;
	});

	module.factory("$unwatch", function() {
		return $unwatch;
	});


})(window, document);