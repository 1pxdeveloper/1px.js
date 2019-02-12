var $rAF = window.requestAnimationFrame;

Function.noop = function() {
};

Array.prototype.has = function(value) {
	return this.indexOf(value) >= 0;
};

Number.isNumber = function(number) {
	return +number === number;
};

if (typeof Object.assign != 'function') {
	(function() {
		Object.assign = function(target) {
			'use strict';
			if (target === undefined || target === null) {
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) {
						if (source.hasOwnProperty(nextKey)) {
							output[nextKey] = source[nextKey];
						}
					}
				}
			}
			return output;
		};
	})();
}

if (!Object.is) {
	Object.is = function(v1, v2) {
		if (v1 === 0 && v2 === 0) {
			return 1 / v1 === 1 / v2;
		}
		if (v1 !== v1) {
			return v2 !== v2;
		}
		return v1 === v2;
	};
}


function noop() {
}

function foreach(collection, fn, thisObj) {
	if (!collection) {
		return collection;
	}

	if (collection.length >= 0) {
		for (var i = 0; i < collection.length; i++) {
			fn.call(thisObj, collection[i], i);
		}
		return collection;
	}

	for (var prop in collection) {
		if (collection.hasOwnProperty(prop)) {
			fn.call(thisObj, collection[prop], prop);
		}
	}

	return collection;
}

function map(collection, fn) {
	var result = [];

	if (!collection) {
		return result;
	}

	if (collection.length >= 0) {
		for (var i = 0; i < collection.length; i++) {
			result.push(fn(collection[i], i));
		}
	}

	return result;
}
Array.map = map;

function $dashToCamelCase(str) {
	return str.replace(/-([a-z])/g, function(a, b) {
		return b.toUpperCase();
	});
}

function $removeNode(node) {
	var frag = document.createDocumentFragment();
	frag.appendChild(node);
	frag.removeChild(node);
}

function insertAfter(newChild, refChild) {
	var parentNode = refChild.parentNode;
	if (refChild.nextSibling) {
		return parentNode.insertBefore(newChild, refChild.nextSibling);
	}

	return parentNode.appendChild(newChild);
}

function $trim(str) {
	return str && str.replace($trim.re, "");
}
$trim.re = /^\s+|\s+$'/g;


function $interpolate(str, fn) {
	fn = fn || noop;

	var ret = "";
	var startIndex = 0;

	str.replace($interpolate.re, function(a, index) {
		ret += fn(str.substring(startIndex, index), false);
		ret += fn(a, true);
		startIndex = index + a.length;
		return a;
	});

	if (startIndex === 0) {
		return str;
	}

	ret += fn(str.substring(startIndex), false, true);
	return ret;
}
$interpolate.re = /\{\{\s?(?:[^}]|}[^}])*\s?}}/g;


