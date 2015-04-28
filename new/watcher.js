(function(window, document) {
	var $raf = window.requestAnimationFrame;
	var $caf = window.cancelAnimationFrame;
	var $hashmap = new WeakMap();

	function noop(){}

	/// @TODO: 이거 옛날 브라우저에 돌아가는 방법 고려해보자.
	function isDOM(o) {
		return (
			typeof Node === "object" ? o instanceof Node :
			o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
		);
	}

	function $observe(object, callback, queue) {

		if (Object(object) !== object) {
			return;
		}
		if (object === window || object === document || isDOM(object)) {
			return;
		}
		if ($hashmap.has(object) === true) {
			return $hashmap.get(object);
		}

		queue = queue || [];

		queue.push({
			object: object,
			shadow: Object.create(object),
			props: {}
		});

		function $watcher() {
			if ($watcher.stop === true) {
				return;
			}

			for (var i = 0, len = queue.length; i < len; i++) {
				var q = queue[i];
				var object = q.object;
				var props = q.props;
				var shadow = q.shadow;

				var flag = false;
				var changes = {};

				for (var prop in props) {
					var oldValue = shadow[prop];
					var newValue = object[prop];

					if (oldValue !== newValue && !(oldValue !== oldValue && newValue !== newValue)) {
						flag = true;
						changes[prop] = {oldValue: oldValue, newValue: newValue};
						shadow[prop] = newValue;
					}
				}
			}

			if (flag === true) {
				callback(changes);
			}

			$raf($watcher);
		}
		$raf($watcher);

		var $observer = {
			$watcher : $watcher,
			observe: function(object, key) {
				for (var i = 0, len = queue.length; i < len; i++) {
					var q = queue[i];
					if (q.object === object) {
						break;
					}
				}

				var o = queue[i] = queue[i] || {
					object: object,
					shadow: Object.create(object),
					props: {}
				};

				o.props[key] = undefined;
				o.shadow[key] = object[key];
			}
		};

		$hashmap.set(object, $observer);
		return $observer;
	}

	function $unobserve(object) {
		if (Object(object) !== object) {
			return;
		}

		if ($hashmap.has(object) === false) {
			return;
		}

		$hashmap.get(object).$watcher.stop = true;
		$hashmap["delete"](object);
	}


	window.$observe = $observe;
	window.$unobserve = $unobserve;

}(window, document));