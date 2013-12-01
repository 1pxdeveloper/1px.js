/*!
 * jpx JavaScript Library v0.0.0
 * http://1px.kr/
 *
 * Copyright 2012 1pxgardening
 * Released under the MIT license
 */ 

(function(window,document,undefined) {
"use strict";

var msie = +(/msie (\d+)/i.exec(navigator.userAgent) || [])[1],
	_toString = Object.prototype.toString,
	_fn_toString = Function.prototype.toString,
	_cache = {};

var	regexp_$eval = /[_a-zA-Z\u0080-\uffff]+[_a-zA-Z0-9\u0080-\uffff]*/g,
	regexp_$parse = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[{}'"]|[^'"{}]+/g,
	regexp_string = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
	regexp_trim = /^\s+|\s+$/g,
	regexp_nonwhitespace = /\S+/g,
	regexp_whitespace = /\s+/g,
	regexp_whitespace_only = /^\s+$/g,
	regexp_route = /[^\/#!]+$/g,

	regexp_args = /\([^)]*\)/m,
	regexp_comma = /\s*,\s*/,
	
	regexp_opacity = /;\s*opacity\s*:([^;]+);/;

var ELEMENT_NODE = 1,
	ATTR_NODE = 2,
	TEXT_NODE = 3,
	DOCUMENT_NODE = 9;

var isArray = Array.isArray = Array.isArray || function(obj) { return _toString.call(obj) === "[object Array]"; }
var now = Date.now = Date.now || function() { return new Date().getTime(); }


function noop(){};

function $cache(name) {
	return (_cache[name] = _cache[name] || {});
}

function require(name) {
	var modules = $cache("modules"),
		sources = $cache("sources");

	return modules[name] || (modules[name] = sources[name] && sources[name]());
}

function define(name, fn) {
	var sources = $cache("sources");
	sources[name] = fn;
}



/// Collection
function foreach(obj, fn) {
	if (obj === null || typeof obj !== "object") return;
	if (typeof obj.length === "number") {
		for (var i = 0, len = obj.length; i < len; i++) {
			fn(obj[i], i);
		}
		return;
	}

	for (var k in obj) {
		obj.hasOwnProperty(k) === true && fn(obj[k], k);
	}
}

function indexOf(obj, search) {
	if (obj === undefined || obj === null) return -1;
	for (var i = 0, len = obj.length; i < len; i++) {
		if (obj[i] === search) return i;
	}
	return -1;
}

function pluck(obj, name) {
	var ret = [];
	foreach(obj, function(row) {
		row[name] !== undefined && ret.push(row[name]);
	});
	return ret;
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

function isEqual(a, b) {
	if (a === b) return true;
	if (!a || !b) return (a !== a && b !== b) || a === b; // NaN, false, null, undefined

	var type = typeof a, props, prop, i;

	if (type !== typeof b) return false;
	if (a.length !== b.length) return false; /// Array, String (rapid)
	if (type === "function") return a.name === b.name && a.toString() === b.toString(); /// Function
	if (type !== "object") return a === b; /// Number, String
	if (a.constructor === RegExp) return a.toString() === b.toString(); /// RegExp
	if (a.constructor === Date) return +a === +b; /// Date
	
	props = [];
	
	/// Array
	if (a.length !== undefined && isArray(a)) {
		prop = a.length;
		while(prop-- !== 0) {
			if (typeof a[prop] === "object" && a[prop] !== null) {
				props.push(prop);
				continue;
			}

			if (isEqual(a[prop], b[prop]) === false) return false;
		}
	}
	
	/// Object
	else {
		for (prop in a) {
			if (a.hasOwnProperty(prop) === false) continue;
			if (b[prop] === undefined && a[prop] !== undefined) return false;
			if (typeof a[prop] === "object" && a[prop] !== null) {
				props.push(prop);
				continue;
			}

			if (isEqual(a[prop], b[prop]) === false) return false;
		}
		
		for (prop in b) {
			if (b.hasOwnProperty(prop) === false) continue;
			if (a[prop] === undefined && b[prop] !== undefined) return false;
		}
	}

	i = props.length;
	while(i-- !== 0) {
		if (isEqual(a[props[i]], b[props[i]]) === false) return false;
	}

	return true;
}


/// Array
function makeArray(arr) {
	if (arr === undefined || arr === null || typeof arr.length !== "number") return [];
	var i = arr.length, r = Array(i);
	while(i-- !== 0) r[i] = arr[i];
	return r;
}


/// String
function trim(str) {
	return str.replace(regexp_trim, "");
}

function isWhiteSpace(str) {
	if (str === "") return true;
	if (str === " ") return true;
	if (str === "\n") return true;
	if (str === "\t") return true;
	if (str === "\n\t") return true;
	if (str === "\n\n") return true;
	if (str === "\n\n\n") return true;
	return regexp_whitespace_only.test(str) === true;
}

function makeNumber(str) {
	var num = parseFloat(str);
	return ''+num === str ? num : str;
}


/// Date
function now() {
	return new Date().getTime();
}




/// DOM
function dealloc(el) {
	/// @TODO: Data와 Event Handler등 리소스 제거 하는 루틴 적용할것..
}

function isElement(el) {
	return el && el.nodeName !== undefined;
}

function isRadioButton(el) {
	return isElement(el) && el.tagName === "INPUT" && el.type === "radio";
}

function isCheckbox(el) {
	return isElement(el) && el.tagName === "INPUT" && el.type === "checkbox";
}

function isArrayCheckbox(el) {
	return isCheckbox(el) && el.name.slice(-2) === "[]";
}

function isVisible(el) {
	if (el === document) return true;
	if (isElement(el) === false) return false;
	if (!el.parentNode) return false;
	
	var style = styleOf(el);

	if (style["display"] === 'none') return false;
	if (style["opacity"] === '0') return false;
	if (style["visibility"] === 'hidden') return false;

	// @TODO:
//	var w = el.offsetWidth;
//	var h = el.offsetHeight;
//	var isTR = el.tagName === 'TR';	
//	
//	if (w === 0 && h === 0 && !isTR) {
//		return false;
//	}
	
	/// @TODO: 스크린에서 벗어난 경우에도 추가 해볼까?

	return true;
}

function isBooleanAttr(a) {
	if (a === "selected") return true;
	if (a === "checked") return true;
	if (a === "disabled") return true;
//	if (a === "autoplay") return true;
//	if (a === "async") return true;
//	if (a === "autofocus") return true;
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
//	if (a === "open") return true;
//	if (a === "pubdate") return true;
	if (a === "readonly") return true;
//	if (a === "required") return true;
//	if (a === "reversed") return true;
//	if (a === "scoped") return true;
//	if (a === "seamless") return true;

	return false;
}


/// @FIXME.. 귀찮아서 일단 임시로..
function isclosest(node, sel) {
	var ret = [];
	foreach(querySelectorAll(document, sel), function(parent) {
		parent.contains(node) && ret.push(parent);
	});
	return ret.length > 0;
}


function show(el) {
	el.style.display = "";

	if (styleOf(el)["display"] === "none") {

//		/// @TODO: 모듈화 할것!! -> 그리고 memoize도 하고.. 좀더 아이디어를 내볼것..
		var iframe = document.createElement("iframe");
		iframe.style.display = "none";
		document.body.appendChild(iframe);
		var node = document.createElement(el.nodeName);
		iframe.contentWindow.document.body.appendChild(node);
		
		var a = styleOf(node)["display"];
		document.body.removeChild(iframe);
		
		el.style.cssText += (";" + "display:"+a+" !important;");
	}
}

function hide(el) {
	el.style.cssText += (";" + "display:none !important;");
}



function _makeClassName(str, obj) {
	obj = obj || {};
	var ret = [];
	str.replace(regexp_nonwhitespace, function(a) {
		!obj[a] && ret.push(a);
		obj[a] = true;
	});
	
	return ret.join(" ");
}

function addClass(el, className) {
	el.className = _makeClassName(el.className + " " + className);
}

function removeClass(el, className) {
	var obj = {};
	className.replace(regexp_nonwhitespace, function(a) {
		obj[a] = true;
	});

	el.className = _makeClassName(el.className, obj);
}

function hasClass(el, className) {
	return (" " + el.className + " ").indexOf(" " + className + " ") !== -1;
}


function attributesOf(el) {
	return makeArray(el.attributes);
}

function styleOf(el) {
	return document.defaultView.getComputedStyle(el) || el.style || {};
}

function hasAttribute(el, attr) {
	return el.hasAttribute(attr);
}

function addEvent(el, type, fn, flag) {
	el.addEventListener(type, fn, flag || false);
}

function removeEvent(el, type, fn, flag) {
	el.removeEventListener(type, fn, flag || false);
}

function dispatchEvent(el, type, props) {
	props = props || {};
	var event = document.createEvent("Event");
	event.initEvent(type, true, true);

	var ignore = Object.getOwnPropertyNames(event);
	for (var key in props) {
		if (props.hasOwnProperty(key) === false) continue;
		if (indexOf(ignore, key) === -1) event[key] = props[key];
	}

	return el.dispatchEvent(event);
}

function bind(el) {
	var fn = arguments[arguments.length-1];
	for (var i = 1, len = arguments.length-1; i < len; i++) {
		addEvent(el, arguments[i], fn);
	}
}

function unbind(el) {
	var fn = arguments[arguments.length-1];
	for (var i = 1, len = arguments.length-1; i < len; i++) {
		removeEvent(el, arguments[i], fn);
	}
}


var $key = now();
var $uuid = 1;
function createData(el) {
	if (el === undefined || el === null) return {};
	var cache = $cache("data"),
		id = el[$key] = el[$key] || $uuid++;
	return (cache[id] = cache[id] || {});
}

function readData(el) {
	if (el === undefined || el === null) return;
	var cache = $cache("data");
	return cache[el[$key]];
}

function removeData(el) {
	if (el === undefined || el === null) return;
	var cache = $cache("data");
	delete cache[el[$key]];
}









/// CROSS-BROWSING IE
if (window.console === undefined) { window.console = {log: noop}; }

document.createElement("TEMPLATE");

function IEpreventDefault() {
	this.defaultPrevented = true;
	this.returnValue = false;
}

function IEstopPropagation() {
	this.cancelBubble = true;
}

function IEEventHandler(el, fn) {
	return function(e) {
		e.target = e.srcElement || document;
		e.currentTarget = el;
		e.timeStamp = now();
		e.defaultPrevented = false;
		e.preventDefault = IEpreventDefault;
		e.stopPropagation = IEstopPropagation;
		
		if (e.type == 'mouseover') { e.relatedTarget = e.fromElement; }
		else if (e.type == 'mouseout') { e.relatedTarget = e.toElement; }

		if (e.clientX !== undefined) {
			e.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			e.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		var result = fn.call(e.currentTarget, e);
		
		e.target = null;
		e.relatedTarget = null;
		e.preventDefault = null;
		e.stopPropagation = null;

		return (e.defaultPrevented === true) ? false : result;
	}
}

if (msie <= 7) {
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
			nodeValue = attr.nodeValue;
			(nodeValue !== undefined && nodeValue !== null) && ret.push(attr);
		}

		return ret;	
	};

	hasAttribute = function(el, attr) {
		var attr = el.getAttribute(attr);
		return attr !== undefined && attr !== null;
	};
}

if (msie <= 8) {
	styleOf = function(el) {
		return el.currentStyle || el.style || {};
	};

	addEvent = function(el, type, fn) {
		var cache = $cache("ieevent"), events, hanlder, data;
		events = cache.events = cache.events || [];

		for (var i = 0, len = events.length; i < len; i++) {
			data = events[i];
			if (data[0] === el && data[1] === type && data[2] === fn) {
				return;
			}
		}

		handler = IEEventHandler(el, fn);
		events.push([el, type, fn, handler]);
		
		el.attachEvent('on'+type, handler);
	};
	
	addEvent(window, "unload", function() {
		var cache = $cache("ieevent"), events;
		events = cache.events = cache.events || [];
		foreach(events, function(data) {
			data[0].detachEvent('on'+data[1], data[3]);
			data[0] = null;
			data[2] = null;
			data[3] = null;
		});
		events = null;
	});

	removeEvent = function(el, type, fn) {
		var cache = $cache("ieevent"), events, hanlder, data;
		events = cache.events = cache.events || [];

		for (var i = 0, len = events.length; i < len; i++) {
			data = events[i];
			if (data[0] === el && data[1] === type && data[2] === fn) {
				hanlder = data[3];
				break;
			}
		}
		
		if (hanlder) {
			el.detachEvent('on'+type, hanlder);
			events.splice(i, 1);
		}
	};

	dispatchEvent = function(el, type, props) {
		var cache, events, event;
		props = props || {};

		if ("on"+type in el) {
			event = document.createEventObject(props);
			event.type = type;
			event.target = el;
			event.currentTarget = el;
			return el.fireEvent("on"+type, event);
		}
		
		cache = $cache("ieevent");
		events = cache.events = cache.events || [];

		foreach(events, function(data) {
			if (data[0] === el && data[1] === type) {
				try{data[3](extend(document.createEventObject(), props))}catch(e){};
			}
		});
	};
	
	createData = function(el) {
		if (el === undefined || el === null) return {};

		var cache = $cache("iedata"),
			row = readData(el);
		
		if (row) {
			return row;
		}

		row = {el: el, data: {}};

		if (el.sourceIndex === undefined || el.sourceIndex === -1) {
			cache[el.sourceIndex].push(row)
		}
		else {
			cache[el.sourceIndex] = row;
		}

		return row.data;
	};
	
	readData = function(el) {
		if (el === undefined || el === null) return;

		var cache = $cache("iedata"),
			row,
			index;
		
		cache[-1] = cache[-1] || [];
		cache[undefined] = cache[undefined] || [];

		row = cache[el.sourceIndex];
		if (row && row.el === el) {
			return row.data;
		}

		/// TextNode or Not in Document
		if (el.sourceIndex === undefined || el.sourceIndex === -1) {
			for (var i = 0, len = row.length; i < len; i++) {
				if (row[i].el === el) {
					return row[i].data;
				}
			}
			return;
		}

		/// Re Sort
		var temp = {};
		foreach(cache, function(row, key) {
			if (key === "undefined" || key === "-1") return;
			temp[key] = row;
		});
		
		foreach(temp, function(row, key) {
			if (key === "undefined" || key === "-1") return cache[row.el.sourceIndex].push(row);
			cache[row.el.sourceIndex] = row;
		});
		
		row = cache[el.sourceIndex];
		if (row && row.el === el) {
			return row.data;
		}
	};
	
	removeData = function(el) {
		if (el === undefined || el === null) return;

		var cache = $cache("iedata"),
			row = readData(el);
		
		if (!row) {
			return;
		}

		if (el.sourceIndex === undefined || el.sourceIndex === -1) {
			cache[el.sourceIndex].splice(indexOf(cache[el.sourceIndex], row, 1));
		}
		else {
			delete cache[el.sourceIndex];
		}
	};
}



function json_encode(obj, stack) {
	stack = stack || [];

	if (obj === undefined) return "undefined";
	if (obj === null) return "null";
	if (obj === true) return "true";
	if (obj === false) return "false";

	var type = typeof obj;
	if (type === "number") return ""+obj;
	if (type === "string") return '"'+obj+'"';
	if (type === "function") return '[object function]';
	if (type !== "object") return obj.toString();

	if (indexOf(stack, obj) !== -1) {
		return "[object circular]";
//		throw new Error("!!!");
	}
	stack.push(obj);
	
	var ret = [];
	if (isArray(obj)) {
		foreach(obj, function(row) { ret.push(json_encode(row,stack)); });
		return "["+ret.join()+"]";
	}

	foreach(obj, function(row, key) { ret.push('"'+key+'":'+json_encode(row,stack)); });
	return "{"+ret.join()+"}";	
}





/// --- jpx

/// $eval
function $eval(script, scope) {
	if (script === '') return '';
	if (script === 'true') return true;
	if (script === 'false') return false;
	if (script === 'undefined') return undefined;
	if (script === 'null') return null;
	
	if (!scope || !scope.length) {
		return;
	}
	
	script = script.replace(/\\'/g, "'").replace(/\\"/g, '"');

	var cache = $cache("eval"),
		thisObj, fn, hash, i, code = "";

	thisObj = scope[1];

	try {
		hash = scope.length + script;
		if (cache[hash] === undefined) {
			script.replace(regexp_string, "").replace(regexp_$eval, function(prop) {
				!(prop in window) && (window[prop] = undefined);
			});
			
			i = scope.length;
			while(i-- !== 0) { code += ("with(arguments["+i+"])"); }
			code += ("{return ("+script+");}");
			cache[hash] = new Function(code);
		}
				
		fn = cache[hash];
		return fn.apply(thisObj, scope);

	} catch(e) {
		console.log(e, e.message, script);
//		console.trace();
	}
}


/// $parse @TODO: 으아아아아!!! 다시 꼭 여기!!
function $parse_expr(script) {
	var brace_count = 0,
		expr = "",
		quote = "",
		ret = [];

	script.replace(regexp_$parse, function(match) {
		if (match === "{") {
			brace_count = Math.max(1, brace_count + 1);
			if (expr && brace_count === 1) {
				ret.push([false, expr]);
				expr = "";
			}
		}

		quote = match.charAt(0);
		if (brace_count <= 0 && (quote === "'" || quote === "\"") && match.length > 1) {
			var inner = $parse_expr(match.slice(1,-1));
			
			if (inner[0][0] === true) {
				ret.push([false, expr]);
				expr = "";
			} else {
				inner[0][1] = expr + quote + inner[0][1];	
				expr = inner.pop()[1] + quote;
			}
			
			ret = ret.concat(inner);
		}
		else {
			expr += match;
		}

		if (match === "}") {
			brace_count--;
			if (expr && brace_count === 0) {
				ret.push([true, expr]);
				expr = "";
			}
		}
			
		return match;
	});
	
	expr && ret.push([false, expr]);
	return ret;
}


function $parse_eval(isExpr, text, scope) {
	if (isExpr === false) return text;
	var r = $eval(text.slice(1,-1), scope);
	return (r === null || r === undefined) ? "" : r;
}

function $parse(script, scope, fn) {
	if (script === null || script === undefined) return "";
	if (isWhiteSpace(script) === true) return script;
	
	fn = fn || $parse_eval;
	script = ""+script;
	
	var cache = $cache("parse"),
		snippet = cache[script] = cache[script] || $parse_expr(script),
		ret;

	if (snippet.length === 1 && snippet[0][0] === false) {
		return script;
	}
	
	ret = "";
	for (var i = 0; i < snippet.length; i++) {
		ret += fn(snippet[i][0], snippet[i][1], scope);
	}

	return ret;
}


/// $traversal
function $traversal(el, fn) {
	if (!el) return;

	var stack = [], next, result;
	fn = fn || noop;

	if (fn(el) === false) return;
	next = el.childNodes && el.childNodes[0];

	while(next) {
		next.nextSibling && stack.push(next.nextSibling);
		result = fn(next);
		next = next.childNodes && next.childNodes[0];
		(!next || result === false) && (next = stack.pop());
	}
}



/// $traversal + with done!!
function $traversal_with_done(el, scope, fn, fn2) {
	if (!el) return;

	var stack = [],
		done = [el],
		last = [el],
		row, next, result;

	fn = fn || noop;
	fn2 = fn2 || noop;

	if (fn(el, scope) === false) {
		fn2(el, scope)
		return;
	}

	next = el.childNodes && el.childNodes[0];
	while(next) {
		done.push(next);

		next.nextSibling && stack.push(next.nextSibling);
		next.nextSibling && last.push(next);
		result = fn(next, scope);
		next = next.childNodes && next.childNodes[0];

		if (!next || result === false) {
			next = stack.pop();

			while((row = done.pop())) {
				fn2(row, scope);
				if (row === last[last.length-1]) {
					last.pop();
					break;
				}
			}
		}
	}
	
	while((row = done.pop())) {
		fn2(row, scope);	
	}
}


/// $compile
function $compile(el, scope) {
	createData(el).scope = scope;
	$traversal_with_done(el, scope, $compile_begin, $compile_end);
}

function $compile_begin(node, scope) {
	return ($compile_begin[node.nodeType] || noop)(node, scope);
}

function $compile_end(node, scope) {
	return ($compile_end[node.nodeType] || noop)(node, scope);
}

function attr_priority(a) {
	if (a === "repeat") return 40;
	if (a === "init") return 30;
	if (a === "css") return -10;
	if (a === "visible") return -20;
	if (a === "hidden") return -20;
	if (a === "with") return -30;
	if (a === "name") return -40;
	if (a === "template") return -50;
	return 0;
};

function by_attr_priority(a, b) {
	return attr_priority(b.nodeName) - attr_priority(a.nodeName);
}

$compile_begin[DOCUMENT_NODE] = function(el, scope) {
	$traversal(el, function(node) {
		if (node.nodeName.toUpperCase() === "TEMPLATE") {
			$cache("template")[node.id] = $cache("template")[node.id] || node.innerHTML;
			node.parentNode.removeChild(node);
			return false;
		}
	});
};

$compile_begin[ELEMENT_NODE] = function(el, scope) {
	if (el.nodeName === "SCRIPT" || el.nodeName === "HEAD" || el.nodeName === "STYLE") {
		return false;
	}
	
	/// @FIXME: 아닌 경우가 더 많으..
	var result;
	var data = readData(el);
	var ignore = null;
	if (data && data.$observers) {
		ignore = pluck(data.$observers, "name");
		console.log("@ignore", ignore);
	}

	/// @FIXME: 너무 소스가 중복인데 잘 생각해보자~
	if (ignore) {
		foreach(attributesOf(el).sort(by_attr_priority), function(node) {
			if (indexOf(ignore, node.nodeName) !== -1) return;
			$compile_begin[ATTR_NODE](node, el, scope) === false && (result = false);
		});
	}
	else {
		foreach(attributesOf(el).sort(by_attr_priority), function(node) {
			$compile_begin[ATTR_NODE](node, el, scope) === false && (result = false);
		});
	}

	return result;
};

$compile_begin[ATTR_NODE] = function(attr, el, scope) {

	if (!el.parentNode) {
		return;
	}

	var nodeName = attr.nodeName;
	var value = attr.nodeValue;
	var handler;
	var hasExpr = $parse(value, null, noop) !== value;
	
	if (value === undefined || value === null || value === "") {
		return;
	}
	
	// Handler - Custom
	handler = require("@"+nodeName);

	if (handler) {
		return createObserver(el, attr, scope, hasExpr, handler);
	}

	// Handler - Boolean
	if (isBooleanAttr(nodeName) === true) {
		return createObserver(el, attr, scope, false, require("~boolean"));
	}

	// Handler - Event
	if (("on"+nodeName) in document || ("on"+nodeName) in el || nodeName.substring(0,3) === "on-") {
		return createObserver(el, attr, scope, false, require("~event"));
	}

	// Handler - {expr}
	if (hasExpr) {
		return createObserver(el, attr, scope, hasExpr, require("~nodeValue"));	
	}
};

$compile_begin[TEXT_NODE] = function(node, scope) {
	if (isWhiteSpace(node.nodeValue) === true) {
		return false;
	}
		
	var hasExpr = false,
		textNode;

	$parse(node.nodeValue, null, function(isExpr, text) {
		hasExpr = hasExpr || isExpr;
		textNode = document.createTextNode(text);
		node.parentNode.insertBefore(textNode, node);
		isExpr && createObserver(textNode, textNode, scope, isExpr, require("~nodeValue"));	
	});

	if (hasExpr) {		
		node.parentNode.removeChild(node);
	}

	return false;
};

$compile_end[ELEMENT_NODE] = function(el, scope) {

	if (el.nodeName === "SCRIPT" || el.nodeName === "HEAD" || el.nodeName === "STYLE") {
		return false;
	}

	/// 옵저버 Update!
	var data = readData(el);
	if (data === undefined /*|| data.$observers === undefined*/) {
		return;
	}

	foreach(makeArray(data.$observers), function(ob, index) {
		if (ob.handler.done && ob.hasUpdated === true) {
			if (ob.handler.done(ob, el) === false) {
				data.$observers.splice(index, 1);
			}
			
			ob.hasUpdated = false;
		}
	});
};






function createObserver(el, node, $scope, hasExpr, handler) {

	var nodeName = node.nodeName;
	var value = node.nodeValue;
	var scope = makeArray($scope);
	var data, pdata;
	var result;
	
	var observer = {
		el: el,
		node: node,
		name: nodeName,
		script: value,
		handler: handler,
		$scope: $scope,
		scope: scope,
		thisObj: scope[1],
		hasExpr: hasExpr
	};


	/// @FIXME: 로컬변수 저장
	var local = scope[0] = extend({}, scope[0]);
	local.el = el.nodeType === TEXT_NODE ? el.parentNode : el;
	local.$parent = scope[2];
	local.$parents = scope.slice(2);
	local.$root = scope[scope.length-1];
	


	// init
	result = handler.init && handler.init(observer, el, node, value);


	// add observer
	data = createData(el);
	data.$observers = data.$observers || [];
	data.$observers.push(observer);
	
	// 첫 옵저버 등록 시 상위 노드에 옵저버가 있다고 알려줌.
	if (data.$observers.length === 1) {

		/// @FIXME: 코드 정리
		while(el) {
			pdata = readData(el.parentNode);

			if (pdata) {
				pdata.$hasObserverChildren = pdata.$hasObserverChildren || [];
				if (indexOf(pdata.$hasObserverChildren, el) === -1) {
					pdata.$hasObserverChildren.push(el);
				}
				
				break;
			}

			el = el.parentNode;
		}
	}
	
	// update
	if (updateObserver(observer, $scope) === false) {
		data.$observers.pop();
	}
	
	return result;
}



function updateObserver(self, $scope) {
	var el = self.el;
	var node = self.node;
	var script = self.script;
	var handler = self.handler;
	var scope = makeArray($scope);

	var local = scope[0] = extend({}, scope[0]);
	local.el = el.nodeType === TEXT_NODE ? el.parentNode : el;
	local.$parent = scope[2];
	local.$parents = scope.slice(2);
	local.$root = scope[scope.length-1];

	self.$scope = $scope;
	self.scope = scope;
	self.thisObj = self.scope[1];
	self.hasUpdated = false;

	if (self.handler.update === undefined) {
		return;
	}

	handler.value = handler.value || updateObserver[handler.valueType];
	var value = handler.value ? handler.value(self, el, node, script) : script;

	// 값이 변화가 없으면 SKIP
	if (self.hasOwnProperty("value") === true && isEqual(self.value, value) === true) {
		return;
	}	


	// Call Update
	var result = handler.update(self, el, node, script, value);
	self.value = value;
	self.hasUpdated = true;
	
	if (handler.valueType === "string") {
		return result === false ? result : self.hasExpr;
	}

	return result;
}


/// @FIXME: 이거 이름좀 확실하게 바꾸자...
updateObserver['string'] = function(self, el, attr, script) {
	return $parse(script, self.scope);
};

updateObserver['expr'] = function(self, el, attr, script) {
	return $eval(script, self.scope);
};

updateObserver['expr-nocache'] = function(self, el, attr, script) {
	var r = $eval(script, self.scope);
	delete self.value;
	return r;
};







/// $update
function $update(el) {
	var data = readData(el) || {};
	var scope = data.scope || [];

	var t = now();
	$traversal_with_done(el, scope, $update_observers, $compile_end);
//	console.log(now() - t);
}

function $update_observers(node, scope) {
	if (node.nodeName === "SCRIPT" || node.nodeName === "HEAD" || node.nodeName === "STYLE") {
		return false;
	}

	/// 옵저버가 없는 엘리먼트는 SKIP!
	var data = readData(node.parentNode);

		
	if (data !== undefined && data.$hasObserverChildren !== undefined
		&& readData(node) === undefined
		&& indexOf(data.$hasObserverChildren, node) === -1) {

		return false;
	}

	/// 옵저버 Update!
	data = readData(node);
	if (data === undefined || data.$observers === undefined) {
		return;
	}

	foreach(makeArray(data.$observers), function(ob, index) {
		if (updateObserver(ob, scope) === false) {
			data.$observers.splice(index, 1);
		}
	});


	/// @TODO: 옵저버가 없다고 알리고 removeData 할것!!
//	if (data.$observers.length === 0) {
//		if (data.$hasObserverChildren) {
//		
//		}
//	}

	return isVisible(node);
}




/// ~nodeValue
define("~nodeValue", function() {
return {
	valueType: "string",
	
	update: function(self, el, node, script, value) {
		node.nodeValue = value;
	}
}});



/// ~boolean
define("~boolean", function() {
return {
	valueType: "expr",
	
	update: function(self, el, node, script, value) {
		value ? el.setAttributeNode(node) : el.removeAttribute(node);
		value ? addClass(el, node.nodeName) : removeClass(el, node.nodeName);
	}
}});




/// ~event
define("~event", function() {
return {
	init: function(self, el, node, script) {
	
		var name = node.nodeName;
		var type = name.substring(0,3) === "on-" ? name.substring(3) : name;

		addEvent(el, type, function(e) {
			if (isclosest(el, ".disabled, *[disabled]")) {
				e.preventDefault();
				e.stopPropagation();	
				return false;		
			}

			if (type === "submit" && !el.getAttribute("action")) {
				e.preventDefault();
				e.stopPropagation();			
			}
			

			window.$event = e;
			var result = $eval(script, self.scope);
			window.$event = undefined; // @FIXME: dummy event
			
			if (result === false) {
				return false;
			}
			
			$update(document);
		});
	}
}});



/// @init
define("@init", function() {
return {
	valueType: "expr",
	
	update: function() {
		return false;
	}
}});



/// @repeat
define("@repeat", function() {

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
				index = trim(row.substring(lastIndex+1));
				row = trim(row.substring(0, lastIndex));
			}
		}

		///
		node.nodeValue = "";
		var repeatNode = node.nextSibling;
		var endNode = document.createTextNode("");
		repeatNode.setAttribute("repeat", "#");
		repeatNode.parentNode.insertBefore(endNode, el);
		repeatNode.parentNode.insertBefore(node, endNode);
		repeatNode.parentNode.removeChild(repeatNode);

		self.container = [];
		self.startNode = node;
		self.endNode = endNode;
		self.rows = rows;
		self.row = row;
		self.index = index;
		self.repeatNode = repeatNode.cloneNode(true);
	},
	
	value: function(self, el, node) {
		var collection = $eval(self.rows, self.scope);
		if (collection === null || typeof collection !== "object" || typeof collection.length !== "number") {
			collection = [];
		}

		foreach(self.container, function(repeatNode, index) {
			var data = createData(repeatNode);
			data.collection = collection;
			data.row = collection[index];
		});

		self.collection = collection;

		return collection.length;
	},
	
	update: function(self, el, node, script, value) {
		var collection = self.collection;
		var reorders = []; /// @NOTE: 그냥 비교하는 구분을 줄이는걸 택했는데 (length만 비교) 테스트해보고 느리면 reorder 추가하자.
		var pool = makeArray(self.container);
		var here = el.nextSibling;
		var data;
		
		self.container = Array(collection.length);

		foreach(collection, function(row, index) {
			var repeatNode = reorders[index] || pool.shift() || self.repeatNode.cloneNode(true);
			self.container[index] = repeatNode; 
			
			repeatNode != here && here.parentNode.insertBefore(repeatNode, here);
			here = repeatNode.nextSibling;
			
			var isCompiled = !!((readData(repeatNode) || {}).$observers);
			data = createData(repeatNode);
			data.collection = collection;
			data.row = row;
			data.index = index;
			data.rowName = self.row;
			data.indexName = self.index;

			if (isCompiled === false) {
				$compile(repeatNode, makeArray(self.$scope));
			}
		});


		// 사용안하는 Node 제거			
		while(pool.length) {
			var removed = pool.pop();
			removed.parentNode.removeChild(removed);
			removed = null;
		}
	}
}
	
return {
	init: function(self, el, node, script) {
		if (script === "#") {
			el.removeAttribute("repeat");
			return;
		}

		var placeHolder = document.createTextNode(script);
		el.parentNode.insertBefore(placeHolder, el);
		createObserver(placeHolder, placeHolder, self.scope, false, repeatHandler);
		return false;
	},
	
	value: function(self) {
		delete self.value;
	},
	
	update: function(self, el) {
		var data = readData(el);
		data.rowName && (self.$scope[0][data.rowName] = data.row);
		data.indexName && (self.$scope[0][data.indexName] = data.index);
	},
	
	done: function(self, el) {
		var data = readData(el);
		data.rowName && delete self.$scope[0][data.rowName];
		data.indexName && delete self.$scope[0][data.indexName];
	}
}});



