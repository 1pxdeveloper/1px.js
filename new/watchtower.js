(function(window, document) {
	var $$raf = window.requestAnimationFrame;

	function noop(){}

	function notEqual(a, b) {
		return a !== b;
	}

	function notEqualNaN(a, b) {
		return b === b;
	}

	function $watchTower(map, $callback) {
		var queue = [];

		function $watcher() {
			if ($watcher.stop === true) {
				return;
			}

			var flag = false;
			for (var i = 0, len = queue.length; i < len; i++) {
				var q = queue[i];
				var object = map[q.path];
				if (!object) {
					continue;
				}

				var key = q.key;
				var oldValue = q.value;
				var newValue = object[key];

//				console.log(q);

				if (q.notEqual(oldValue, newValue)) {
					console.log(q);

					q.value = newValue;
					q.notEqual = newValue === newValue ? notEqual : notEqualNaN;

					for (var j = 0, jlen = q.callbacks.length; j < jlen; j++) {
						var callback = q.callbacks[j];
						callback(object, key, oldValue, newValue);
					}
					flag = true;

					/// @TODO: unobserve(oldValue, key)?
				}
			}

			if (flag) {
				$callback();
			}

			$$raf($watcher);
		}

		return {
			$watch: function(object, path, key, callback) {
				map[path] = object;

				console.log("$watch", path, key, map);

				for (var i = 0, len = queue.length; i < len; i++) {
					var q = queue[i];
					if (q.path === path && q.key === key) {
						// @TODO: return이 아니고 callback이 다르면 array형태로 추가 해야된다!!
						if (q.callbacks.indexOf(callback) === -1) {
							q.callbacks.push(callback);
						}
						return;
					}
				}

				queue.push({
					notEqual: notEqual,
					path: path,
					key: key,
					callbacks: [callback]
				});

				if (queue.length === 1) {
					$$raf($watcher);
				}
			},

			find: function(key) {
				return this.$scope[key];
			}
		};
	}

	window.$watchTower = $watchTower;

}(window, document));