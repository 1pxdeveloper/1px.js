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
	_cache = {};

var	regexp_$eval = /[_a-zA-Z\u0080-\uffff]+[_a-zA-Z0-9\u0080-\uffff]*/g,
	regexp_$parse = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[{}'"]|[^'"{}]+/g,
	regexp_string = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
	regexp_uppercase = /[A-Z]/g,
	regexp_brace = /[{}]/g,
	regexp_trim = /^\s+|\s+$/g,
	regexp_nonwhitespace = /\S+/g,
	regexp_whitespace = /\s+/g,
	regexp_whitespace_only = /^\s+$/g,
	regexp_route = /[^\/#!]+$/g,
	regexp_args = /\([^)]*\)/m,
	regexp_comma = /\s*,\s*/,
	regexp_opacity = /;\s*opacity\s*:([^;]+);/;

var isArray = Array.isArray = Array.isArray || function(obj) { return _toString.call(obj) === "[object Array]"; }
var now = Date.now = Date.now || function() { return new Date().getTime(); }


var ELEMENT_NODE = 1,
	ATTR_NODE = 2,
	TEXT_NODE = 3,
	DOCUMENT_NODE = 9;



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
	while(i-- !== 0) r[i] = arr[i];
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
function traversal(el, fn, fn2, data) {

	var done;
	var result;
	var stack = [];
	var dones = [el];
	var next = el.childNodes && el.childNodes[0];
	var nextSibling;
	
	if (fn(el, data) === false) {
		return;
	}
	
	fn2 = fn2 || noop;
	
	while(next) {
		dones.push(next);
		nextSibling = next.nextSibling;
		result = fn(next, data);
		nextSibling = next.nextSibling || nextSibling;
		nextSibling && stack.push(nextSibling);

		if (next.tagName === "IFRAME" && hasAttribute(next, "template") && next.contentWindow) {
			next = next.contentWindow.document;
		}

		next = next.childNodes && next.childNodes[0];
		if (!next || result === false) {
			next = stack.pop();

			while(done = dones.pop()) {
				var hasNextSibling = done.nextSibling;
				fn2(done, data);

				if (hasNextSibling) {
					break;
				}
			}
		}
	}

	while(done = dones.pop()) {
		fn2(done, data);
	}
}

function isElement(el) {
	return el && el.nodeName !== undefined;
}

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
	return el.hasAttribute(attr);
}

function styleOf(el) {
	return document.defaultView.getComputedStyle(el) || el.style || {};
}

function makeCSSValue(type, value) {
	if (type !== "opacity" 
		&& type !== "line-height"
		&& type !== "z-index"
		&& typeof value === "number") {
		return value + "px";
	}

	return value;
}

function makeCSSText(obj) {
	var ret = ";";
	foreach(obj, function(value, key) {
		key = key.replace(regexp_uppercase, function(a) {
			return "-" + a.toLowerCase();
		});
	
		ret += key + ":" + makeCSSValue(key, value) + ";";
	});
	return ret;
}

function show(el) {
	el.style.display = "";

	if (styleOf(el)["display"] === "none") {

//		/// @TODO: 모듈화 할것!! -> 그리고 memoize도 하고.. 좀더 아이디어를 내볼것..
//		var iframe = document.createElement("iframe");
//		iframe.style.display = "none";
//		document.body.appendChild(iframe);
//		var node = document.createElement(el.nodeName);
//		iframe.contentWindow.document.body.appendChild(node);
//		
//		var a = styleOf(node)["display"];
//		document.body.removeChild(iframe);
		
		var a = "block";
				
		el.style.cssText += (";" + "display:"+a+" !important;");
	}
}