/// @with
define("@with", function() {
var index = 0;

return {
	valueType: "expr-nocache",
	
	update: function(self, el, attr, script, value) {
		self.$scope.splice(1, 0, value || {});
	},
	
	done: function(self, el) {
		self.$scope.splice(1, 1);
	}	
}});




/// @template
define("@template", function() {
return {
	valueType: "string",

	init: function(self, el, node, script) {
		return false;
	},

	update: function(self, el, node, script, value) {
		var template = $cache("template")[value];
		if (!template) {
			el.innerHTML = "";
			return;
		}

		el.innerHTML = template;
		foreach(el.childNodes, function(el) {
			$compile(el, self.$scope);
		});
	}	
}});




/// @name
define("@name", function() {
var $emitter;

return {
	init: function(self, el, attr, script) {
		
		if (msie <= 8) {
			bind(el, "keydown", "cut", "paste", function(e) {
				setTimeout(function(){ dispatchEvent(el, "change"); });
			});
		}
		
		bind(el, "input", "change", function(e) {
			var thisObj = self.thisObj;
			var name = el.name;
			var value = el.value;

			if (isEqual(thisObj[name], value)) {
				return;
			}
			
			self.value = thisObj[name] = el.value;
			$emitter = el;
			$update(document);
			$emitter = null;
		});
	},
	
	value: function(self, el, attr, script, value) {
		self.hasExpr && (el.name = $parse(script, self.scope));
		var name = isArrayCheckbox(el) ? el.name.slice(0,-2) : el.name;

		return self.thisObj[name];
	},
	
	update: function(self, el, attr, script, value) {
		if ($emitter === el) return;
		
		var thisObj = self.thisObj;
		var name = el.name;
		var value = thisObj[name] || el.value;

		el.value = value;
	}

}});




