import {_} from "../fp";
import {$module} from "../compiler/module.js";


$module.factory("Animation", function(Observable) {

	const $rAF = window.requestAnimationFrame.bind(window);
	$rAF.cancel = window.cancelAnimationFrame.bind(window);

	const FRAME_RATE = 1000 / 60;

	function cubic_bezier(x1, y1, x2, y2, epsilon) {
		epsilon = epsilon || 1e-3;

		let curveX = function(t) {
			let v = 1 - t;
			return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
		};

		let curveY = function(t) {
			let v = 1 - t;
			return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
		};

		let derivativeCurveX = function(t) {
			let v = 1 - t;
			return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
		};

		return function(t) {

			let x = t, t0, t1, t2, x2, d2, i;

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

	const $default_ease = cubic_bezier(0.25, 0.5, 0.25, 1);

	function Animation(duration, from, to, ease) {
		ease = ease || $default_ease;
		ease.$cache = ease.$cache || {};

		let table = ease.$cache[duration];
		if (!table) {
			table = [];
			for (let i = 0; i < duration; i += FRAME_RATE) {
				table.push(ease(i / duration));
			}
			table.push(1);
			ease.$cache[duration] = table;
		}

		const animation = new Observable(observer => {

			function update(params) {
				let {timestamp, startTime} = params;
				let t = Math.floor((timestamp - startTime) / FRAME_RATE);

				// console.log(params);


				let step = table[t];
				step = step === undefined ? 1 : step;

				let value = from + (to - from) * step;
				observer.next(value);
				if (step === 1) {
					return observer.complete();
				}

				$rAF(function(timestamp) {
					params.timestamp = timestamp;
					update(params);
				})
			}

			$rAF(function(timestamp) {
				update({startTime: timestamp, timestamp, table});
			});

			return function() {

			}
		});


		return animation;
	}

	// window.Animation = Animation;
	return Animation;
});


$module.factory("Transform", function() {

	return {
		translate: function(el, x, y, z) {
			if (!el) return;
			x = x || 0;
			y = y || 0;
			z = z || 0;

			x = _.isNumber(x) ? x + "px" : x;
			y = _.isNumber(y) ? y + "px" : y;
			z = _.isNumber(z) ? z + "px" : z;

			el.style.webkitTransform = "translate3d(" + x + "," + y + "," + z + ")";
		},

		opacity: function(el, value) {
			el.style.opacity = value;
		}
	}
});


$module.factory("FLIP", function() {

	return function FLIP(el) {
		const first = el.getBoundingClientRect();

		const runTransition = (duration, count = 2) => (t) => {
			if (count === 0) return;

			const last = el.getBoundingClientRect();
			const invertX = (first.left - last.left);
			const invertY = (first.top - last.top);

			if (invertX === 0 && invertY === 0) {
				return requestAnimationFrame(runTransition(duration, count - 1));
			}

			el.style.transition = null;
			el.style.transform = `translate3d(${invertX}px, ${invertY}px, 0)`;

			Observable.fromEvent(el, ["transitionend", "webkitTransitionEnd"])
				.filter(event => event.target === el)
				.filter(event => event.propertyName === "transform")
				.take(1)
				.subscribe(event => {
					el.style.transition = null;
					el.style.transform = null;
				});

			requestAnimationFrame(() => {
				el.style.transition = `transform ${duration}ms`;
				el.style.transform = `translate3d(0, 0, 0)`;
			});
		};

		return {
			play: function(duration) {
				requestAnimationFrame(runTransition(duration));
			}
		}
	};

});