function hide(el) {
	el.style.cssText += (";" + "display:none !important;");
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
	
	for(var name in result) {
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





/// Data
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






/// JPX CORE
function $eval(script, scope) {
	if (script === '') return '';
	if (script === 'true') return true;
	if (script === 'false') return false;
	if (script === 'undefined') return undefined;
	if (script === 'null') return null;
	
	if (!scope || !scope.length) {
		return;
	}

	var cache = $cache("eval"),
		thisObj = scope[scope.length-1],
		length = scope.length,
		hash = length + script,
		code = "",
		fn; 

	try {	
		if (cache[hash] === undefined) {
			for (var i = 0, len = length + 1; i < len; i++) {
				code += ("with(arguments["+i+"])");
			}
			code += ("{return("+script+");}");
			cache[hash] = new Function(code);
		}

		fn = cache[hash] || noop;
		return fn.apply(thisObj, scope.concat(scope.local || {}));
		
	} catch(e) {
		console.log(e.stack, e, e.message, script);
//		console.trace();
	}
}
$eval[0] = "with(arguments[0])";
$eval[1] = "with(arguments[0])with(arguments[1])";
$eval[2] = "with(arguments[0])with(arguments[1])with(arguments[2])";
$eval[3] = "with(arguments[0])with(arguments[1])with(arguments[2])with(arguments[3])";
$eval[4] = "with(arguments[0])with(arguments[1])with(arguments[2])with(arguments[3])with(arguments[4])";




function $parse(script, scope) {
	script = ""+script;
	if (script.indexOf("{") === -1) return script;

	var cache = $cache("parse"),
		snippet = cache[script] = cache[script] || $parse_expr(script),
		ret = "";

	for (var i = 0; i < snippet.length; i++) {
		var text = snippet[i];
		if (i % 2 === 1) {
			text = $eval(text.slice(1,-1), scope);
			if (text === null || text === undefined) {
				text = "";
			};
		}
		ret += text;
	}
	
	return ret;	
}

function $parse_expr(script) {

	var result = [];
	
	var index;
	var removed_string;
	var num_brace;
	var match;
	
	while(script.length) {

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
		removed_string = script.replace(regexp_string, function(a) { return Math.pow(10, a.length-1); });

		while(match = regexp_brace.exec(removed_string)) {
			num_brace += (match[0] === "{" ? 1 : -1);
			if (num_brace === 0) {
				result.push(script.substring(0, match.index+1));
				script = script.substring(match.index+1);
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
	scope && (createData(el).scope = scope);
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
	if (a === "repeat") return 50;
	if (a === "init") return 30;
	if (a === "var") return 20;
	if (a === "css") return -10;
	if (a === "background-image") return -15;
	if (a === "visible") return -20;
	if (a === "hidden") return -20;
	if (a === "with") return -30;
	if (a === "name") return -40;
	if (a === "template") return -50;

	return 0;
}

function $by_attr_priority(a, b) {
	return $attr_priority(b.nodeName) - $attr_priority(a.nodeName);
}

function $compile_process_element(el) {
	var nodeName = el.nodeName;

	if (nodeName === "SCRIPT" || nodeName === "HEAD" || nodeName === "STYLE") {
		return false;
	}
	
	if (hasAttribute(el, "sandbox")) {
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
	
	var attributes = attributesOf(el).sort($by_attr_priority);
	if (attributes.length === 0) {
		return;
	}
	
	var data = createData(el);
	var bindings = (data.bindings = data.bindings || []);		

	foreach(attributes, function(attr, index) {
		var nodeName = attr.nodeName;
		var script = attr.nodeValue;

		if (bindings[nodeName]) {
			return;
		}

		// Handler - Custom
		var handler = require("@"+nodeName);
		if (handler) {
			return $createBinding(bindings, el, attr, handler);
		}
	
		// Handler - Boolean Attribute
		if (script && isBooleanAttr(nodeName) === true) {
			return $createBinding(bindings, el, attr, require("~boolean"));
		}

		// Handler - Event
		if (("on"+nodeName) in document || ("on"+nodeName) in el || nodeName.substring(0,3) === "on-") {
			return $createBinding(bindings, el, attr, require("~event"));
		}

		// Handler - NodeValue
		if (script.indexOf("{") !== -1) {
			return $createBinding(bindings, el, attr, require("~nodeValue"));
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
			var bindings = createData(textNode).bindings = [];
			$createBinding(bindings, el.parentNode, textNode, require("~nodeValue"));
		}	
	});
	
	el.parentNode.replaceChild(frag, el);
}


function $createBinding(bindings, el, node, handler) {

	var binding = {
		node: node,
		script: node.nodeValue,
		handler: handler
	};

	bindings.push(binding);
	bindings[node.nodeName] = true;
	
	handler.init && handler.init(binding, el, node, node.nodeValue);

	handler.value = handler.value || "parse";
	if (typeof handler.value === "string") {
		handler.value = $createBinding[handler.value];
	}
}


/// @FIXME: 이거 이름좀 확실하게 바꾸자...
$createBinding["parse"] = function(self, el, attr, script) {
	return $parse(script, self.scope);
};

$createBinding["ident"] = function(self, el, attr, script) {
	return script;
};

$createBinding["expr"] = function(self, el, attr, script) {
	return $eval(script, self.scope);
};

$createBinding["expr-nocache"] = function(self, el, attr, script) {
	delete self.value;
	return $eval(script, self.scope);
};

$createBinding["boolean"] = function(self, el, attr, script) {
	return !!$eval(script, self.scope);
};



/// update
function $update(el) {
	var t = now();
	
	var data = readData(el) || {};
	var $scope = data.scope || {};
	$scope.local = {};
	traversal(el, $update_process, $update_done, $scope);
	
	console.log(now() - t);
}

function $update_process(el, $scope) {
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
		binding.thisObj = scope[scope.length-1];

		var handler = binding.handler;
		if (!handler.update) {
			return;
		}

		var node = 	binding.node;
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
	var data = readData(el);
	if (data === undefined || data.bindings === undefined) {
		return;
	}

	foreach(data.bindings.slice().reverse(), function(binding, index) {

		var handler = binding.handler;		
		if (!handler.done) {
			return;
		}
		
		var scope = makeArray($scope);
		scope.local = $scope.local || {};
		scope.local.$root = $scope[0];
		scope.local.el = el;
		
		binding.$scope = $scope;
		binding.scope = scope;
		binding.thisObj = scope[scope.length-1];

		var node = 	binding.node;
		var script = binding.script;
		var value = binding.value;
		handler.done(binding, el, node, value);
	});	
}



/// Directive
function __nodeValue() {
return {
	update: function(self, el, node, value) {
		node.nodeValue = value;
	}
}}


function __boolean() {
return {
	value: "boolean",
		
	update: function(self, el, node, value) {		
		value ? el.setAttribute(node.nodeName, "") : el.removeAttribute(node.nodeName);
		value ? addClass(el, node.nodeName) : removeClass(el, node.nodeName);
	}
}}


function __event() {
return {
	init: function(self, el, node, script) {
		var name = node.nodeName;
		var type = name.substring(0,3) === "on-" ? name.substring(3) : name;

		addEvent(el, type, function(e) {

//			if (isclosest(el, ".disabled, *[disabled]")) {
//				e.preventDefault();
//				e.stopPropagation();	
//				return false;		
//			}


			if (type === "submit" && !el.getAttribute("action")) {
				e.preventDefault();
				e.stopPropagation();			
			}

			window.$event = e;
			var result = $eval(script, self.scope);
//			window.$event = undefined; // @FIXME: dummy event
			
			if (result === false) {
				return false;
			}
			
			$update(document);
		});
	}
}}


function __init() {
return {
	value: "expr",
	
	update: function(self) {
		return false;
	}
}}


function __ready() {
return {
	value: "ident",

	update: function(self, el, node, value) {
		return false;
	},
	
	done: function(self, el, node, value) {
		$eval(value, self.scope);
		return false;
	}
}}


function __controller() {
return {
	init: function(self, el, node, script) {
		self.script = script.replace("(", ".$new(");
	},
	
	value: function(self, el, node, script) {
		if (!self.controller) {
			self.controller = $eval(script, self.scope);
		}
		delete self.value;
		return self.controller;
	},

	update: function(self, el, node, value) {
		self.$scope.push(value);
	},
	
	done: function(self, el, node, value) {
		self.$scope.pop();
	}
}}


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
		
		self.pool = [];
		self.container = [];
		self.rows = rows;
		self.row = row;
		self.index = index;
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
		
		if (self.container.length > self.collection.length) {
			for (var i = self.collection.length, len = self.container.length; i < len; i++) {
				var node = self.container[i];
//				self.pool.push(node);
				node.parentNode.removeChild(node);
			}
			self.container.length = self.collection.length;
			return;
		}

		var frag = document.createDocumentFragment();
		for (var i = self.container.length, len = self.collection.length; i < len; i++) {
			var repeatNode = self.pool.pop() || self.repeatNode.cloneNode(true);
			var data = createData(repeatNode);
			if (!data.source) {
				data.source = self;
				$compile(repeatNode);
			}
			data.index = i;
			self.container.push(repeatNode);
			frag.appendChild(repeatNode);
		}
		el.parentNode.insertBefore(frag, self.placeholder);
	}	
}

return {
	init: function(self, el, node, script) {
		if (script === "#") {			
			el.removeAttribute("repeat");
			return;
		}
		
		var textNode = document.createTextNode("");
		el.parentNode.insertBefore(textNode, el);
		el.parentNode.insertBefore(document.createTextNode(""), el);

		var bindings = createData(textNode).bindings = [];
		$createBinding(bindings, textNode, node, repeatHandler);
		
		el.innerHTML = "";
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
		var collection = source.collection;

		self.old_local = self.$scope.local;
		self.$scope.local = extend({}, self.$scope.local);
		if (row) self.$scope.local[row] = source.collection[value.index];
		if (index) self.$scope.local[index] = value.index;
	},
	
	done: function(self, el, attr, value) {
		self.$scope.local = self.old_local;
	}
}}



function __name() {
var $emitter;

return {
	init: function(self, el, attr, script) {
		
		self.initValue = el.value;
		
		bind(el, "input", "change", function(e) {
			var thisObj = self.thisObj;
			var name = el.name;
			var value = el.value;
			
			if (isCheckbox(el)) {
				value = !!el.checked;
			}

//			else if (isRadioButton(el)) {
//				value = !!el.checked;
//			}

			if (thisObj[name] === value) {
				return;
			}
			
			self.value = thisObj[name] = value;
			$emitter = el;
			$update(document);
			$emitter = null;
		});

		if (msie <= 8) {
			bind(el, "keydown", "cut", "paste", function(e) {
				setTimeout(function(){ dispatchEvent(el, "change"); });
			});
		}
	},
	
	value: function(self, el, attr, script) {
		self.hasExpr && (el.name = $parse(script, self.scope));
		var name = isArrayCheckbox(el) ? el.name.slice(0,-2) : el.name;

		return self.thisObj[name];
	},
	
	update: function(self, el, node, value) {
		if ($emitter === el) return;
		
		var thisObj = self.thisObj;
		var name = el.name;
		var value = el.value;
		
		if (isRadioButton(el)) {
			if (el.checked && thisObj[name] === undefined) {
				thisObj[name] = el.value;
				/// @TODO: update~ later /// update중 update콜이 나오면 flag를 세워두었다가 다시 업데이트~ 대신 무한 업데이트 콜이 뜨는 지 확인은 필~
				return;
			}

			el.checked = thisObj[name] === value;
			return;
		}

		if (isCheckbox(el)) {
			el.checked = !!thisObj[name];
			return;
		}
	
		if (!thisObj.hasOwnProperty(name)) {
			thisObj[name] = self.initValue;
		}

		value = thisObj[name];
		el.value = value;
	}
}}

function __with() {
return {
	value: "expr-nocache",

	update: function(self, el, node, value) {
		if (typeof value !== "object") return;
		self.$scope.push(value);
	},
	
	done: function(self, el, node, value) {
		if (typeof value !== "object") return;
		self.$scope.pop();
	}
}}



function __local() {
return {
	value: "expr-nocache",

	update: function(self, el, node, value) {
		self.old_local = self.$scope.local;
		self.$scope.local = extend({}, self.$scope.local, value);
	},
	
	done: function(self, el, node, value) {
		self.$scope.local = self.old_local;
	}
}}




function __template() {
return {
	init: function(self, el, node, value) {

		// slot
		var slots = {};
		traversal(el, function(node) {
			var slot = "";
			if (node.nodeType === ELEMENT_NODE && (slot = node.getAttribute("slot"))) {
				node.removeAttribute("slot");
				slots["@"+slot] = node.cloneNode(true);
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
		el.appendChild(template);

		self.old_slots = self.$scope.slots;
		self.$scope.slots = self.slots;
	},
	
	done: function(self) {
		self.$scope.slots = self.old_slots;
	}
}}


function __visible() {
return {
	value: "boolean",
	
	update: function(self, el, node, value) {
		value ? show(el) : hide(el);
	}
}}


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
		} else {
			el.removeAttribute("enabled");
			removeClass(el, "enabled");
			el.setAttribute("disabled", "disabled");
			addClass(el, "disabled");
		}
	}
}}


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
}}