/// @value
//define("@value", function() {
//return {
//	valueType: "string",
//	
//	init: function(self, el, attr, script) {
//		if (el.tagName !== "INPUT" && el.tagName !== "OPTION") {
//			return false;
//		}
//	},
//
//	update: function(self, el, attr, script, value) {
//		el.value = value;
//		
//		// @NOTE: 컴파일이 완료되기 전에는 update를 하지 않는다.
//		if (self.flag !== true) {
//			self.flag = true;
//			return;
//		}
//		
//		var name = $parse(el.$name || el.name, el);
//		var type = el.type;
//		var thisObj = elementGetThisObj(el);
//
//		// CHECKBOX(array)
//		if (isArrayCheckbox(el)) {
//			name = name.slice(0,-2);
//			thisObj[name] = getInputValueOf(el);
//			return;
//		}
//
//		// CHECKBOX, RADIO UPDATE
//		if (isCheckbox(el) || isRadioButton(el)) {
//			var elements = getSameScopeInputElementsOf(el, null);
//			var i = elements.length;
//			while(i--) {
//				elements[i].checked = thisObj[name] === elements[i].value;
//			}
//
//			return;
//		}
//
//		// OPTION UPDATE
//		if (el.tagName === "OPTION") {
//			/// @TODO:
//			
//			return;
//		}
//	}
//}});





