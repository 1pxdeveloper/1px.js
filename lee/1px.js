Object.getPrototypeOf || (Object.getPrototypeOf = function(b) {
	if (b !== Object(b))throw TypeError("Object.getPrototypeOf called on non-object");
	return b.__proto__ || b.constructor.prototype || Object.prototype
});
"function" !== typeof Object.getOwnPropertyNames && (Object.getOwnPropertyNames = function(b) {
	if (b !== Object(b))throw TypeError("Object.getOwnPropertyNames called on non-object");
	var d = [], a;
	for (a in b) {
		Object.prototype.hasOwnProperty.call(b, a) && d.push(a);
	}
	return d
});
"function" !== typeof Object.create && (Object.create = function(b, d) {
	function a() {}

	if ("object" !== typeof b)throw TypeError();
	a.prototype = b;
	var c = new a;
	b && (c.constructor = a);
	if (void 0 !== d) {
		if (d !== Object(d))throw TypeError();
		Object.defineProperties(c, d)
	}
	return c
});
(function() {
	var b;
	if (!(b = !Object.defineProperty)) {
		var d;
		try {Object.defineProperty({}, "x", {}), d = !0}
		catch(a) {d = !1}
		b = !d
	}
	if (b) {
		var c = Object.defineProperty;
		Object.defineProperty = function(a, b, d) {
			if (c)try {return c(a, b, d)}
			catch(h) {}
			if (a !== Object(a))throw TypeError("Object.defineProperty called on non-object");
			Object.prototype.__defineGetter__ && "get"in d && Object.prototype.__defineGetter__.call(a, b, d.get);
			Object.prototype.__defineSetter__ && "set"in d && Object.prototype.__defineSetter__.call(a, b, d.set);
			"value"in
			d && (a[b] = d.value);
			return a
		}
	}
})();
"function" !== typeof Object.defineProperties && (Object.defineProperties = function(b, d) {
	if (b !== Object(b))throw TypeError("Object.defineProperties called on non-object");
	for (var a in d) {
		Object.prototype.hasOwnProperty.call(d, a) && Object.defineProperty(b, a, d[a]);
	}
	return b
});
Object.keys || (Object.keys = function(b) {
	if (b !== Object(b))throw TypeError("Object.keys called on non-object");
	var d = [], a;
	for (a in b) {
		Object.prototype.hasOwnProperty.call(b, a) && d.push(a);
	}
	return d
});
Function.prototype.bind || (Function.prototype.bind = function(b) {
	function d() {}

	if ("function" !== typeof this)throw TypeError("Bind must be called on a function");
	var a = [].slice, c = a.call(arguments, 1), e = this, f = function() {return e.apply(this instanceof d ? this : b, c.concat(a.call(arguments)))};
	d.prototype = e.prototype;
	f.prototype = new d;
	return f
});
Array.isArray = Array.isArray || function(b) {return Boolean(b && "[object Array]" === Object.prototype.toString.call(Object(b)))};
Array.prototype.indexOf || (Array.prototype.indexOf = function(b) {
	if (void 0 === this || null === this)throw TypeError();
	var d = Object(this), a = d.length >>> 0;
	if (0 === a)return -1;
	var c = 0;
	0 < arguments.length && (c = Number(arguments[1]), isNaN(c) ? c = 0 : 0 !== c && c !== 1 / 0 && c !== -(1 / 0) && (c = (0 < c || -1) * Math.floor(Math.abs(c))));
	if (c >= a)return -1;
	for (c = 0 <= c ? c : Math.max(a - Math.abs(c), 0); c < a; c++) {
		if (c in d && d[c] === b)return c;
	}
	return -1
});
Array.prototype.lastIndexOf || (Array.prototype.lastIndexOf = function(b) {
	if (void 0 === this || null === this)throw TypeError();
	var d = Object(this), a = d.length >>> 0;
	if (0 === a)return -1;
	var c = a;
	1 < arguments.length && (c = Number(arguments[1]), c !== c ? c = 0 : 0 !== c && c !== 1 / 0 && c !== -(1 / 0) && (c = (0 < c || -1) * Math.floor(Math.abs(c))));
	for (a = 0 <= c ? Math.min(c, a - 1) : a - Math.abs(c); 0 <= a; a--) {
		if (a in d && d[a] === b)return a;
	}
	return -1
});
Array.prototype.every || (Array.prototype.every = function(b, d) {
	if (void 0 === this || null === this)throw TypeError();
	var a = Object(this), c = a.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	var e;
	for (e = 0; e < c; e++) {
		if (e in a && !b.call(d, a[e], e, a))return !1;
	}
	return !0
});
Array.prototype.some || (Array.prototype.some = function(b, d) {
	if (void 0 === this || null === this)throw TypeError();
	var a = Object(this), c = a.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	var e;
	for (e = 0; e < c; e++) {
		if (e in a && b.call(d, a[e], e, a))return !0;
	}
	return !1
});
Array.prototype.forEach || (Array.prototype.forEach = function(b, d) {
	if (void 0 === this || null === this)throw TypeError();
	var a = Object(this), c = a.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	var e;
	for (e = 0; e < c; e++) {
		e in a && b.call(d, a[e], e, a)
	}
});
Array.prototype.map || (Array.prototype.map = function(b, d) {
	if (void 0 === this || null === this)throw TypeError();
	var a = Object(this), c = a.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	var e = [];
	e.length = c;
	var f;
	for (f = 0; f < c; f++) {
		f in a && (e[f] = b.call(d, a[f], f, a));
	}
	return e
});
Array.prototype.filter || (Array.prototype.filter = function(b, d) {
	if (void 0 === this || null === this)throw TypeError();
	var a = Object(this), c = a.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	var e = [], f;
	for (f = 0; f < c; f++) {
		if (f in a) {
			var g = a[f];
			b.call(d, g, f, a) && e.push(g)
		}
	}
	return e
});
Array.prototype.reduce || (Array.prototype.reduce = function(b) {
	if (void 0 === this || null === this)throw TypeError();
	var d = Object(this), a = d.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	if (0 === a && 1 === arguments.length)throw TypeError();
	var c = 0, e;
	if (2 <= arguments.length)e = arguments[1];
	else {
		do {
			if (c in d) {
				e = d[c++];
				break
			}
			if (++c >= a)throw TypeError();
		} while(1)
	}
	for (; c < a;) {
		c in d && (e = b.call(void 0, e, d[c], c, d)), c++;
	}
	return e
});
Array.prototype.reduceRight || (Array.prototype.reduceRight = function(b) {
	if (void 0 === this || null === this)throw TypeError();
	var d = Object(this), a = d.length >>> 0;
	if ("function" !== typeof b)throw TypeError();
	if (0 === a && 1 === arguments.length)throw TypeError();
	var a = a - 1, c;
	if (2 <= arguments.length)c = arguments[1];
	else {
		do {
			if (a in this) {
				c = this[a--];
				break
			}
			if (0 > --a)throw TypeError();
		} while(1)
	}
	for (; 0 <= a;) {
		a in d && (c = b.call(void 0, c, d[a], a, d)), a--;
	}
	return c
});
String.prototype.trim || (String.prototype.trim = function() {return String(this).replace(/^\s+/, "").replace(/\s+$/, "")});
Date.now || (Date.now = function() {return Number(new Date)});
Date.prototype.toISOString || (Date.prototype.toISOString = function() {
	function b(b) {return ("00" + b).slice(-2)}

	return this.getUTCFullYear() + "-" + b(this.getUTCMonth() + 1) + "-" + b(this.getUTCDate()) + "T" + b(this.getUTCHours()) + ":" + b(this.getUTCMinutes()) + ":" + b(this.getUTCSeconds()) + "." + function(b) {return ("000" + b).slice(-3)}(this.getUTCMilliseconds()) + "Z"
});