function __css() {
return {
	init: function(self, el) {
		self.initValue = el.style.cssText + ";";	
	},
	
	update: function(self, el, node, value) {
		el.style.cssText = self.initValue + value + ";";
	}
}}


function __img_src() {
return {
	init: function(self, el, node, script, value) {
		el.src = "/img/blank.gif";
	},
	
	update: function(self, el, node, value) {
		if (!value) {
			el.src = "/img/blank.gif";
			return;
		}
//		el.src = "/img/blank.gif";
//		lazyload(el, value);
		el.src = value;
	}
}}


define("~nodeValue", __nodeValue);
define("~boolean", __boolean);
define("~event", __event);
define("@init", __init);
define("@ready", __ready);
define("@repeat", __repeat);
define("@controller", __controller);
define("@name", __name);
define("@with", __with);
define("@local", __local);
define("@template", __template);
define("@css", __css);
define("@visible", __visible);
//define("@if", __if);
define("@enabled", __enabled);
define("@html", __html);
define("@img-src", __img_src);





/// Class
function $createController(self, fn) {

	/// function(self, Controller1, Controller2, ...) 으로 부터 컨트롤을 가져옴.
	var args = [self];
	var source = fn.toString();
	var controllers = regexp_args.exec(source)[0];
	controllers = controllers.slice(1,-1);
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
	var self = {};
	extend(self, $createController(self, fn));

	if (typeof self.init === "function") {
		self.init.apply(self, args);
	}
	return self;
}