/// @visible
define("@visible", function() {
return {
	valueType: "expr",
	
	update: function(self, el, attr, script, value) {
		value ? show(el) : hide(el);
	}
}});


/// @hidden
define("@hidden", function() {
return {
	valueType: "expr",
	
	update: function(self, el, attr, script, value) {
		value ? hide(el) : show(el);
	}
}});


/// @enabled
define("@enabled", function() {
return {
	valueType: "expr",
	
	update: function(self, el, attr, script, value) {
		if (value) {
			el.removeAttribute("disabled");
			removeClass(el, "disabled");
			el.setAttribute("enabled", "enabled");
			addClass(el, "enabled");
		} else {
			el.removeAttribute("enabled");
			removeClass(el, "enabled");
			el.setAttribute("disabled", "disabled");
			addClass(el, "disabled");
		}
	}
}});




/// @css
define("@css", function() {
return {
	valueType: "string",
	
	init: function(self, el, attr, script) {
		self.initValue = el.style.cssText;
	},
	
	update: function(self, el, attr, script, value) {

		value = ";" + value + ";";

		/// opacity
		if (msie <= 8) {
			value = value.replace(regexp_opacity, function(a,b) {
				return ";filter: alpha(opacity=" + parseInt(parseFloat(b) * 100) + ");";
			});		
		}
		
		el.style.cssText = self.initValue + value;
	}
}});



