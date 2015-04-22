window.Tween = function() {

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = setTimeout;
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = clearTimeout;
	}

	var LEN = 20000;

	function noop(){}

	function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
		var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;

		function sampleCurveX(t) {return ((ax*t+bx)*t+cx)*t;};
		function sampleCurveY(t) {return ((ay*t+by)*t+cy)*t;};
		function sampleCurveDerivativeX(t) {return (3.0*ax*t+2.0*bx)*t+cx;};
		function solveEpsilon(duration) {return 1.0/(200.0*duration);};
		function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));};
		function solveCurveX(x,epsilon) {
			var t0,t1,t2,x2,d2,i;
			for (t2=x, i=0; i<8; i++) {
				x2=sampleCurveX(t2)-x;
				if(Math.abs(x2)<epsilon) {return t2;}
				d2=sampleCurveDerivativeX(t2);
				if(Math.abs(d2)<1e-6) {break;}
				t2=t2-x2/d2;
			}
			t0=0.0; t1=1.0; t2=x;

			if (t2<t0) {return t0;}
			if (t2>t1) {return t1;}
			while (t0<t1) {
				x2=sampleCurveX(t2);
				if(Math.abs(x2-x)<epsilon) {return t2;} if(x>x2) {t0=t2;}else {t1=t2;} t2=(t1-t0)*.5+t0;
			}
			return t2; // Failure.
		}
		cx=3.0*p1x; bx=3.0*(p2x-p1x)-cx; ax=1.0-cx-bx; cy=3.0*p1y; by=3.0*(p2y-p1y)-cy; ay=1.0-cy-by;

		return solve(t, solveEpsilon(duration));
	}

	function cubicBezierFactor(x1, y1, x2, y2) {
		var self = [];
		for (var i = 0; i < LEN; i++) {
			self[i] = cubicBezierAtTime(i/LEN, x1, y1, x2, y2, 1);
		}

		return self;
	}

	var ease = cubicBezierFactor(.25, 1, .25, 1);
	ease = cubicBezierFactor(0, .9, .42, 1);

	var timestamp = function() {
		if (window.performance && window.performance.now) {
			return function() {
				return window.performance.now();
			}
		}

		return function() {
			return +new Date();
		}
	}();

	function render(startTime, begin, by, duration, params) {
		if (params.stop) {
			delete queue[params.id];
			return;
		}

		var t = timestamp() - startTime;
		if (t >= duration) {
			params.func(begin + by);
			params.complete(begin + by);
			delete queue[params.id]
			return;
		}

		var easing = ease;
		var factor = easing[Math.floor(t/duration*LEN)];
		if (factor > 0.999) {
			factor = 1;
		}

		var result = params.func(begin + factor * by);
		if (result === false) {
			params.complete(begin + by);
			delete queue[params.id]
			return;
		}

		return requestAnimationFrame(function() {
			queue[params.id] = render(startTime, begin, by, duration, params);
		});
	}

	var queue = {};

	return {
		stop: function() {
			for (var id in queue) {
				if (queue.hasOwnProperty(id)) {
					cancelAnimationFrame(queue[params.id]);
				}
			}
		},

		to: function(from, to, duration, options) {
			var by = to - from;

			var params = {};
			params.id = options.id || +new Date;
			params.func = options.update || noop;
			params.complete = options.complete || noop;

			if (queue[params.id]) {
				cancelAnimationFrame(queue[params.id]);
			}
			queue[params.id] = render(timestamp(), from, by, duration, params);
		}
	}
}();