Function.prototype.$new = function() { return $newInstance(this, arguments); };




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
		if (type === "mousedown") { type = "touchstart"; }
		else if (type === "mousemove") { type = "touchmove"; }
		else if (type === "mouseup") { type = "touchend"; }
		
		else if (type === "click") {
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




/// --- jQuery
function $jQuery(){}

function jQuery(selector, context) {
	return new $jQuery().add(selector, context);
}

function querySelectorAll(el, selector) {
	return el.querySelectorAll(selector);
}

function makeFragment() {
	var frag = document.createDocumentFragment();
	foreach(jQuery(arguments), function(node) {
		frag.appendChild(node);
	});
	return frag;
}

$jQuery.prototype = jQuery.prototype = jQuery.fn = {

	jquery: "mini 1.0.0",
	
	constructor: jQuery,
	
	length: 0,
	
	add: function(mixed, context) {
	
		/// null, undefined
		if (mixed === null || mixed === undefined) { return this; }

		/// element
		if (isElement(mixed) === true || mixed === window) {
			this[this.length++] = mixed;
			return this;
		}

		/// "body"
		if (mixed === "body") {
			return this.add(document.body);
		}


		var self = this;
		var type = typeof mixed;

		/// elements, array, object, jQuery object
		if (type === "object" && typeof mixed.length === "number") {
			foreach(mixed, function(content) {
				self.add(content);
			});
			return self;
		}
		
		/// selector
		if (type === "string" && mixed.charAt(0) !== "<") {
			return this.add(querySelectorAll(context || document, mixed));
		}
		
		/// html
		if (type === "string" && mixed.charAt(0) === "<") {
			var el = document.createElement("body");
			el.innerHTML = mixed;
			return this.add(el.childNodes);
		}
		
		/// function
		if (type === "function") {
			/// @TODO: DOM ready
			return this;
		}

		return this;
	},

//	addBack: function() {
//
//	},
	
	
	addClass: function(className) {
		return foreach(this, function(el) {
			addClass(el, className);
		});
	},
	
	attr: function(attributeName, value) {
		if (arguments.length === 1) {
			return this[0] ? this[0].getAttribute(attributeName) : null;
		}
		
		if (arguments.length === 2) {
			return foreach(this, function(el) {
				el.setAttribute(attributeName, value);
			});
		}
	},
	
	after: function(content) {
		var args = arguments;
		return foreach(this, function(el) {
			var frag = makeFragment(args);
			el.nextSibling
				? el.parentNode.insertBefore(frag, el.nextSibling)
				: el.parentNode.appendChild(frag);
		});
	},

	append: function() {
		var args = arguments;
		return foreach(this, function(el) {
			el.appendChild(makeFragment(args));
		});
	},

	appendTo: function(target) {
		jQuery(target).append(this);
		return this;
	},
	
	before: function() {
		var args = arguments;
		return foreach(this, function(el) {
			el.parentNode.insertBefore(makeFragment(args), el);			
		});
	},
	
	bind: function(eventType, handler) {
		return foreach(this, function(el) {
			addEvent(el, eventType, handler);
		});
	},
	
	children: function() {
		var result = jQuery();
		foreach(this, function(el) {
			foreach(el.childNodes, function(node) {
				node.nodeType === 1 && result.add(node);
			});
		});
		return result;
	},
	
	clone: function(/* [withDataAndEvents] */) { /// @TODO:  [withDataAndEvents]
		var result = jQuery();
		foreach(this, function(el) {
			result.add(el.cloneNode(true));
		});
		return result;
	},
	
	closest: function(tagName) {
		tagName = tagName.toUpperCase();
		
		var result = jQuery();
		foreach(this, function(el) {
			while(el && el.tagName !== tagName) {
				el = el.parentNode;
			}
			result.add(el);
		});
		return result;
	},
	
	contents: function() {
		var result = jQuery();
		foreach(this, function(el) {
			result.add(el.childNodes);
		});
		return result;
	},
	
	css: function(propertyName, value) {
		if (arguments.length === 1) {
			if (typeof propertyName === "string") {
				/// @TODO
				return;
			}

			if (typeof propertyName === "object") {
				var cssText = makeCSSText(propertyName);
				return foreach(this, function(el) {
					el.style.cssText += ";" + cssText;
				});
			}
		}
		
		return foreach(this, function(el) {
			el.style[propertyName] = makeCSSValue(propertyName, value);
		});
	},
	
	click: function(event) {
		return foreach(this, function(el) {
			el.click(event);
		});
	},
	
	data: function(key, value) {
	
	},
	
	each: function(fn) {
		for (var i = 0, len = this.length; i < len; i++) {
			if (fn.call(this[i], i, this[i]) === false) break;
		}
		return this;
	},
	
	empty: function() {
		return foreach(this, function(el) {
			el.innerHTML = "";
		});
	},

	eq: function(index) {
		return jQuery(this[index < 0 ? this.length + index : index]);
	},
	
	filter: function() {
		// @TODO:
	},
		
	find: function(sel) {
		var ret = jQuery();
		foreach(this, function(node) {
			ret.add(querySelectorAll(node, sel));
		})
		return ret;
	},
	
	first: function() {
		return this.eq(0);
	},
	
	focus: function() {
		foreach(this, function(node) {
			node.focus && node.focus();
		})
	},
	
	get: function(index) {
		return this[index];
	},
	
	has: function() {
		/// @TODO:
	},
	
	hasClass: function(className) {
		return !!search(this, function(el) {			
			return hasClass(el, className);
		});
	},
	
	height: function() {
		/// @TODO:
	},
	
	hide: function() {
		return foreach(this, function(el) {
			hide(el);
		});
	},
	
	html: function(htmlString) {
		if (arguments.length === 0) {
			return this[0] ? this[0].innerHTML || "" : "";
		}
		
		return foreach(this, function(el) {
			el.innerHTML = htmlString;
		});
	},

	index: function(target) {
		target = jQuery(target)[0];
		return indexOf(this, target);
	},
	
	innerHeight: function() {
	
	},
	
	innerWidth: function() {
	
	},
	
	insertAfter: function(target) {
		jQuery(target).after(this);
		return this;
	},

	insertBefore: function(target) {
		jQuery(target).before(this);
		return this;
	},
	
	is: function() {
		/// @TODO:
	},
	
	last: function() {
		return this.eq(-1);
	},
	
	map: function() {
		/// @TODO:
	},
	
	next: function() {
		/// @TODO:
	},
	
	nextAll: function() {
		/// @TODO:
	},

	nextUntil: function() {
		/// @TODO:
	},
	
	not: function() {
		/// @TODO:	
	},
	
	off: function() {
		/// @TODO:
	},
	
	offset: function() {
		/// @TODO:
	},

	offsetParent: function() {
		/// @TODO:
	},
	
	on: function() {
		/// @TODO:	
	},
	
	one: function() {
		/// @TODO:
	},
	
	outerHeight: function() {
	
	},
	
	outerWidth: function() {
	
	},
	
	parent: function() {
		var result = jQuery();
		foreach(this, function(el) {
			result.add(el.parentNode);
		});
		return result;
	},
	
	parents: function() {
		var result = jQuery();
		foreach(this, function(el) {
			while(el.parentNode && el.parentNode.nodeType !== 9) {
				result.add(el.parentNode);
				el = el.parentNode;
			}
		});
		return result;
	},
	
	parentsUntil: function() {
		/// @TODO:
	},
	
	position: function() {
		if (this[0] === undefined) return {top:0, left:0};
		return {top: this[0].offsetTop, left: this[0].offsetLeft};
	},

	prepend: function() {
		var args = arguments;
		return foreach(this, function(el) {
			var frag = makeFragment(args);
			el.childNodes.length === 0 ? el.appendChild(frag) : el.insertBefore(frag, el.childNodes[0]);
		});
	},
	
	prependTo: function(target) {
		jQuery(target).prepend(this);
		return this;	
	},
	
	prop: function(propertyName, value) {
		if (arguments.length === 1) {
			return this[0] ? this[0][propertyName] : undefined;
		}
		
		if (arguments.length === 2) {
			return foreach(this, function(el) {
				el[propertyName] = value;
			});
		}
	},
	
	remove: function() {
		return foreach(this, function(el) {
			el.parentNode && el.parentNode.removeChild(el);
		});
	},
	
	
	removeAttr: function(attributeName) {
		return foreach(this, function(el) {
			el.removeAttribute(attributeName);
		});	
	},
	
	removeClass: function(className) {
		return foreach(this, function(el) {
			removeClass(el, className);
		});
	},
	
	removeData: function() {
		/// @TODO:
	},
	
	replaceAll: function(target) {
		jQuery(target).replaceWith(this);
		return this;
	},
	
	replaceWith: function() {
		var args = arguments;
		return foreach(this, function(el) {
			el.parentNode && el.parentNode.replaceChild(makeFragment(args), el);
		});
	},
	
	removeProp: function(propertyName) {
		return foreach(this, function(el) {
			try { delete el[propertyName] } catch(e) {}
			el[propertyName] = undefined;
		});
	},

	scrollLeft: function() {
		if (arguments.length === 0) return this.prop("scrollLeft");
		if (arguments.length === 1) return this.prop("scrollLeft", value);	
	},
	
	scrollTop: function() {
		if (arguments.length === 0) return this.prop("scrollTop");
		if (arguments.length === 1) return this.prop("scrollTop", value);		
	},
	
	show: function() {
		return foreach(this, function(el) {
			show(el);
		});
	},
	
	siblings: function() {
		var result = jQuery();
		foreach(this, function(el) {
			foreach(el.parentNode.childNodes, function(node) {
				node.nodeType === ELEMENT_NODE && result.add(node);
			});
		});
		return result;
	},
	
	slice: function() {
	
	},
	
	text: function(value) {
		if (arguments.length === 0) {
			var el = this[0];
			return el[el.nodeType === 1 ? "innerText" : "nodeValue"];
		}

		return foreach(this, function(el) {
			el[el.nodeType === 1 ? "innerText" : "nodeValue"] = value;
		});
	},

	toggle: function() {
	
	},
	
	toggleClass: function(className) {
		return foreach(this, function(el) {
			hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
		});
	},
	
	trigger: function(type, props) {
		foreach(this, function(node) {
			dispatchEvent(node, type, props);
		})
		return this;
	},
	
	triggerHanlder: function() {
	
	},
	
	unbind: function() {
	
	},
	
	unwrap: function() {
	
	},
	
	val: function(value) {
		if (arguments.length === 0) return this.prop("value");
		if (arguments.length === 1) return this.prop("value", value);
	},

	width: function() {
	
	},
	
	wrap: function() {
	
	},
	
	wrapAll: function() {
	
	},
	
	wrapInner: function() {
	
	}
}

jQuery.extend = extend;




/// jQuery ajax
/// @FIXME: ajax를 좀더 잘 모듈화 시킬 것~
var ajax_options = {
	async: true,
	data: {},
	dataType: "html",
	type: "GET",
	cache: true,
	success: noop
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

		var url = options.url + (options.cache === false) ? "?" + (+new Date) : "";
		var params = makeParams(options.data);

		var http = new XMLHttpRequest();
		http.open(options.type, options.url, options.async);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		http.onreadystatechange = function(e) {
	
			if (http.readyState == 4) {
				if (http.status == 200 || http.status == 304) {
					if (options.dataType === "script") {
						eval.call(window, this.responseText);
					}
					options.success.call(this, this.responseText);
					return;
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

window.$ = window.jQuery = jQuery;





//// Formatiing
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
	if (!date) return "";
	return dateFormat(Date.parse(date), mask, utc);
}

Date.curDate = function() {
	return new Date(dateFormat(new Date(), "yyyy-mm-dd"));
}

Date.format.i18n = dateFormat.i18n;







/// publish jpx
window.use = function(name){ return require(name); };
$cache("modules")['foreach'] = foreach;
$cache("modules")['extend'] = extend;
$cache("modules")['makeArray'] = makeArray;
$cache("modules")['define'] = define;
$cache("modules")['compile'] = $compile;
$cache("modules")['traversal'] = traversal;
$cache("modules")['createData'] = createData;
$cache("modules")['readData'] = readData;
$cache("modules")['removeData'] = removeData;




/// do start! ㅋ 여기 소스 무지하게 (혼)잡스럽네.
var style = document.createElement("style");
var cssText = "html,body {visibility: hidden !important;}";
style.setAttribute("type", "text/css");
style.styleSheet ? (style.styleSheet.cssText = cssText) : (style.innerHTML = cssText);
document.getElementsByTagName("head")[0].appendChild(style);

if (document.readyState !== "loading") return start();
addEvent(document, "readystatechange", start);

function start() {
	if (document.readyState === "loading") return;
	if (!document.body) return setTimeout(start); // IE
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

//	try {
		var scope = window.ViewController ? $newInstance(window.ViewController) : {};
		$compile(document, [scope]);
		document.update = function(el) { $update(el || document); }
		document.update();

		if (typeof scope.ready === "function") {
			scope.ready();
		}

		style.parentNode.removeChild(style);
			
//	} catch(e) {};
}



}(window,document));