/// @html
define("@html", function() {
return {
	valueType: "string",

	init: function(self, el, attr, script) {
		if (hasAttribute(el, "template")) {
			return false;
		}
	},
	
	update: function(self, el, attr, script, value) {
		el.innerHTML = value;
	}
}});


/// @img-src
define("@img-src", function() {
return {
	valueType: "string",

	update: function(self, el, attr, script, value) {
		el.src = "";
		var img = new Image();
		img.onload = function() {
			setTimeout(function() {
				el.src = img.src;
				
				// @FIXME: 여러가지 조건등을 고려해보라. 이미 styke,height가 있다면 SKIP 한다던가;;;
				el.style.height = "auto";
			})
		};
		img.src = value;
		
		
		
	}
}});


/// @width = style.width;
define("@width", function() {
return {
	valueType: "string",

	update: function(self, el, attr, script, value) {
		if (el.nodeName === "IMG") {
			el.width = value;
			return;
		}

		value = value == +value ? value + "px" : value;
		el.style.cssText += ("; width:" + value);
	}
}});


/// @height = style.height
define("@height", function() {
return {
	valueType: "string",
	
	update: function(self, el, attr, script, value) {
		if (el.nodeName === "IMG") {
			el.height = value;
			return;
		}
		
		value = value == +value ? value + "px" : value;
		el.style.cssText += ("; height:" + value);
	}
}});




