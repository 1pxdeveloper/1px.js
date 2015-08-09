(function(window, document) {
	var $$raf = window.requestAnimationFrame;
	$$raf = function(fn) {
		return setTimeout(fn, 250);
	};

	function notEqual(a, b) {
		return a !== b;
	}

	function notEqualNaN(a, b) {
		return b === b;
	}

	function $watchTower($map, $callback) {
		var $table = {};

		function $watcher() {
			var flag = false;

			for (var prop in $table) {
				var object = $map[prop];
				if (!object) {
					continue;
				}

				var $keys = $table[prop];
				for (var key in $keys) {
					var $key = $keys[key];
					var oldValue = $key.value;
					var newValue = object[key];

					if ($key.notEqual(oldValue, newValue)) {
						$key.value = newValue;
						$key.notEqual = newValue === newValue ? notEqual : notEqualNaN;
						for (var uuid in $key.tokens) {
							var token = $key.tokens[uuid];
							token.uncache();							
						}

						flag = true;
					}
				}
			}

			if (flag) {
				$callback();
			}

			$$raf($watcher);
		}
		
		/// @TODO: 첫 watch일때 실행시킬수 있도록!
		$$raf($watcher);


		return {
			$watch: function(obj, path, key, token) {
				delete $map[token.prop];
				$map[path] = obj;

				var $keys = $table[path] = $table[path] || {};
				var $key = $keys[key] = $keys[key] || {
					tokens: {},
					notEqual: notEqual
				};

				$key.tokens[token.uuid] = token;
				token.prop = path;
				token.path = path + "/" + key;
			},
			
			find: function(key) {
				return this.$scope[key];
			}
		};
	}

	window.$watchTower = $watchTower;

}(window, document));