(function(window, document, undefined) {

/// 
	var ELEMENT_NODE = 1,
		ATTR_NODE = 2,
		TEXT_NODE = 3;

	var msie = +(/msie (\d+)/i.exec(navigator.userAgent) || [])[1],
		_cache = {};

	var regexp_string = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
		regexp_brace = /[{}]/g,
		regexp_trim = /^\s+|\s+$/g,
		regexp_nonwhitespace = /\S+/g,
		regexp_whitespace = /\s+/g,
		regexp_args = /\([^)]*\)/m,
		regexp_comma = /\s*,\s*/;

	var $now = Date.now = Date.now || function() { return new Date().getTime(); }


/// --- Core
	function noop() {}

	function $cache(name) {
		return (_cache[name] = _cache[name] || {});
	}

	function define(name, fn) {
		$cache("sources")[name] = fn;
	}

	function require(name) {
		var modules = $cache("modules"),
			sources = $cache("sources");

		return modules[name] || (modules[name] = sources[name] && sources[name]());
	}


/// Collection
	function foreach(obj, fn) {
		if (typeof obj !== "object" || obj === null) return obj;
		if (typeof obj.length === "number") {
			for (var i = 0, len = obj.length; i < len; i++) {
				fn(obj[i], i);
			}
			return obj;
		}

		for (var key in obj) {
			obj.hasOwnProperty(key) && fn(obj[key], key);
		}

		return obj;
	}

	function search(obj, fn) {
		if (typeof obj !== "object" || obj === null) return obj;
		if (typeof obj.length === "number") {
			for (var i = 0, len = obj.length; i < len; i++) {
				if (fn(obj[i], i) === true) return obj[i];
			}
			return;
		}

		for (var key in obj) {
			if (obj.hasOwnProperty(key) && fn(obj[key], key) === true) {
				return obj[key];
			}
		}
	}


/// Object
	function extend(obj) {
		if (obj === null || typeof obj !== "object") return obj;

		for (var i = 1, len = arguments.length; i < len; i++) {
			foreach(arguments[i], function(value, key) {
				obj[key] = value;
			});
		}

		return obj;
	}


/// Array
	function makeArray(arr) {
		if (arr === undefined || arr === null || typeof arr.length !== "number") return [];
		var i = arr.length, r = Array(i);
		while(i-- !== 0) {
			r[i] = arr[i];
		}
		return r;
	}

	function indexOf(arr, search, fromIndex) {
		if (arr === undefined || arr === null) return -1;

		fromIndex = +fromIndex || 0;
		for (var len = arr.length; fromIndex < len; fromIndex++) {
			if (arr[fromIndex] === search) return fromIndex;
		}
		return -1;
	}


/// String
	function trim(str) {
		return str.replace(regexp_trim, "");
	}


/// ELEMENT
	function isRadioButton(el) {
		return el && el.tagName === "INPUT" && el.type === "radio";
	}

	function isCheckbox(el) {
		return el && el.tagName === "INPUT" && el.type === "checkbox";
	}

	function isArrayCheckbox(el) {
		return isCheckbox(el) && el.name.slice(-2) === "[]";
	}

	function isBooleanAttr(a) {
		a = a.toLowerCase();

		if (a === "selected") return true;
		if (a === "checked") return true;
		if (a === "disabled") return true;
//	if (a === "autoplay") return true;
//	if (a === "async") return true;
//	if (a === "autofocus") return true;
		if (a === "contenteditable") return true;
//	if (a === "controls") return true;
//	if (a === "default") return true;
//	if (a === "defer") return true;
//	if (a === "formnovalidate") return true;
//	if (a === "hidden") return true;
//	if (a === "ismap") return true;
//	if (a === "itemscope") return true;
//	if (a === "loop") return true;
//	if (a === "multiple") return true;
//	if (a === "novalidate") return true;
		if (a === "open") return true;
//	if (a === "pubdate") return true;
		if (a === "readonly") return true;
//	if (a === "required") return true;
//	if (a === "reversed") return true;
//	if (a === "scoped") return true;
//	if (a === "seamless") return true;

		return false;
	}

	function attributesOf(el) {
		return makeArray(el.attributes);
	}

	function hasAttribute(el, attr) {
		return el && el.hasAttribute && el.hasAttribute(attr);
	}

	function styleOf(el) {
		return document.defaultView.getComputedStyle(el) || el.currentStyle || el.style || {};
	}

	function show(el) {
		if (el && !el.style) {
			var css = el.getAttribute("style") || "";
			el.setAttribute("style", css + ";" + "display:block");
			return;
		}

		el.style.display = "";
		if (styleOf(el)["display"] === "none") {
			var a = "block";
			el.style.cssText += (";" + "display:" + a);
		}
	}

	function hide(el) {
		if (el && !el.style) {
			var css = el.getAttribute("style") || "";
			el.setAttribute("style", css + ";display:none !important;");
			return;
		}

		el.style.cssText += ";display:none !important;";
	}


	function makeClassName(className, removeClass) {
		var result = {};
		var classNames = [];

		className = className || "";
		className.replace(regexp_nonwhitespace, function(a) {
			result[a] = true;
			return a;
		});

		removeClass && removeClass.replace(regexp_nonwhitespace, function(a) {
			delete result[a];
			return a;
		});

		for (var name in result) {
			classNames.push(name);
		}

		return classNames.join(" ");
	}

	function addClass(el, className) {
		el.className = makeClassName(el.className + " " + className);
	}

	function removeClass(el, className) {
		el.className = makeClassName(el.className, className);
	}

	function hasClass(el, className) {
		return (" " + el.className + " ").indexOf(" " + className + " ") !== -1;
	}

	function traversal(el, fn, fn2, data) {

		if (fn(el, data) === false) {
			return;
		}

		fn2 = fn2 || noop;

		var stack = [],
			next = el.childNodes && el.childNodes[0],
			result,
			nextSibling;

		while(next) {
			nextSibling = next.nextSibling;
			result = fn(next, data);
			if (result === -1) return;

			nextSibling = next.nextSibling || nextSibling;
			nextSibling && stack.push(nextSibling);
			stack.push(next, true);

			if (next.tagName === "IFRAME" && hasAttribute(next, "template") && next.contentWindow) {
				next = next.contentWindow.document;
			}

			next = next.childNodes && next.childNodes[0];
			if (!next || result === false) {
				next = stack.pop();

				while(next === true) {
					next = stack.pop();
					fn2(next, data);
					next = stack.pop();
				}
			}
		}
	}


/// Data
	var $key = $now();
//var $uuid = 1;
//function createData(el) {
//	if (el === undefined || el === null) return {};
//	var cache = $cache("data"),
//		id = el[$key] = el[$key] || $uuid++;
//	return (cache[id] = cache[id] || {});
//}
//
//function readData(el) {
//	if (el === undefined || el === null) return;
//	var cache = $cache("data");
//	return cache[el[$key]];
//}
//
//function removeData(el) {
//	if (el === undefined || el === null) return;
//	var cache = $cache("data");
//	delete cache[el[$key]];
//}


	var _WeakMap = window.WeakMap;
	var wmap;

	function createData(el) {
		if (el === undefined || el === null) return {};
		wmap = wmap || new _WeakMap();
		var result = wmap.get(el) || {};
		wmap.set(el, result);
		return result;
	}

	function readData(el) {
		if (el === undefined || el === null) return;
		wmap = wmap || new _WeakMap();
		return wmap.get(el);
	}

	function removeData(el) {
		if (el === undefined || el === null) return;
		wmap = wmap || new _WeakMap();
		wmap["delete"](el)
	}


/// EVENT
	function addEvent(el, type, fn, flag) {
		el.addEventListener(type, fn, flag || false);
	}

	function removeEvent(el, type, fn, flag) {
		el.removeEventListener(type, fn, flag || false);
	}

	function dispatchEvent(el, type, props, bubbles, cancelable) {
		bubbles = bubbles === undefined ? true : bubbles;
		cancelable = cancelable === undefined ? true : cancelable;

		var event = document.createEvent("Event");
		event.initEvent(type, bubbles, cancelable);

		if (props) {
			var ignore = dispatchEvent.ignore = dispatchEvent.ignore || Object.getOwnPropertyNames(event);
			for (var key in props) {
				if (props.hasOwnProperty(key) === false) continue;
				if (indexOf(ignore, key) === -1) event[key] = props[key];
			}
		}

		return el.dispatchEvent(event);
	}

	function bind(el) {
		var fn = arguments[arguments.length - 1];
		for (var i = 1, len = arguments.length - 1; i < len; i++) {
			addEvent(el, arguments[i], fn);
		}
	}

	function unbind(el) {
		var fn = arguments[arguments.length - 1];
		for (var i = 1, len = arguments.length - 1; i < len; i++) {
			removeEvent(el, arguments[i], fn);
		}
	}

	function querySelectorAll(el, selector) {
		return el.querySelectorAll(selector);
	}

	function matchesSelector(el, selector) {
		if (el.nodeType !== ELEMENT_NODE) return false;
		var matches = el.matchesSelector || el.webkitMatchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.oMatchesSelector;
		return matches.call(el, selector);
	}

	function closest(el, selector) {
		while(el && !matchesSelector(el, selector)) {
			el = el.parentNode;
		}
		return el;
	}

	function extractTemplate(el) {
		var frag = el.content;
		if (!frag) {
			frag = document.createDocumentFragment();
			while(el.firstChild) {
				frag.appendChild(el.firstChild);
			}
		}
		return frag;
	}

	function removeNode(node) {
		return node.parentNode && node.parentNode.removeChild(node);
	}

	function contentLoaded(win, fn) {

		var done = false, top = true,

			doc = win.document,
			root = doc.documentElement,
			modern = doc.addEventListener,

			add = modern ? 'addEventListener' : 'attachEvent',
			rem = modern ? 'removeEventListener' : 'detachEvent',
			pre = modern ? '' : 'on',

			init = function(e) {
				if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
				(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
				if (!done && (done = true)) fn.call(win, e.type || e);
			},

			poll = function() {
				try { root.doScroll('left'); }
				catch(e) {
					setTimeout(poll, 50);
					return;
				}
				init('poll');
			};

		if (doc.readyState == 'complete') fn.call(win, 'lazy');
		else {
			if (!modern && root.doScroll) {
				try { top = !win.frameElement; }
				catch(e) { }
				if (top) poll();
			}
			doc[add](pre + 'DOMContentLoaded', init, false);
			doc[add](pre + 'readystatechange', init, false);
			win[add](pre + 'load', init, false);
		}

	}


/// jpx CORE
	function $eval(script, scope) {
		if (!scope || !scope.length) {
			return;
		}

		var cache = $cache("eval"),
			thisObj = scope[scope.length - 1],
			length = scope.length,
			hash = length + script,
			code = "",
			fn;

		try {
			if (cache[hash] === undefined) {
				for (var i = 0, len = length + 1; i < len; i++) {
					code += ("with(arguments[" + i + "])");
				}
				code += ("{return(" + script + ");}");
				cache[hash] = new Function(code);
			}

			fn = cache[hash] || noop;
			return fn.apply(thisObj, scope.concat(scope.local || {}));

		}
		catch(e) {
//		console.log(script, e.stack, e, e.message);
//		console.trace();
		}

		return "";
	}


	function $parse(script, scope) {
		script = "" + script;
		if (script.indexOf("{") === -1) return script;

		var cache = $cache("parse"),
			snippet = cache[script] = cache[script] || $parse_expr(script),
			ret = "";

		for (var i = 0; i < snippet.length; i++) {
			var text = snippet[i];
			if (i % 2 === 1) {
				text = $eval(text.slice(1, -1), scope);
				if (text === null || text === undefined) {
					text = "";
				}
			}
			ret += text;
		}

		return ret;
	}


	function $parse_expr(script) {

		var result = [],
			index,
			removed_string,
			num_brace,
			match;

		while(script) {

			// find brace {
			index = script.indexOf("{");
			if (index === -1) {
				result.push(script);
				break;
			}
			result.push(script.substring(0, index));
			script = script.substring(index);


			// match brace {}
			num_brace = 0;
			regexp_brace.lastIndex = 0;
			removed_string = script.replace(regexp_string, function(a) { return Math.pow(10, a.length - 1); });

			while(match = regexp_brace.exec(removed_string)) {
				num_brace += (match[0] === "{" ? 1 : -1);
				if (num_brace === 0) {
					result.push(script.substring(0, match.index + 1));
					script = script.substring(match.index + 1);
					break;
				}
			}

			if (num_brace !== 0) {
				result.push((result.pop() || "") + script);
				break;
			}
		}

		return result;
	}


	function $compile(el, scope) {
		scope && (createData(el).scope = [scope]);
		traversal(el, $compile_process);
	}

	function $compile_process(el) {
		var nodeType = el.nodeType;

		if (nodeType === ELEMENT_NODE) {
			return $compile_process_element(el);
		}

		if (nodeType === TEXT_NODE) {
			return $compile_process_textnode(el);
		}
	}

	function $attr_priority(a) {
		if (a === "repeat") return 70;
		if (a === "controller") return 60;
		if (a === "ready") return 50;
		if (a === "init") return 30;
		if (a === "var") return 20;
		if (a === "css") return -10;
		if (a === "background-image") return -15;
		if (a === "visible") return -20;
		if (a === "hidden") return -20;
		if (a === "template") return -30;
		if (a === "with") return -40;
		if (a === "name") return -50;

		return 0;
	}

	function $by_attr_priority(a, b) {
		return $attr_priority(b.nodeName) - $attr_priority(a.nodeName);
	}

	function $compile_process_element(el) {
		var nodeName = el.nodeName;
		if (msie <= 8) {
			nodeName = nodeName.toUpperCase();
		}

		if (nodeName === "SCRIPT" || nodeName === "HEAD" || nodeName === "STYLE" || nodeName === "NOSCRIPT") {
			return false;
		}

		if (nodeName === "TEMPLATE" && !$cache("template")[el.id]) {
			var frag = el.content;
			if (!frag) {
				frag = document.createDocumentFragment();
				while(el.childNodes[0]) {
					frag.appendChild(el.childNodes[0]);
				}
			}
			el.parentNode.removeChild(el);

			$cache("template")[el.id] = frag;
			return false;
		}

		if (hasAttribute(el, "sandbox")) {
			return false;
		}


		var attributes = attributesOf(el);
		if (attributes.length === 0) {
			return;
		}
		attributes.sort($by_attr_priority);


		foreach(attributes, function(attr, index) {
			var nodeName = attr.nodeName;
			var script = attr.value;

			// Handler - Custom
			var handler = require("@" + nodeName);
			if (handler) {
				return $createBinding(el, attr, handler);
			}

			// Handler - Boolean Attribute
			if (script && isBooleanAttr(nodeName) === true) {
				return $createBinding(el, attr, require("~boolean"));
			}

			// Handler - Event
			if (("on" + nodeName) in document || ("on" + nodeName) in el || nodeName.substring(0, 3) === "on-") {
				return $createBinding(el, attr, require("~event"));
			}

			// Handler - NodeValue
			if (script.indexOf("{") !== -1) {
				return $createBinding(el, attr, require("~nodeValue"));
			}
		});
	}

	function $compile_process_textnode(el) {
		var nodeValue = el.nodeValue;
		var snippets = $parse_expr(nodeValue);
		if (snippets.length <= 1) {
			return;
		}

		var frag = document.createDocumentFragment();
		foreach(snippets, function(text, index) {
			if (text.length === 0) return;
			var textNode = document.createTextNode(text);
			frag.appendChild(textNode);

			if (index % 2 === 1) {
				$createBinding(el.parentNode, textNode, require("~nodeValue"));
			}
		});

		el.parentNode.replaceChild(frag, el);
	}


/// @FIXME: 이거 이름좀 확실하게 바꾸자...
	function $createBinding(el, node, handler) {
		var data = createData(el);
		var bindings = (data.bindings = data.bindings || []);

		if (node.nodeType === ATTR_NODE && bindings[node.nodeName]) {
			return;
		}

		var binding = {
			node: node,
			script: node.nodeType === ATTR_NODE ? node.value : node.nodeValue,
			handler: handler
		};

		bindings.push(binding);
		bindings[node.nodeName] = true;

		handler.init && handler.init(binding, el, node, binding.script);
		handler.value = handler.value || "parse";
		if (typeof handler.value === "string") {
			handler.value = $createBinding[handler.value];
		}
	}

	function $value_type_parse(self, el, attr, script) {
		return $parse(script, self.scope);
	}

	function $value_type_ident(self, el, attr, script) {
		return script;
	}

	function $value_type_expr(self, el, attr, script) {
		return $eval(script, self.scope);
	}

	function $value_type_expr_nocache(self, el, attr, script) {
		delete self.value;
		return $eval(script, self.scope);
	}

	function $value_type_boolean(self, el, attr, script) {
		return !!$eval(script, self.scope);
	}

	$createBinding["parse"] = $value_type_parse;
	$createBinding["ident"] = $value_type_ident;
	$createBinding["expr"] = $value_type_expr;
	$createBinding["expr-nocache"] = $value_type_expr_nocache;
	$createBinding["boolean"] = $value_type_boolean;


/// update
	function $update(el, _scope) {
		if ($update.isDone === false) {
			$update.hasQueue = true;
			return;
		}

		var data = readData(el) || {};
		var $scope = [_scope];
		$scope.local = {};

		$update.isDone = false;
		traversal(el, $update_process, $update_done, $scope);
		$update.isDone = true;

		if ($update.hasQueue === true) {
			delete $update.hasQueue;
			$update(el);
		}
	}

	function $update_process(el, $scope) {
		if (hasAttribute(el, "noupdate")) {
			return false;
		}

		var data = readData(el);
		if (data === undefined || data.bindings === undefined) {
			return;
		}

		var bindings = makeArray(data.bindings);

		foreach(bindings, function(binding, index) {

			var scope = makeArray($scope);
			scope.local = extend({}, $scope.local);
			scope.local.$root = $scope[0];
			scope.local.el = el;

			binding.$scope = $scope;
			binding.scope = scope;
			binding.thisObj = scope[scope.length - 1];

			var handler = binding.handler;
			if (!handler.update) {
				return;
			}

			var node = binding.node;
			var script = binding.script;
			var value = handler.value(binding, el, node, script);
			if (!binding.hasOwnProperty("value") || binding.value !== value) {
				binding.value = value;

				if (handler.update(binding, el, node, value) === false) {
					data.bindings.splice(indexOf(data.bindings, binding), 1);
				}
			}
		});
	}

	function $update_done(el, $scope) {
		if (hasAttribute(el, "noupdate")) {
			return false;
		}

		var data = readData(el);
		if (data === undefined || data.bindings === undefined) {
			return;
		}

		var i = data.bindings.length;
		while(i-- !== 0) {
			var binding = data.bindings[i];
			var handler = binding.handler;
			if (!handler.done) {
				continue;
			}

			var scope = makeArray($scope);
			scope.local = $scope.local || {};
			scope.local.$root = $scope[0];
			scope.local.el = el;

			binding.$scope = $scope;
			binding.scope = scope;
			binding.thisObj = scope[scope.length - 1];

			if (handler.done(binding, el, binding.node, binding.value) === false) {
				data.bindings.splice(indexOf(data.bindings, binding), 1);
			}
		}
	}


/// Directive
	function __nodeValue() {
		return {
			update: function(self, el, node, value) {
				if (node.nodeType === ATTR_NODE) {
					node.value = value;
					return;
				}
				node.nodeValue = value;
			}
		}
	}


	function __boolean() {
		return {
			value: function(self, el, node, script) {
				var result = !!$eval(script, self.scope);
				if (hasClass(el, node.nodeName) !== result) {
					delete self.value;
				}
				return result;
			},

			update: function(self, el, node, value) {
				value ? el.setAttribute(node.nodeName, "") : el.removeAttribute(node.nodeName);
				value ? addClass(el, node.nodeName) : removeClass(el, node.nodeName);
			}
		}
	}


	function __event() {
		return {
			init: function(self, el, node, script) {
				var name = node.nodeName;
				var type = name.substring(0, 3) === "on-" ? name.substring(3) : name;

				addEvent(el, type, function(e) {

					if (closest(el, ".disabled, *[disabled]")) {
						e.preventDefault();
						e.stopPropagation();
						return false;
					}

					if (type === "submit" && !el.getAttribute("action")) {
						e.preventDefault();
						e.stopPropagation();
					}

					if (type === "click") {
						e.stopPropagation();
					}

					window.$event = e;
					var result = $eval(script, self.scope);
//			window.$event = undefined; // @FIXME: dummy event

					if (result === false) {
						return false;
					}

					document.update();
				});

				/// ENTER for Submit
				if (type === "submit") {
					addEvent(el, "keydown", function(e) {
						if (e.keyCode === 13) {
							e.preventDefault();
							e.stopPropagation();

							setTimeout(function() {
								dispatchEvent(el, "submit", false, false);
							}, 0);
						}
					});
				}
			}
		}
	}


	function __init() {
		return {
			value: "expr",

			update: function(self) {
				return false;
			}
		}
	}


	function __ready() {
		return {
			value: "ident",

			update: function(self, el, node, value) {
				/// DO NOTHING
			},

			done: function(self, el, node, value) {
				$eval(value, self.scope);
				return false;
			}
		}
	}


	function __repeat() {

		var repeatHandler = {
			init: function(self, el, node, script) {
				/// parse Script "{expr} as {none}, {none}";
				var rows, row, index, lastIndex;
				rows = script;
				lastIndex = rows.lastIndexOf(" as ");

				if (lastIndex !== -1) {
					rows = script.substring(0, lastIndex);
					row = script.substring(lastIndex + 4);
					lastIndex = row.lastIndexOf(",");

					if (lastIndex !== -1) {
						index = trim(row.substring(lastIndex + 1));
						row = trim(row.substring(0, lastIndex));
					}
				}

				self.rows = rows;
				self.row = row;
				self.index = index;

				self.pool = [];
				self.container = [];

				self.placeholder = el.nextSibling;
				self.repeatNode = el.nextSibling.nextSibling;
				self.repeatNode.setAttribute("repeat", "#");
				self.repeatNode.parentNode.removeChild(self.repeatNode);
				self.repeatNode = self.repeatNode.cloneNode(true);
			},

			value: function(self, el, attr, script) {
				var collection = $eval(self.rows, self.scope);
				if (collection === null || typeof collection !== "object" || typeof collection.length !== "number") {
					collection = [];
				}

				self.collection = collection;
				return collection.length;
			},

			update: function(self, el, attr, value) {
				if (self.container.length === self.collection.length) {
					return;
				}

				if (self.container.length > self.collection.length) {
					for (var i = self.collection.length, len = self.container.length; i < len; i++) {
						var node = self.container[i];
						node.parentNode.removeChild(node);
						self.pool.push(node);
					}

					self.container.length = self.collection.length;
					return;
				}

				var frag = document.createDocumentFragment();
				for (var i = self.container.length, len = self.collection.length; i < len; i++) {
					var repeatNode = self.container[i] = self.pool.pop() || self.repeatNode.cloneNode(true);
					var data = createData(repeatNode);
					if (!data.source) {
						$compile(repeatNode);
					}
					data.index = i;
					data.source = self;
					frag.appendChild(repeatNode);
				}
				el.parentNode.insertBefore(frag, self.placeholder);
			}
		};

		return {
			init: function(self, el, node, script) {
				if (script === "#") {
					el.removeAttribute("repeat");
					return;
				}

				var textNode = document.createTextNode("");
				el.parentNode.insertBefore(textNode, el);
				el.parentNode.insertBefore(document.createTextNode(""), el);
				$createBinding(textNode, node, repeatHandler);

				return false;
			},

			value: function(self, el, attr, script) {
				delete self.value;
				return readData(el);
			},

			update: function(self, el, attr, value) {
				var source = value.source;
				var row = source.row;
				var index = source.index;

				self.old_local = self.$scope.local;
				self.$scope.local = extend({}, self.$scope.local);
				if (row) self.$scope.local[row] = source.collection[value.index];
				if (index) self.$scope.local[index] = value.index;
			},

			done: function(self, el, attr, value) {
				self.$scope.local = self.old_local;
			}
		}
	}


	function __name() {

		function getFormValueArray(el, thisObj) {
			var result = [];

			var name = el.name;
			var form = closest(el, "form");
			var elements = form ? form.elements[name] : document.getElementsByName(name);
			elements = elements.length ? elements : [elements];

			foreach(elements, function(el, index) {
//		var data = readData(el);
//		if (!data || !data.bindgins) {
//			return;
//		}		
//		var scope = data.bindgins[data.bindgins.length-1].scope;

				var type = el.type;
				if (type === "radio" || type === "checkbox") {
					el.checked && result.push(el.value);
					return;
				}

				result.push(el.value);
			});

			return result;
		}


		var _dispatcher;

		return {
			init: function(self, el, attr, script) {
				self.initValue = el.value;

				bind(el, "input", "change", function(e) {
					var thisObj = self.thisObj;
					var name = self.isArray ? el.name.slice(0, -2) : el.name;
					var value = el.value;

					if (isRadioButton(el) && !el.checked) {
						return;
					}

					if (isCheckbox(el)) {
						value = self.isArray ? getFormValueArray(el) : !!el.checked;
						if (thisObj[name] === value) {
							return;
						}
					}

					self.value = thisObj[name] = value;
					_dispatcher = el;
					document.update();
					_dispatcher = null;
				});

				if (msie <= 8) {
					bind(el, "keydown", "cut", "paste", function(e) {
						setTimeout(function() { dispatchEvent(el, "change"); }, 0);
					});
				}
			},

			value: function(self, el, attr, script) {
				self.hasExpr && (el.name = $parse(script, self.scope));
				self.isArray = el.name.slice(-2) === "[]";
				var name = self.isArray ? el.name.slice(0, -2) : el.name;
				return self.thisObj && self.thisObj[name];
			},

			update: function(self, el, node, value) {
				if (_dispatcher === el) return;

				var thisObj = self.thisObj;
				if (!thisObj) {
					return;
				}

				var name = self.isArray ? el.name.slice(0, -2) : el.name;
				var value = el.value;
				var type = el.type;

				if (thisObj[name] === undefined) {
					thisObj[name] = "";
				}

				if (isRadioButton(el)) {
					if (el.checked && thisObj[name] === undefined) {
						thisObj[name] = el.value;
						/// @TODO: update~ later /// update중 update콜이 나오면 flag를 세워두었다가 다시 업데이트~ 대신 무한 업데이트 콜이 뜨는 지 확인은 필~
						return;
					}

					el.checked = thisObj[name] === value;
					return;
				}

				if (isCheckbox(el) && self.isArray) {
					el.checked = indexOf(thisObj[name], value) >= 0;
					return
				}

				if (isCheckbox(el)) {
					el.checked = !!thisObj[name];
					return;
				}

				/// INPUT, TEXTAREA, ETC
				value = thisObj[name];
				el.value = value;
			}
		}
	}


	function __value() {
		return {
			update: function(self, el, node, value) {
				el.value = value;
			}
		}
	}


	function __with() {
		return {
			value: "expr-nocache",

			update: function(self, el, node, value) {
				self.$scope.push(value);
			},

			done: function(self, el, node, value) {
				self.$scope.pop();
			}
		}
	}


	function __template() {
		return {
			init: function(self, el, node, value) {

				// slot
				var slots = {};
				traversal(el, function(node) {
					var slot = "";
					if (node.nodeType === ELEMENT_NODE && (slot = node.getAttribute("slot"))) {
						node.removeAttribute("slot");
						slots["@" + slot] = node.cloneNode(true);
						node.parentNode.removeChild(node);
					}
				});


				// content
				var frag = document.createDocumentFragment();
				foreach(el.childNodes, function(child) {
					frag.appendChild(child.cloneNode(true));
				});
				slots["@content"] = frag;


				// preapre
				self.slots = slots;
				el.innerHTML = "";
			},

			update: function(self, el, node, value) {
				if (el.nodeName === "IFRAME") {
					el = el.contentWindow.document.body;
				}
				el.innerHTML = "";

				var slots = self.$scope.slots || {};
				var template = value.charAt(0) === "@" ? slots[value] : $cache("template")[value];
				if (!template) {
					return;
				}

				template = template.cloneNode(true);
				$compile(template);
				if (el.tagName === "TR") {
					var temp = document.createElement("div");
					temp.appendChild(template);
					var tr = temp.querySelector("tr");
					var frag = document.createDocumentFragment();
					while(tr.childNodes[0]) {
						frag.appendChild(tr.childNodes[0]);
					}
					template = frag;
				}

				el.appendChild(template);

				self.old_slots = self.$scope.slots;
				self.$scope.slots = self.slots;
			},

			done: function(self) {
				self.$scope.slots = self.old_slots;
			}
		}
	}


	function __visible() {
		return {
			value: "boolean",

			update: function(self, el, node, value) {
				value ? show(el) : hide(el);
			}
		}
	}


//function __if() {
//return {
//	value: "boolean",
//	
//	init: function(self, el) {
//		var textNode = document.createTextNode("");
//		el.parentNode.insertBefore(textNode, el);
//	
//	},
//
//	update: function(self, el, node, value) {
//		value ? show(el) : hide(el);
//	}
//}}


	function __enabled() {
		return {
			value: "boolean",

			update: function(self, el, node, value) {
				if (value) {
					el.removeAttribute("disabled");
					removeClass(el, "disabled");
					el.setAttribute("enabled", "enabled");
					addClass(el, "enabled");
				}
				else {
					el.removeAttribute("enabled");
					removeClass(el, "enabled");
					el.setAttribute("disabled", "disabled");
					addClass(el, "disabled");
				}
			}
		}
	}


	function __html() {
		return {
			init: function(self, el, node, script) {
				if (hasAttribute(el, "template")) {
					return false;
				}
				el.innerHTML = "";
			},

			update: function(self, el, node, value) {
				el.innerHTML = value;
			}
		}
	}


	function __text() {
		return {
			init: function(self, el, node, script) {
				if (hasAttribute(el, "template")) {
					return false;
				}
				el.innerText = "";
			},

			update: function(self, el, node, value) {
				el.innerText = value;
			}
		}
	}


	function __css() {
		return {
			init: function(self, el) {
				self.initValue = el.getAttribute("style") || "";
			},

			update: function(self, el, node, value) {
				el.setAttribute("style", self.initValue + ";" + value);
			}
		}
	}


	function __img_src() {
		var transparent_gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
		return {
			init: function(self, el, node, script, value) {
				el.src = transparent_gif;
			},

			update: function(self, el, node, value) {
				if (!value) {
					return;
				}

				if (value[0] == "=") {
					return;
				}

				el.src = value;
			}
		}
	}

	define("~nodeValue", __nodeValue);
	define("~boolean", __boolean);
	define("~event", __event);
	define("@init", __init);
	define("@ready", __ready);
	define("@repeat", __repeat);
	define("@name", __name);
	define("@value", __value);
	define("@with", __with);
	define("@template", __template);
	define("@css", __css);
	define("@visible", __visible);
//define("@if", __if);
	define("@enabled", __enabled);
	define("@html", __html);
	define("@text", __text);
	define("@img-src", __img_src);


/// Class
	function $createController(self, fn) {
		/// function(self, Controller1, Controller2, ...) 으로 부터 컨트롤을 가져옴.
		var args = [self];
		var source = fn.toString();
		var controllers = regexp_args.exec(source)[0];
		controllers = controllers.slice(1, -1);
		controllers = controllers.split(regexp_comma).slice(1);

		foreach(controllers, function(controller) {
			var f = window[controller]; /// @FIXME ...
			if (f === undefined) { throw new ReferenceError(controller + " is not defined"); }
			if (typeof f !== "function") { throw new TypeError(controller + " is not function"); }

			f = $createController(self, f);
			extend(self, f);
			args.push(f);
		});

		return fn.apply(self, args);
	}

	function $newInstance(fn, args) {
		args = args || [];

		var self = {};
		extend(self, $createController(self, fn));

		if (typeof self.__init__ === "function") {
			self.__init__.apply(self, args);
		}

		if (typeof self.init === "function") {
			self.init.apply(self, args);
		}

		return self;
	}

/// --- CROSS-BROWSING

/// TOUCH DEVICE
	if ("ontouchstart" in document) {

		var _addEvent = addEvent;
		var _removeEvent = removeEvent;

		var $touchTaget = null;
		var screenX = 0;
		var screenY = 0;

		window.addEventListener("touchstart", function(e) {
			$touchTaget = e.target;
			var touch = e.changedTouches[0];
			screenX = touch.screenX;
			screenY = touch.screenY;
		}, false);

		window.addEventListener("touchmove", function(e) {
			if ($touchTaget === null) return;

			var touch = e.changedTouches[0];
			var dx = screenX - touch.screenX;
			var dy = screenY - touch.screenY;
			screenX = touch.screenX;
			screenY = touch.screenY;

//		/// @TODO: 현재는 세로 스크롤만 체크하고 있지만 touchstart에서 getStyle등을 이용 hscroll, vscroll을 구분 적용해야된다.
			if (Math.abs(dy) > Math.abs(dx)) {
				$touchTaget = null;
				return;
			}

		}, false);


		addEvent = function(el, type, fn, flag) {
			if (type === "click") {
				fn[$key] = function(e) {
					if ($touchTaget === null || el.contains($touchTaget) === false) {
						return;
					}

					_removeEvent(el, "touchend", fn[$key], flag);
					$touchTaget = null;

					addClass(el, "highlighted");
					setTimeout(function() {
						fn.call(this, e);
						e.stopPropagation();

						setTimeout(function() {
							removeClass(el, "highlighted");
							_addEvent(el, "touchend", fn[$key], flag);
						}, 100);
					}, 100);
				};

				return _addEvent(el, "touchend", fn[$key], flag);
			}

			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }

			return _addEvent(el, type, fn, flag);
		};


		removeEvent = function(el, type, fn, flag) {
			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }
			else if (type === "click") {
				return _removeEvent(el, "touchend", fn[$key], flag);
			}

			return _removeEvent(el, type, fn, flag);
		}
	}