/// @outlet
define("@outlet", function() {
return {
	valueType: "string",

	update: function(self, el, attr, script, value) {
		var thisObj = self.thisObj;
		thisObj[value] = el;
		return false;
	}
}});



define("@dragstart", function() {

function createHandler(el, type, script, self) {
	var pos = {};
	pos.isDragstart = false;
	pos.isDragging = false;

	var fn = {
		target: el,
		
		start: function(e) {
			pos.isDragstart = true;
			pos.pageX = pos.startX = e.changedTouches && e.changedTouches[0].pageX || e.pageX || 0;
			pos.pageY = pos.startY = e.changedTouches && e.changedTouches[0].pageY || e.pageY || 0;
			pos.isH = false;
			pos.isV = false;
			
			removeEvent(document, "mousemove", fn.move, true);
			removeEvent(document, "mouseup", fn.end, true);
			addEvent(document, "mousemove", fn.move, true);
			addEvent(document, "mouseup", fn.end, true);
		},
		
		move: function(e) {
			var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX || 0;
			var pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY || 0;
			pos.dx = pageX - pos.startX;
			pos.dy = pageY - pos.startY;
			pos.deltaX = pageX - pos.pageX;
			pos.deltaY = pageY - pos.pageY;
			if (pos.isDragstart) {
				pos.isV = Math.abs(pos.deltaY) > Math.abs(pos.deltaX);
				pos.isH = !pos.isV;
			}
			pos.isDragstart = false;
			pos.isDragging = true;

			if (type === "drag") {
				window.$event = extend(e, pos);
				$event.dragTarget = el;
				$eval(script, self.scope);
				window.$event = null;
			}
		},
		
		end: function(e) {
			removeEvent(document, "mousemove", fn.move, true);
			removeEvent(document, "mouseup", fn.end, true);

			if (pos.isDragging === false) return;

			if (type === "dragend") {
				window.$event = extend(e, pos);
				$event.dragTarget = el;
				$eval(script, self.scope);
				window.$event = null;
			}

			pos.isDragging = false;
			pos.isH = false;
			pos.isV = false;
			pos.isDragstart = false;
		}
	}
		
	addEvent(el, "mousedown", fn.start);
	return fn;
}

return {
	init: function(self, el, node, script) {
		createHandler(el, node.nodeName, script, self);
	}
}});

