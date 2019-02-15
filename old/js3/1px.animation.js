module.factory("transform", function() {

	return {
		translate: function(el, x, y, z) {
			x = x || 0;
			y = y || 0;
			z = z || 0;

			x = Number.isNumber(x) ? x + "px" : x;
			y = Number.isNumber(y) ? y + "px" : y;
			z = Number.isNumber(z) ? z + "px" : z;

			el.style.webkitTransform = "translate3d(" + x + "," + y + "," + z + ")";
		},

		opacity: function(el, value) {
			el.style.opacity = value;
		}
	}
});

var Animation = (function() {

	var $rAF = window.requestAnimationFrame;
	$rAF.cancel = function() {
		window.cancelAnimationFrame.apply(window, arguments);
	};

	var FRAME_RATE = 1000 / 60;

	function cubic_bezier(x1, y1, x2, y2, epsilon) {
		epsilon = epsilon || 1e-3;

		var curveX = function(t) {
			var v = 1 - t;
			return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
		};

		var curveY = function(t) {
			var v = 1 - t;
			return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
		};

		var derivativeCurveX = function(t) {
			var v = 1 - t;
			return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
		};

		return function(t) {

			var x = t, t0, t1, t2, x2, d2, i;

			// First try a few iterations of Newton's method -- normally very fast.
			for (t2 = x, i = 0; i < 8; i++) {
				x2 = curveX(t2) - x;
				if (Math.abs(x2) < epsilon) {
					return curveY(t2);
				}
				d2 = derivativeCurveX(t2);
				if (Math.abs(d2) < 1e-6) {
					break;
				}
				t2 = t2 - x2 / d2;
			}

			t0 = 0;
			t1 = 1;
			t2 = x;

			if (t2 < t0) {
				return curveY(t0);
			}
			if (t2 > t1) {
				return curveY(t1);
			}

			// Fallback to the bisection method for reliability.
			while (t0 < t1) {
				x2 = curveX(t2);
				if (Math.abs(x2 - x) < epsilon) {
					return curveY(t2);
				}
				if (x > x2) {
					t0 = t2;
				}
				else {
					t1 = t2;
				}
				t2 = (t1 - t0) * 0.5 + t0;
			}

			// Failure
			return curveY(t2);

		};
	}

	var $default_ease = cubic_bezier(0.25, 0.5, 0.25, 1);

	window.ease = $default_ease;

	function render(startTime, timestamp, table, update, defer) {
		defer.nextFrame = $rAF(function(timestamp) {
			render(startTime, timestamp, table, update, defer);
		});

		var t = Math.floor((timestamp - startTime) / FRAME_RATE);
		var value = table[t];
		value = value === undefined ? 1 : value;

		var result = update(value);

		if (value === 1) {
			$rAF.cancel(defer.nextFrame);
			return defer.resolve(1);
		}

		if (result === false) {
			$rAF.cancel(defer.nextFrame);
			return defer.reject();
		}
	}

	function easing(duration, update, ease) {
		ease = ease || $default_ease;

		ease.$cache = ease.$cache || {};
		var table = ease.$cache[duration];
		if (!table) {
			table = [];
			for (var i = 0; i < duration; i += FRAME_RATE) {
				table.push(ease(i / duration));
			}
			table.push(1);
			ease.$cache[duration] = table;
		}

		var defer = {};

		var promise = new Promise(function(resolve, reject) {
			defer.resolve = resolve;
			defer.reject = reject;

			defer.nextFrame = $rAF(function(timestamp) {
				render(timestamp, timestamp, table, update, defer);
			});
		});

		promise.cancel = function() {
			$rAF.cancel(defer.nextFrame);
			defer.reject();
			return promise;
		};

		return promise;
	}

	function animate(duration, from, to, update) {
		function $update(factor) {
			return update(from + (to - from) * factor, $update.params);
		}

		$update.params = {duration: duration};
		return easing(duration, $update);
	}

	return {
		cancel: function(animation) {
			if (animation && typeof animation.cancel === "function") {
				return animation.cancel();
			}
		},

		animate: animate
//			moveTo: moveTo,
//			fadeIn: fadeIn,
//			fadeOut: fadeOut
	};
})();


module.value("Animation", Animation);