/// CROSS-BROWSING IE
	if (typeof console === "undefined") {
		window.console = {log: noop};
	}

	document.createElement("TEMPLATE");

/// IE 6-8
	if (msie <= 8) {
		matchesSelector = function(node, selector) {
			if (!node || !node.parentNode) {
				return false;
			}

			var nodeList = querySelectorAll(node.parentNode, selector),
				length = nodeList.length,
				i = 0;

			while(i < length) {
				if (nodeList[i] == node) return true;
				++i;
			}

			return false;
		};
		matchesSelector.div = document.createElement("div");

		/// html5shiv
		var F = document.createDocumentFragment();
		foreach("abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video template".split(" "), function(html5) {
			document.createElement(html5);
			F.createElement(html5);
		});

		attributesOf = function(el) {
			var div, attrs, ret, i, nodeValue, attr;

			div = document.createElement("div");
			div.appendChild(el.cloneNode(false));

			attrs = div.innerHTML.replace(regexp_string, "");
			attrs = attrs.substring(0, attrs.indexOf(">"));
			attrs = attrs.split(regexp_whitespace).slice(1);

			ret = [];
			for (i = 0; i < attrs.length; i++) {
				attr = el.getAttributeNode(attrs[i].split("=")[0]);
				if (attr) {
					nodeValue = attr.nodeValue;
					(nodeValue !== undefined && nodeValue !== null) && ret.push(attr);
				}
			}

			return ret;
		};

		hasAttribute = function(el, attrName) {
			return typeof el[attrName] !== 'undefined';
		};

		styleOf = function(el) {
			return el.currentStyle || el.style || {};
		};

		function fixEvent(el, fn) {
			return (fn.iefix = function(e) {
				e.target = e.srcElement || document;
				e.currentTarget = el;
				e.defaultPrevented = false;
				e.preventDefault = preventDefault;
				e.stopPropagation = stopPropagation;
				e.timeStamp = +new Date;

				e.metaKey = !!e.metaKey;
				e.relatedTarget = e.fromElement === e.target ? e.toElement : e.fromElement;

				if (e.clientX) {
					e.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					e.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}

				/// @TODO: IE EVENT FIX: which~

//			var button = e.button;
//			if (button) {
//				e.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
//			}
//
//			var charCode = e.charCode != null ? e.charCode : e.keyCode;
//			e.which = charCode;

				var result = fn.call(e.currentTarget, e);
				e.target = null;
				e.relatedTarget = null;
				e.preventDefault = null;
				e.stopPropagation = null;

				return (e.defaultPrevented === true) ? false : result;
			})
		}

		function preventDefault() {
			this.defaultPrevented = true;
			this.returnValue = false;
		}

		function stopPropagation() {
			this.cancelBubble = true;
		}

		addEvent = function(el, type, fn) {
			el.attachEvent("on" + type, fixEvent(el, fn));
		};

		removeEvent = function(el, type, fn) {
			el.detachEvent("on" + type, fn.iefix);
		};

		dispatchEvent = function(el, type) {
			return el.fireEvent("on" + type);
		};
	}

	if (msie <= 7) {
		querySelectorAll = function(context, selectors) {
			var style = document.createElement('style'), elements = [], element;
			document.documentElement.firstChild.appendChild(style);
			document._qsa = [];

			style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
			window.scrollBy(0, 0);
			style.parentNode.removeChild(style);

			while(document._qsa.length) {
				element = document._qsa.shift();
				element.style.removeAttribute('x-qsa');
				if (context === document || context.contains(element)) {
					elements.push(element);
				}
			}

			document._qsa = null;
			return elements;
		};

		if (typeof XMLHttpRequest === "undefined") {
			window.XMLHttpRequest = function() {
				try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
				catch(e) {}
				try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
				catch(e) {}
				try { return new ActiveXObject("Microsoft.XMLHTTP"); }
				catch(e) {}
				throw new Error("This browser does not support XMLHttpRequest.");
			};
		}
	}


	if (!window.WeakMap) {
		_WeakMap = function() {
			this._keys = [];
			this._values = [];
		};

		_WeakMap.prototype = {

			set: function(key, value) {
				for (var i = 0, len = this._keys.length; i < len; i++) {
					if (this._keys[i] === key) {
						this._values[i] = value;
						return
					}
				}

				this._keys[i] = key;
				this._values[i] = value;
			},

			get: function(key) {
				for (var i = 0, len = this._keys.length; i < len; i++) {
					if (this._keys[i] === key) {
						return this._values[i]
					}
				}
			},

			"delete": function(key) {
				for (var i = 0, len = this._keys.length; i < len; i++) {
					if (this._keys[i] === key) {
						this._keys.splice(i, 1);
						this._values.splice(i, 1);
						return
					}
				}
			}
		}
	}


	var $component = {
		create: function(params, controllerFn) {
			var selector = params.selector;
			var templateId = params.templateId;
			var template = document.getElementById(templateId).cloneNode(true);
			var frag = extractTemplate(template);

			controllerFn.$template = document.getElementById(templateId);
			removeNode(controllerFn.$template);

			foreach(querySelectorAll(document, selector), function(el) {
				var controller = $newInstance(controllerFn);
				el.innerHTML = "";
				el.appendChild(frag.cloneNode(true));
				$compile(el, controller);

				controller.$update = function() {
					$update(el, controller);
				};
				controller.$update();
				$queue.push(controller.$update);

				el.$component = controller;
			});
		},

		getComponentById: function(id) {
			var el = document.getElementById(id);
			if (!el) return null;
			return el.$component || null;
		}
	};

	var $queue = [];
	document.update = function() {
		foreach($queue, function($q) {
			$q();
		})
	};

	window.$component = $component;


}(window, document));