define("@drag", $cache("sources")["@dragstart"]);
define("@dragend", $cache("sources")["@dragstart"]);








define("@route", function() {
	var routes = [];

	addEvent(window, "hashchange", function(e) {
		e.preventDefault();
		
		var hash = location.hash.split("#!").pop();

		/// @FIXME: 성능 개선
		foreach(routes, function(route) {
			var length = hash.match(regexp_route);
			if (!length) {
				var result = (route["/"] || noop)();
				result = (route.hashchange || noop)(path, args, result);
				if (result !== false) $update(document);
				return;
			}
			length = length.length;
			var size = 1 << length;

			for(var i = 0; i < size; i++) {
				var bit = i.toString(2);
				var len = bit.length;
				var index = 0;
				var args = [];

				var path = hash.replace(regexp_route, function(a) {
					var bool = bit.charAt(len-length+index++) === "1";
					bool && args.push(a);
					return bool ? ":id" : a;
				});	
				
				if (route && typeof route[path] === "function") {
					var result = route[path].apply(route, args);
					result = (route.hashchange || noop)(path, args, result);
					if (result !== false) $update(document);
					return;
				}
			}
		});
	});
	

return {
	valueType: "expr",

	update: function(self, el, attr, script, value) {
		value && indexOf(routes, value) === -1 && routes.push(value);
		return false;
	}
}});






/// @FIXME: .. --- Function 
// 1) prototype에 추가 하는건 좀 별로지만 이게 최선이지 이제 마음 흔들리지 말자.
// 2) 이름만 어떻게 고민좀 해보자. 후보) newInstance() // 너무 길어 ㅠ // create // 왠지 겹칠듯.

/// Class
function createController(func, self) {
	self = self || {};
	var args = [self];

	/// function(self, Controller1, Controller2, ...) 으로 부터 컨트롤을 가져옴.
	var source = _fn_toString.call(func);	
	var controllers = regexp_args.exec(source)[0];
	controllers = controllers.slice(1,-1);
	controllers = controllers.split(regexp_comma).slice(1);

	foreach(controllers, function(controller) {
		var c = window[controller]; /// @FIXME ...
		if (c === undefined) { throw new ReferenceError(controller + " is not defined"); }
		if (typeof c !== "function") { throw new TypeError(controller + " is not function"); }

		args.push(createController(c, self));
	});

	return func.apply(self, args);
}

function newInstance(fn) {
	var self = {};
	extend(self, createController(fn, self));
	typeof self.init === "function" && self.init.apply(self, arguments);
	return self;
}

Function.prototype.$new = function() { return newInstance(this); };


/// publish jpx
window.use = function(name){ return require(name); };
$cache("modules")['foreach'] = foreach;
$cache("modules")['makeArray'] = makeArray;
$cache("modules")['define'] = define;





/// do start! ㅋ 여기 소스 무지하게 (혼)잡스럽네.
var style = document.createElement("style");
var cssText = "html,body{visibility: hidden !important;}";
style.setAttribute("type", "text/css");
style.styleSheet ? (style.styleSheet.cssText = cssText) : (style.innerHTML = cssText);
document.getElementsByTagName("head")[0].appendChild(style);

if (document.readyState !== "loading") return start();
addEvent(document, "readystatechange", start);

function start() {
	if (document.readyState === "loading") return;
	if (!document.body) return setTimeout(start); // IE

	// Remove ready handler
	removeEvent(document, "readystatechange", start);





	// Support HTML5 UnknownElements for IE 8.0-
//	var div = document.createElement("div");
//	div.innerHTML = "<xyz></xyz>";
//	if (div.childNodes.length !== 1) {
//		foreach(document.getElementsByTagName("*"), function(el) {
//			if (el.nodeName.charAt(0) == "/") {
//				document.createElement(el.nodeName.substring(1));
//			}
//		});
//		document.body.innerHTML = document.body.innerHTML;
//	}


	///
	
//	try {
		var scope = window.ViewController ? newInstance(window.ViewController) : {};
		createData(document.body);
		$compile(document, [{}, scope]);
		document.update = function(el) { $update(el || document); }

		if (typeof scope.ready === "function") {
			scope.ready();
		}

		style.parentNode && style.parentNode.removeChild(style);

//		
//		document.update(); /// 이거 고민중.. 굳이...

//	} catch(e) {};


}






/// jQuery mini
function once_handler(node, type, fn) {
	var handler = function(e) {
		removeEvent(node, type, handler);
		fn.call(this, e);
	}
	return handler;
}


function querySelectorAll(el, sel) {
	return document.querySelectorAll.call(el, sel);
}

function jQuery(mixed) {
	return new $jQuery().add(mixed);
}

function $jQuery(){}

$jQuery.prototype = jQuery.fn = {

	jquery: "1.0.0 mini",

	length: 0,
	
	add: function(mixed) {
	
		var type, i, len;
		
		if (mixed === null || mixed === undefined) { return this; }
		if (isElement(mixed) === true || mixed === window) { this[this.length++] = mixed; return this; }

		type = typeof mixed;
		if (type === "object" && typeof mixed.length === "number") {
			for(i = 0, len = mixed.length; i < len; i++) this.add(mixed[i]);
			return this;
		}
		

		if (type === "function") {
			/// @TODO: DOM ready
			return this;
		}
		
		if (type === "string" && mixed.charAt(0) !== "<") { return this.add(querySelectorAll(document, mixed)); }
		
		var el = document.createElement("html");
		el.innerHTML = mixed;
		return this.add(el.childNodes);		
	},
	
	addClass: function(value) {
		foreach(this, function(node) {
			addClass(node, value);
		});
		return this;
	},
	
	attr: function(name, value) {
		if (arguments.length === 1) { return this[0] && this[0].getAttribute && this[0].getAttribute(name); }
		foreach(this, function(el) { el.setAttribute(name, value); });
		return this;
	},
	
	bind: function(type, fn) {
		var self = this;
		foreach(type.split(/\s+/), function(type) {
			foreach(self, function(node) {
				addEvent(node, type, fn);
			})
		});
		return this;
	},
	
	/// @FIXME: ... 전부가 아니라 가장 가까운걸 골라야 한다!!!
	closest: function(sel) {
		var self = this;
		var ret = jQuery();
		foreach(querySelectorAll(document, sel), function(parent) {
			foreach(self, function(node) {
				parent.contains(node) && ret.add(parent);
			});
		});
		return ret;
	},
	
	css: function(name, value) {
		foreach(this, function(node) {
			node.style[name] = value;
		})
		return this;
	},
	
	each: function(fn) {
		for(var i = 0, len = this.length; i < len; i++) {
			if (fn.call(this[i], i, this[i]) === false) return this;
		}
		return this;
	},
	
	eq: function(index) {
		return $(this[index]);
	},
	
	find: function(sel) {
		var ret = jQuery();
		foreach(this, function(node) {
			ret.add(node.querySelectorAll(sel));
		})
		return ret;
	},
	
	on: function(type, selector, fn) {
		var self = this;
		foreach(type.split(/\s+/), function(type) {
			foreach(self, function(parent) {
				addEvent(document, type, function(e) {
					foreach($(e.target).closest(selector), function(node) {
						if (parent.contains(node) === false) return;						
						fn.call(node, e);
					});
				}, true);
			});
		});
	},
	
	one: function(type, fn) {
		var self = this;
		foreach(type.split(/\s+/), function(type) {
			foreach(self, function(node) {
				addEvent(node, type, once_handler(node, type, fn));
			})
		});
		return this;
	},
	
	off: function(type, selector, fn) {
		// @TODO:	
	},
	
	show: function() {
		foreach(this, function(node) {
			show(node);
		})
		return this;
	},
	
	hide: function() {
		foreach(this, function(node) {
			hide(node);
		})
		return this;
	},
	
	removeClass: function(value) {
		foreach(this, function(node) {
			removeClass(node, value);
		})
		return this;
	},
	
	trigger: function(type, props) {
		foreach(this, function(node) {
			dispatchEvent(node, type, props);
		})
		return this;
	}
}