function $traversal(node, data, fn) {
	fn = fn || noop;

	var stack = [];
	while (node) {
		node = fn(node, data) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
}


function $registerElement(name, prototype, tag) {
	var base = tag ? document.createElement(tag).__proto__ : HTMLElement.prototype;
	var HTMLElementPrototype = Object.create(base);

	for (var prop in prototype) {
		if (prototype.hasOwnProperty(prop)) {
			HTMLElementPrototype[prop] = prototype[prop];
		}
	}

	var options = {};
	options.prototype = HTMLElementPrototype;
	if (tag) {
		options.extends = tag;
	}

	return document.registerElement(name, options);
}


window.$nextFrame = function() {

	var callbacks = [];

	function enterFrame() {
		var _callbacks = callbacks.slice();
		callbacks = [];

		for (var i = 0, len = _callbacks.length; i < len; i++) {
			_callbacks[i].apply(window, arguments);
		}
	}

	return function(callback) {
		if (typeof callback !== "function") {
			throw TypeError("argument 0 is must be function.");
		}

		if (callbacks.length === 0) {
			$rAF(enterFrame);
		}

		callbacks.push(callback);
	}
}();

function $(el) {
	return [el];
}

function extend() {
	Object.assign.apply(Object, arguments);
}


Number.format = function(number) {
	if (!Number.isNumber(number)) {
		return;
	}

	var signed = number < 0 ? "-" : "";

	number = "" + Math.abs(number);
	var result = "";
	while (number.length > 3) {
		result = "," + number.slice(-3) + result;
		number = number.slice(0, -3);
	}

	result = number + result;
	return signed + result;
};


(function() {
	/* DATE FORMAT */
	/*
	 * Date Format 1.2.3
	 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
	 * MIT license
	 *
	 * Includes enhancements by Scott Trenda <scott.trenda.net>
	 * and Kris Kowal <cixar.com/~kris.kowal/>
	 *
	 * Accepts a date, a mask, or a date and a mask.
	 * Returns a formatted version of the given date.
	 * The date defaults to the current date/time.
	 * The mask defaults to dateFormat.masks.default.
	 */

	var dateFormat = function() {
		var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMisTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
			timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
			timezoneClip = /[^-+\dA-Z]/g,
			pad = function(val, len) {
				val = String(val);
				len = len || 2;
				while (val.length < len) val = "0" + val;
				return val;
			};

		// Regexes and supporting functions are cached through closure
		return function(date, mask, utc) {
			var dF = dateFormat;

			// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
			if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
				mask = date;
				date = undefined;
			}

			// Passing date through Date applies Date.expression, if necessary
			date = date ? new Date(date) : new Date;
			if (isNaN(date)) return "";

			mask = String(dF.masks[mask] || mask || dF.masks["default"]);

			// Allow setting the utc argument via the mask
			if (mask.slice(0, 4) == "UTC:") {
				mask = mask.slice(4);
				utc = true;
			}

			var _ = utc ? "getUTC" : "get",
				d = date[_ + "Date"](),
				D = date[_ + "Day"](),
				m = date[_ + "Month"](),
				y = date[_ + "FullYear"](),
				H = date[_ + "Hours"](),
				M = date[_ + "Minutes"](),
				s = date[_ + "Seconds"](),
				L = date[_ + "Milliseconds"](),
				o = utc ? 0 : date.getTimezoneOffset(),

				flags = {
					d: d,
					dd: pad(d),
					ddd: dF.i18n.dayNames[D],
					dddd: dF.i18n.dayNames[D + 7],
					m: m + 1,
					mm: pad(m + 1),
					mmm: dF.i18n.monthNames[m],
					mmmm: dF.i18n.monthNames[m + 12],
					yy: String(y).slice(2),
					yyyy: y,
					h: H % 12 || 12,
					hh: pad(H % 12 || 12),
					H: H,
					HH: pad(H),
					M: M,
					MM: pad(M),
					i: M,
					ii: pad(M),
					s: s,
					ss: pad(s),
					l: pad(L, 3),
					L: pad(L > 99 ? Math.round(L / 10) : L),
					t: H < 12 ? "a" : "p",
					tt: H < 12 ? "am" : "pm",
					T: H < 12 ? "A" : "P",
					TT: H < 12 ? "AM" : "PM",
					Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
					o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
					S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
				};

			return mask.replace(token, function($0) {
				return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
			});
		};
	}();


	// Some common format strings
	dateFormat.masks = {
		"default": "yyyy-mm-dd HH:ii:ss",
		shortDate: "m/d/yy",
		mediumDate: "mmm d, yyyy",
		longDate: "mmmm d, yyyy",
		fullDate: "dddd, mmmm d, yyyy",
		shortTime: "h:MM TT",
		mediumTime: "h:MM:ss TT",
		longTime: "h:MM:ss TT Z",
		isoDate: "yyyy-mm-dd",
		isoTime: "HH:MM:ss",
		isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
		isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
	};

	// Internationalization strings
	dateFormat.i18n = {
		dayNames: [
			"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
			"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
		],

		monthNames: [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
			"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
		]
	};

	// For convenience...
	Date.prototype.format = function(mask, utc) {
		return dateFormat(this, mask, utc);
	};

	Date.format = function(mask, date, utc) {
		if (!date) return "";
		return dateFormat(new Date(date), mask, utc);
	};

	Date.curDate = function() {
		return new Date(dateFormat(new Date(), "yyyy-mm-dd"));
	};

	Date.format.i18n = dateFormat.i18n;

})();

Date.today = function() {
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);
	return today;
};

Date.toDate = function(date) {
	date = new Date(date);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
};

Date.diff = function(a, b, type) {

	var duration_ms = new Date(b) - new Date(a);

	if (type === "day") {
		return Math.floor(duration_ms / 1000 / 60 / 60 / 24);
	}

	return duration_ms;
};

Promise.prototype.finally = function(fn) {
	return this.then(fn, fn);
};