jQuery.extend = extend;




/// @FIXME: ajax를 좀더 잘 모듈화 시킬 것~
var ajax_options = {
	async: true,
	data: {},
	dataType: "html",
	type: "GET",
	cache: true,
	success: function(){}
};


jQuery.ajax = function() {

	var r20 = /%20/g;
	
	function makeParams(param) {
		var result = [];

		var add = function(key, value) {
			var type = typeof value;
			
			if (type === "function") {
				return;
			}
			
			if (type === "array") {
				key = key+"[]";
				foreach(value, function(index, value) {
					add(key, value);
				});
				
				return;
			}
			
			if (type === "object") {
				for (var prop in value) {
					value[prop] = value[prop];
				}				
				value = JSON.stringify(value);
			}			

			result.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
		}


		if (param !== null && typeof param === "object" && !isArray(param)) {
			foreach(param, function(value, key) {
				add(key, value);
			});
		}
		
		return result.join("&").replace(r20, "+");
	}


	return function(options) {
		options = extend({}, ajax_options, options);
	
		var done = false;
		var http = new XMLHttpRequest();
	
		http.onreadystatechange = function(e) {
	
			if (http.readyState == 4 && http.status == 200) {
				if (options.dataType === "script") {
					eval.call(window, this.responseText);
				}
				options.success.call(this, this.responseText);
				return;
			}
	/*
			if (http.readyState == 4 && http.status == 500) {
				return func.call(this, this.responseText);
			}
	*/
		}
		

		var params = makeParams(options.data);
		var url = options.url; 		
		if (options.cache === false) {
			url = options.url + "?" + (+new Date);
		}	
			
		http.open(options.type, options.url, options.async);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		http.send(params);
		
		return http;	
	}
}();


jQuery.post = function(url, params, func) {

	return $.ajax({
		type: "POST",
		url: url,
		data: params,
		success: func
	});
}

jQuery.get = function(url, params, func) {

	return $.ajax({
		type: "GET",
		url: url,
		data: params,
		success: func
	});
}





window.$ = jQuery;

























////////////////////////////////////////////////////////////////////////////////////////////

/* Number format */
Number.format = function(number, decimals, dec_point, thousands_sep) {
	if (!number) {
		return 0;
	}
		
	// Strip all characters but numerical ones.
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
	prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
	sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
	dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
	s = '',
	toFixedFix = function (n, prec) {
		var k = Math.pow(10, prec);
		return '' + Math.round(n * k) / k;
	};

	// Fix for IE parseFloat(0.55).toFixed(0) = 0;
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}

	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	
	return s.join(dec);
}

Number.signedFormat = function(number, decimals, dec_point, thousands_sep) {
	if (!number) {
		return "0";
	}

	var prefix = number > 0 ? "+" : "";	
	return prefix + window.number_format(number, decimals, dec_point, thousands_sep);
}




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

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMisTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
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
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				i:    M,
				ii:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
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
}

Date.format = function(date, mask, utc) {
	return dateFormat(Date.parse(date), mask, utc);
}






/// CROSS-BROWSING TOUCH DEVICE
if ("ontouchstart" in document) {
	var _addEvent = addEvent;
	var _removeEvent = removeEvent;
	var $touchTaget = null;
	var $clickFired = false;
	var pageX = 0;
	var pageY = 0;
	
	document.addEventListener("touchstart", function(e) {
		e.stopPropagation();
		
		$touchTaget = e.target;
		var touch = e.changedTouches[0];
		pageX = touch.pageX;
		pageY = touch.pageY;

	}, false);

	document.addEventListener("touchmove", function(e) {
		e.stopPropagation();
		if ($touchTaget === null) return;

		var touch = e.changedTouches[0];
		var dx = pageX - touch.pageX;
		var dy = pageY - touch.pageY;
		pageX = touch.pageX;
		pageY = touch.pageY;

//		/// @TODO: 현재는 세로 스크롤만 체크하고 있지만 touchstart에서 getStyle등을 이용 hscroll, vscroll을 구분 적용해야된다.
		if (Math.abs(dy) > Math.abs(dx)) {
			$touchTaget = null;
			return;
		}
	}, false);

	addEvent = function(el, type, fn, flag) {
		if (type === "mousedown") { type = "touchstart"; }
		else if (type === "mousemove") { type = "touchmove"; }
		else if (type === "mouseup") { type = "touchend"; }
		
		else if (type === "click") {
			fn[$key] = function(e) {
				e.stopPropagation();
				
				if ($clickFired === true || $touchTaget === null || el.contains($touchTaget) === false) {
					return;
				}

				$touchTaget = null;
				$clickFired = true;
				fn.call(this, e);
				$clickFired = false;
			}

			_addEvent(el, "touchend", fn[$key], flag);
			return;
		}

		_addEvent(el, type, fn, flag);
	};
	
	removeEvent = function(el, type, fn, flag) {
		if (type === "mousedown") { type = "touchstart"; }
		else if (type === "mousemove") { type = "touchmove"; }
		else if (type === "mouseup") { type = "touchend"; }
		else if (type === "click") {
			_removeEvent(el, "touchend", fn[$key], flag);
			return;
		}

		_removeEvent(el, type, fn, flag);
	}
	
}



/// $localStorage
function get_localStorage(key) {
	return JSON.parse(localStorage.getItem(key));	
}

function set_localStorage(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function $localStorage(key, value) {
	if (arguments.length === 1) return get_localStorage(key);
	if (arguments.length === 2) return set_localStorage(key, value);
}

window.$localStorage = $localStorage;

}(window,document));







