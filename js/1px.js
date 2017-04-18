(function(window, document, undefined) {

var ELEMENT_NODE = 1,
	ATTR_NODE = 2,
	TEXT_NODE = 3,
	DOCUMENT_NODE = 9;

var ua = navigator.userAgent;
var msie = +(/msie (\d+)/i.exec(ua) || [])[1];
if (!msie) {
	msie = /trident/i.test(ua) ? 11 : NaN;
}
var ios = +(/iphone|ipad (\d+)/i.exec(ua) || [])[1];

var regex_string = /"[^"]*"|'[^']*'/g;
var regex_trim = /^\s+|\s+$'/g;
var regexp_args = /\([^)]*\)/m;
var regexp_comma = /\s*,\s*/;
var regexp_skip = /^(script|style|head|link|meta)$/i;
var regexp_template = /^(template)$/i;
var regexp_whitespace = /\s+/g;


/// -- Core Utils
function noop() {}

var _cache = {};

function $cache(name) {
	return (_cache[name] = _cache[name] || {});
}

function foreach(collection, fn) {
	if (typeof collection !== "object" || collection == null) {
		return collection;
	}

	if (collection.length >= 0) {
		for (var i = 0, len = collection.length; i < len; i++) {
			fn(collection[i], i);
		}
		return collection;
	}

	for (var key in collection) {
		collection.hasOwnProperty(key) && fn(collection[key], key);
	}

	return collection;
}

function search(collection, fn) {
	if (typeof collection !== "object" || collection == null) {
		return;
	}

	if (collection.length >= 0) {
		for (var i = 0, len = collection.length; i < len; i++) {
			if (fn(collection[i], i) === true) {
				return collection[i];
			}
		}
		return;
	}

	for (var key in collection) {
		if (collection.hasOwnProperty(key) && fn(collection[key], key) === true) {
			return collection[key];
		}
	}
}


function extend(target) {
	if (target === null || typeof target !== "object") return target;

	for (var i = 1, len = arguments.length; i < len; i++) {
		foreach(arguments[i], function(value, key) {
			target[key] = value;
		});
	}

	return target;
}

function makeArray(arr) {
	var len = arr.length, result = Array(len), i;
	for (i = 0; i < len; i++) {
		result[i] = arr[i];
	}
	return result;
}

function trim(str) {
	return str.replace(regex_trim, "");
}


/// DOM Utils
function isElement(el) {
	return el && el.nodeType > 0;
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

function querySelectorAll(el, selector) {
	return el.querySelectorAll(selector);
}

function matchesSelector(el, selector) {
	if (el.nodeType !== ELEMENT_NODE) return false;
	var matches = el.matchesSelector || el.webkitMatchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.oMatchesSelector;
	return matches.call(el, selector);
}

function DOMContentLoaded(fn) {
	if (document.readyState !== "loading") return fn();
	document.addEventListener("DOMContentLoaded", fn);
}

function makeFragment() {
	var frag = document.createDocumentFragment();
	foreach(jQuery(arguments), function(node) {
		frag.appendChild(node);
	});
	return frag;
}

function cssValue(type, value) {
	if (typeof value !== "number") return value;
	if (type === "opacity") return value;
	if (type === "z-index") return value;
	if (type === "zIndex") return value;
	if (type === "line-height") return value;
	if (type === "lineHeight") return value;
	return value + "px";
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


var uuid = 0;

function nextid() {
	return ++uuid;
}

function expandoStore(el, key, value) {
	var id = el._1pxjs;
	var store = _cache[id];
	if (arguments.length === 2) {
		return store && store[key];
	}

	el._1pxjs = id = id || nextid();
	store = $cache(id);
	store[key] = value;
}

function dealloc(node) {
	if (node._1pxjs) {
		delete _cache[node._1pxjs];
		node._1pxjs = undefined;
	}

	for (var i = 0, children = node.childNodes || [], len = children.length; i < len; i++) {
		dealloc(children[i]);
	}
}

function emptyNode(node) {
	for (var i = 0, children = node.childNodes || [], len = children.length; i < len; i++) {
		dealloc(children[i]);
	}

	while(node.firstChild) {
		removeNode(node.firstChild);
	}
}

function removeNode(node) {
	return node.parentNode.removeChild(node);
}

function addClass(el, className) {
	foreach(className.split(regexp_whitespace), function(className) {
		el.classList.add(className);
	});
}

function removeClass(el, className) {
	return el.classList.remove(className);
}

function hasClass(el, className) {
	return el.classList.contains(className);
}

function show(el) {
	try {
		el.style.display = "";
	} catch(e) {
		el.style.cssText = el.style.cssText.replace(/display\s*:\s*none\s*(!important)?/ig, "");
	}
}

function hide(el) {
	try {
		el.style.cssText += ";display:none!important";
	} catch(e) {
		el.setAttribute("style", el.getAttribute("style") + ";display:none!important");
	}
}

function attributesOf(el) {
	return makeArray(el.attributes);
}

function hasAttribute(el, attr) {
	return el.hasAttribute(attr);
}

function addEvent(el, type, fn) {
	return el.addEventListener(type, fn);
}

function removeEvent(el, type, fn) {
	return el.removeEventListener(type, fn);
}

function dispatchEvent(el, type) {
	var event = document.createEvent("HTMLEvents");
	event.initEvent(type, true, true);
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

function traversal(node, fn, data) {
	fn = fn || noop;
	var stack = [];
	while(node) {
		node = fn(node, data) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
}

function traversal2(node, fn, fn2, data) {
	fn = fn || noop;
	fn2 = fn2 || noop;

	var stack = [];
	while(node) {
		if (node.nodeType === ELEMENT_NODE) {
			stack.push(node);
			stack.push(true);
		}

		node = fn(node, data) === false ? stack.pop() : node.firstChild || stack.pop();
		while(node === true) {
			fn2(stack.pop(), data);
			node = stack.pop();
		}

		node && node.nextSibling && stack.push(node.nextSibling);
	}
}


/// --- 1px.js
function parse_expr(string, fn) {
	fn = fn || noop;
	while(string) {
		var index = string.indexOf("{");
		if (index === -1) {
			string && fn(string, false)
			return;
		}
		fn(string.substring(0, index), false);
		string = string.substring(index);

		var striped = string.replace(regex_string, function(a) {
			return Math.pow(10, a.length - 1)
		});
		var num_brace = index = 0;
		do {
			var ch = striped.charAt(index++);
			if (ch === "{") num_brace++;
			else if (ch === "}") num_brace--;
		} while(ch && num_brace > 0);

		fn(string.substring(1, index - 1), true)
		string = string.substring(index);
	}
}


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

	} catch(e) {
//		console.log(e.message, "/", script);
	}
}

function $parse(script, scope) {
	var result = "";
	parse_expr(script, function(text, isexpr) {
		result += isexpr ? $eval(text, scope) : text;
	});
	return result;
}


/// -- $compile
function $compile(el) {
	traversal(el, $compile_process);
}

function $compile_process(node) {
	var type = node.nodeType;
	var tagName = node.tagName;

	if (regexp_skip.test(tagName)) {
		return false;
	}

	if (regexp_template.test(tagName)) {
		$cache("template")[node.id] = extractTemplate(node);
		removeNode(node);
		return false;
	}

	if (type === ELEMENT_NODE) {
		return $compile_process_element(node);
	}

	if (type === TEXT_NODE) {
		return $compile_process_text(node);
	}
}

function $compile_process_element(el) {

	var attrs = attributesOf(el);
	var length = attrs.length;
	if (length === 0) {
		return;
	}

	var result = true;
	var num_bindings = 0;

	foreach(attrs.sort(by_attr_priority), function(attr) {
		var name = attr.name;
		var value = attr.value;
		var handler;

		if (_$["@" + name]) {
			handler = "@" + name;
		}

		else if ("on" + name in el) {
			handler = "~event";
		}

		else if (value.indexOf("{") !== -1) {
			handler = "~attrValue";
		}

		else if (isBooleanAttr(name) === true) {
			handler = "~boolean";
		}

		if (!handler) {
			return;
		}

		var params = {
			name: name,
			script: value
		}

		if (create_binding(el, num_bindings++, name, handler, params) === false) {
			result = false;
		}
	});

	var bindings = expandoStore(el, "bindings");
	if (bindings) {
		bindings.length = num_bindings;
		expandoStore(el, "bindings", bindings);
	}

	return result;
}

function $compile_process_text(textNode) {
	var frag = document.createDocumentFragment();
	parse_expr(textNode.nodeValue, function(text, isexpr) {
		var newTextNode = document.createTextNode(isexpr ? '' : text);
		if (isexpr) {
			create_binding(newTextNode, 0, "#text", "~nodeValue", {script: text});
		}
		frag.appendChild(newTextNode);
	});

	textNode.parentNode.replaceChild(frag, textNode);
	return false;
}

// @FIXME:..
function create_binding(node, name, index, handler, binding) {
	var bindings = expandoStore(node, "bindings") || [];

	binding = binding || {};
	bindings[index] = binding;
	bindings[name] = binding;
	expandoStore(node, "bindings", bindings);

	binding.handler = _$[handler];
	binding.handler.init = binding.handler.init || noop;
	binding.handler.update = binding.handler.update || noop;
	binding.handler.done = binding.handler.done || noop;

	if (binding.handler.init && binding.handler.init(binding, node) === false) {
		return false;
	}
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

function attr_priority(a) {
	if (a === "repeat") return 70;
	if (a === "controller") return 60;
	if (a === "ready") return 50;
	if (a === "init") return 30;
	if (a === "css") return -10;
	if (a === "background-image") return -15;
	if (a === "visible") return -20;
	if (a === "template") return -30;
	if (a === "with") return -40;
	if (a === "name") return -50;

	return 0;
}

function by_attr_priority(a, b) {
	return attr_priority(b.tagName) - attr_priority(a.tagName);
}

function cloneScope(scope) {
	var $scope = scope.slice();
	$scope.local = Object.create(scope.local || {});
	$scope.templates = Object.create(scope.templates || {});
	return $scope;
}

/// -- $update
var is_updating = false;

function $update(el, scope) {
//	if (is_updating === true) {
//		return;
//	}

	is_updating = true;
	scope = scope || [];
	scope.local = scope.local || {};
	scope.templates = scope.templates || {};
	traversal2(el, $update_process, $update_process_done, scope);
	is_updating = false;
}

function $update_process(node, scope) {
	foreach(expandoStore(node, "bindings"), function(binding) {
		scope.local = scope.local || {};
		scope.local.el = node;

		var valueFn = binding.handler.value || "string";
		valueFn = valueType[valueFn] || valueFn || noop;

		var value = valueFn(binding, node, scope);
		if (value === binding.value) {
			return;
		}

		binding.value = value;
		binding.handler.update(binding, node, value, scope);
	});
}

function $update_process_done(node, scope) {
	foreach(expandoStore(node, "bindings"), function(binding) {
		binding.handler.done(binding, node, scope);
	});
}


/// -- Directive
var valueType = {
	"string": function(self, el, scope) {
		return $parse(self.script, scope);
	},

	"expr": function(self, el, scope) {
		return $eval(self.script, scope);
	},

	"boolean": function(self, el, scope) {
		return !!$eval(self.script, scope);
	}
}

var _$ = {};
_$["~nodeValue"] = __nodeValue();
_$["~attrValue"] = __attrValue();
_$["~boolean"] = __boolean();
_$["~event"] = __event();
_$["@repeat"] = __repeat();
_$["~@repeat"] = __repeat__();
_$["@controller"] = __controller();
_$["@enabled"] = __enabled();
_$["@visible"] = __visible();
_$["@img-src"] = __img_src();
_$["@html"] = __html();
_$["@text"] = __text();
_$["@css"] = __css();
_$["@template"] = __template();
_$["@with"] = __with();
_$["@name"] = __name();
_$["@value"] = __value();


function __repeat() {
	return {
		init: function(self, el) {
			if (self.script === "@") {
				el.removeAttribute("repeat");
				return;
			}

			var rows, row, index, lastIndex, script = self.script;
			rows = script;

			lastIndex = rows.lastIndexOf(" as ");
			if (lastIndex !== -1) {
				rows = rows.substring(0, lastIndex);
				row = trim(script.substring(lastIndex + 4));

				lastIndex = row.lastIndexOf(",");
				if (lastIndex !== -1) {
					index = trim(row.substring(lastIndex + 1));
					row = trim(row.substring(0, lastIndex));
				}
			}

			self.rows = rows;
			self.row = row;
			self.index = index;

			var c = document.createTextNode("");
			if (msie <= 8) {
				c = document.createComment("");
			}

			var placeholder = document.createTextNode("");
			el.parentNode.insertBefore(c, el);
			el.parentNode.insertBefore(document.createTextNode(""), el);
			el.parentNode.insertBefore(placeholder, el);
			removeNode(el);
			el.setAttribute("repeat", "@");

			self.repeatNode = el.cloneNode(true);
			self.placeholder = placeholder;
			create_binding(c, 0, "~@repeat", "~@repeat", self);
			return false;
		},

		value: function(self, el, scope) {
			scope.local = Object.create(scope.local);
			self.row && (scope.local[self.row] = self.data.collection[self.i]);
			self.index && (scope.local[self.index] = self.i);
		},

		done: function(self, el, scope) {
			scope.local = Object.getPrototypeOf(scope.local);
		}
	}
}


function __repeat__() {
	return {
		init: function(self) {
			self.container = [];
		},

		value: function(self, el, scope) {
			self.collection = $eval(self.rows, scope) || [];
			return self.collection.length;
		},

		update: function(self, el, length) {
			var i, node;

			for (i = length; i < self.container.length; i++) {
				node = self.container[i];
				removeNode(node);
			}

			if (self.container.length < length) {
				var frag = document.createDocumentFragment();
				for (i = self.container.length; i < length; i++) {
					node = self.repeatNode.cloneNode(true);
					$compile(node);
					frag.appendChild(node)

					var binding = expandoStore(node, "bindings")["repeat"];
					binding.data = self;
					binding.i = i;
					binding.row = self.row;
					binding.index = self.index;
					self.container[i] = node;
				}
				self.placeholder.parentNode.insertBefore(frag, self.placeholder);
			}

			self.container.length = length;
		}
	}
}


function __nodeValue() {
	return {
		value: "expr",

		update: function(self, node, value) {
			if (value === undefined || value === null) {
				value = "";
			}
			node.nodeValue = value;
		}
	}
}

function __attrValue() {
	return {
		update: function(self, el, value) {
			el.setAttribute(self.name, value);
		}
	}
}


function __boolean() {
	return {
		value: "boolean",

		update: function(self, el, bool) {
			var name = self.name;
			bool ? el.setAttribute(name, true) : el.removeAttribute(name);
			bool ? addClass(el, name) : removeClass(el, name);
		}
	}
}


function __event() {
	return {
		init: function(self, el) {
			var script = self.script;
			var type = self.name;

			addEvent(el, type, function(e) {
				if (type === "submit" && !el.getAttribute("action")) {
					e.preventDefault();
					e.stopPropagation();
				}

				if (type === "click") {
					e.stopPropagation();
				}

				window.$event = e;
				var result = $eval(script, self.$scope)
				window.$event = undefined;

				if (result === false) {
					return;
				}

				document.update();
			});

			/// ENTER for Submit
			if (type === "submit") {
				addEvent(el, "keydown", function(e) {
					if (e.keyCode === 13) {
						dispatchEvent(el, "submit");
					}
				});
			}
		},

		value: function(self, el, scope) {
			self.$scope = cloneScope(scope);
		}
	}
}


function __controller() {
	return {
		init: function(self, el) {
			self.script = self.script.replace("(", ".$new(");
		},

		value: function(self, el, scope) {
			if (!self.controller) {
				self.controller = $eval(self.script, scope);
			}
			scope.push(self.controller)
		},

		done: function(self, el, scope) {
			scope.pop();
		}
	}
}


function __css() {
	return {
		init: function(self, el) {
			self.initValue = el.style.cssText + ";";
		},

		update: function(self, el, value) {
			el.style.cssText = self.initValue + value;
		}
	}
}

function __img_src() {
	return {
		init: function(self, el) {
			el.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
		},

		update: function(self, el, value) {
			el.src = value;
		}
	}
}

function __enabled() {
	return {
		value: "boolean",

		update: function(self, el, bool) {
			bool ? el.removeAttribute("disabled") : el.setAttribute("disabled", true);
			bool ? removeClass(el, "disabled") : addClass(el, "disabled");
		}
	}
}

function __visible() {
	return {
		value: "boolean",

		update: function(self, el, bool) {
			bool ? show(el) : hide(el);
		}
	}
}


/// @TODO: if
function __if() {
	return {
		value: "boolean",

		init: function(self, el) {

		},

		update: function(self, el, bool) {
			/// bool에 따라서 placeholder와 content로 넣고 빼고...
		}
	}
}


function __html() {
	return {
		update: function(self, el, value) {
			emptyNode(el);
			el.innerHTML = value;
		}
	}
}

function __text() {
	return {
		update: function(self, el, value) {
			emptyNode(el);
			el.innerText = value;
		}
	}
}

function __template() {
	return {
		init: function(self, el) {
			self.templates = {};

			foreach(makeArray(el.getElementsByTagName("template")), function(node) {
				self.templates["@" + node.id] = extractTemplate(node);
				removeNode(node);
			});
			self.templates["@content"] = extractTemplate(el);
			return false;
		},

		value: function(self, el, scope) {
			self.content = scope.templates["@content"];
			scope.templates = Object.create(scope.templates || {});
			extend(scope.templates, self.templates);

			return $parse(self.script, scope);
		},

		update: function(self, el, id, scope) {
			emptyNode(el);
			var template = id === "@content" ? self.content : ($cache("template")[id] || scope.templates[id]);
			if (!template) {
				return;
			}

			template = template.cloneNode(true);
			$compile(template);
			$update(template, scope);

			self.template = template;
		},

		done: function(self, el, scope) {
			if (self.template) {
				el.appendChild(self.template);
				self.template = undefined;
			}

			scope.templates = Object.getPrototypeOf(scope.templates);
		}
	}
}

function __with() {
	return {
		value: function(self, el, scope) {
			scope.push($eval(self.script, scope) || {});
		},

		done: function(self, el, scope) {
			scope.pop();
		}
	}
}


function __name() {

	function getFormValueArray(el, thisObj) {
		var result = [];

		var name = el.name;
		var form = $(el).closest("form")[0];
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
					setTimeout(function() {
						dispatchEvent(el, "change");
					});
				});
			}
		},

		value: function(self, el, scope) {
			self.$scope = cloneScope(scope);
			self.thisObj = self.$scope[self.$scope.length - 1];

			self.hasExpr && (el.name = $parse(script, self.$scope));
			self.isArray = el.name.slice(-2) === "[]";
			var name = self.isArray ? el.name.slice(0, -2) : el.name;

			return self.thisObj && self.thisObj[name];
		},

		update: function(self, el, value, scope) {
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
					thisObj[name] = value;
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
			el.value = thisObj[name];
		}
	}
}


function __value() {
	return {
		update: function(self, el, value) {
			el.value = value;
		}
	}
}

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
		if (f === undefined) {
			throw new ReferenceError(controller + " is not defined");
		}
		if (typeof f !== "function") {
			throw new TypeError(controller + " is not function");
		}

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

Function.prototype.$new = function() {
	return $newInstance(this, arguments);
};


/// MSIE - CrossBrowsing
if (typeof console === "undefined") {
	window.console = {log: noop};
}

if (msie) {
	$compile_process_text = function(textNode) {
		var frag = document.createDocumentFragment();
		parse_expr(textNode.nodeValue, function(text, isexpr) {
			var newTextNode = document.createTextNode(isexpr ? '' : text);
			if (isexpr) {
				var iefix = document.createComment("");
				frag.appendChild(iefix);
				create_binding(iefix, 0, "#text", "~nodeValue", {script: text, textNode: newTextNode});
			}
			frag.appendChild(newTextNode);
		});

		textNode.parentNode.replaceChild(frag, textNode);
		return false;
	}

	_$["~nodeValue"] = {
		value: "expr",

		update: function(self, node, value) {
			if (value === undefined || value === null) {
				value = "";
			}
			self.textNode.nodeValue = value;
		}
	}
}


if (msie <= 10) {
	DOMContentLoaded = function(fn) {
		(function() {
			try {
				document.documentElement.doScroll('left');
			}
			catch(e) {
				return setTimeout(arguments.callee, 25);
			}
			fn();
		}())
	}
}


if (msie <= 9) {
	_$["@placeholder"] = {
		init: function(self, el, value) {
			self.placeholder = el.getAttribute("placeholder");
			self.type = el.getAttribute("type");

			el.onfocus = function() {
				if (hasClass(el, "input-placeholder")) {
					removeClass(el, "input-placeholder");
					el.type = self.type;
					el.value = "";
				}
			}

			el.onblur = function() {
				if (el.value === "") {
					addClass(el, "input-placeholder");
					try {
						el.type = "text"
					} catch(e) {
					} // IE6,7
					el.value = self.placeholder;
				}
			}
			el.onblur();
		}
	}

	addClass = function(el, className) {
		className = el.className + " " + className;

		var check = {};
		var result = [];
		foreach(className.split(regexp_whitespace), function(className) {
			if (check[className] === true) {
				return;
			}

			check[className] = true;
			result.push(className);
		});
		el.className = result.join(" ");
	},

		removeClass = function(el, className) {
			var result = [];
			foreach(el.className.split(regexp_whitespace), function($className) {
				$className !== className && result.push($className);
			});
			el.className = result.join(" ");
		}

	hasClass = function(el, className) {
		return (" " + el.className + " ").indexOf(className) >= 0;
	}
}


if (msie <= 8) {

	/// html5shiv
	foreach("abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video".split(" "), function(tagName) {
		document.createElement(tagName);
	});

	Object.create = function(prototype) {
		function object() {
		}

		object.prototype = prototype;
		var o = new object();
		o.__proto__ = prototype;
		return o;
	}

	Object.getPrototypeOf = function(object) {
		return object.__proto__ || object.constructor.prototype;
	}

	attributesOf = function(el) {
		var result = [];
		foreach(el.attributes, function(attr) {
			attr.specified && result.push(attr);
		});
		return result;
	}

	hasAttribute = function(el, attr) {
		attr = el.getAttributeNode(attr);
		return attr && attr.specified;
	}

	matchesSelector = function(node, selector) {
		var nodeList = querySelectorAll(node.parentNode, selector);
		for (var i = 0, len = nodeList.length; i < len; i++) {
			if (nodeList[i] == node) return true;
		}
		return false;
	}

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
	}

	removeEvent = function(el, type, fn) {
		el.detachEvent("on" + type, fn.iefix);
	}

	dispatchEvent = function(el, type) {
		return el.fireEvent("on" + type);
	}
}

if (msie <= 7) {
	querySelectorAll = function(context, selectors) {
		var style = document.createElement('style'), elements = [], element;
		document.documentElement.firstChild.appendChild(style);
		document._qsa = [];

		style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
		window.scrollBy(0, 0);
		removeNode(style);

		while(document._qsa.length) {
			element = document._qsa.shift();
			element.style.removeAttribute('x-qsa');
			if (context === document || context.contains(element)) {
				elements.push(element);
			}
		}

		document._qsa = null;
		return elements;
	}

	if (!window.XMLHttpRequest) {
		window.XMLHttpRequest = function() {
			try {
				return new ActiveXObject("Msxml2.XMLHTTP.6.0");
			} catch(e) {
			}
			try {
				return new ActiveXObject("Msxml2.XMLHTTP.3.0");
			} catch(e) {
			}
			try {
				return new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
			}
			throw new Error("This browser does not support XMLHttpRequest.");
		}
	}
}

if (msie <= 6) {
	document.execCommand("BackgroundImageCache", false, true)
}


/// TOUCH DEVICE - CrossBrowsing
if ("ontouchstart" in document) {
	var clickable = false;
	var screenX = 0;
	var screenY = 0;
	var scrollX = 0;
	var scrollY = 0;

	document.addEventListener("touchstart", function(e) {
		clickable = true;

		var touch = e.changedTouches[0];
		screenX = touch.screenX;
		screenY = touch.screenY;

		scrollX = window.pageXOffset;
		scrollY = window.pageYOffset;
	});

	document.addEventListener("touchmove", function(e) {
		if (clickable === false) {
			return;
		}

		if (scrollY !== window.pageYOffset || scrollX !== window.pageXOffset) {
			clickable = false;
			return;
		}

		var touch = e.changedTouches[0];
//		var dist = Math.pow(screenX - touch.screenX, 2) + Math.pow(screenY - touch.screenY, 2);
//		if (dist > 25) {
//			clickable = false;
//			return;
//		}
		if (Math.abs(screenX - touch.screenX) < Math.abs(screenY - touch.screenY)) {
			clickable = false;
			return;
		}
	});

	function touchclickfix(fn) {
		return (fn.touchfix = function(e) {
			if (clickable === false) {
				return;
			}
			fn.call(this, e);
		})
	}

	addEvent = function(el, type, fn) {
		if (type === "click") {
			return el.addEventListener("touchend", touchclickfix(fn), false);
		}

		if (type === "mousedown") {
			type = "touchstart";
		}
		else if (type === "mousemove") {
			type = "touchmove";
		}
		else if (type === "mouseup") {
			type = "touchend";
		}

		return el.addEventListener(type, fn, false);
	}

	removeEvent = function(el, type, fn) {
		if (type === "click" || (type === "touchend" && fn.touchfix)) {
			_removeEvent(el, "touchend", fn.touchfix);
			delete fn.touchfix;
			return;
		}

		if (type === "mousedown") {
			type = "touchstart";
		}
		else if (type === "mousemove") {
			type = "touchmove";
		}
		else if (type === "mouseup") {
			type = "touchend";
		}

		return el.removeEventListener(type, fn, false);
	}
}


/// publish
window.$compile = $compile;
window.$update = $update;
window.foreach = foreach;
window.msie = msie;
window.addEvent = addEvent;
window.removeEvent = removeEvent;


var style = document.createElement("style");
var cssText = "html,body{opacity:0;filter:alpha(opacity=0);}";
style.setAttribute("type", "text/css");
style.styleSheet ? (style.styleSheet.cssText = cssText) : (style.innerHTML = cssText);
document.documentElement.firstChild.appendChild(style);

DOMContentLoaded(run);

function run() {
	$compile(document);
	removeNode(style);

	var viewController;
	document.update = function() {
		viewController && $update(document, [viewController]);
	}

	var vc = window["ViewController"];
	viewController = vc ? $newInstance(vc) : {};
	document.update();
}


/// jQuery
var jQuery = (function(prototype) {
	function jQuery() {
	}

	function $(selector, context) {
		return new jQuery().add(selector, context)
	}

	$.fn = jQuery.prototype = prototype;
	return $;
})({
	jquery: "m1.0",

	length: 0,

	add: function(mixed, context) {

		/// null, undefined
		if (mixed === null || mixed === undefined) {
			return this;
		}

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
			DOMContentLoaded(mixed);
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
		if (arguments.length === 1) {
			var self = this;
			foreach(eventType, function(handler, eventType) {
				self.bind(eventType, handler);
			});
			return this;
		}

		eventType = eventType.split(regexp_whitespace);
		return foreach(this, function(el) {
			foreach(eventType, function(eventType) {
				addEvent(el, eventType, handler);
			});
		});
	},

	blur: function() {
		return foreach(this, function(node) {
			node.blur && node.blur();
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

	closest: function(selector) {
		var result = jQuery();
		foreach(this, function(el) {
			while(el && !matchesSelector(el, selector)) {
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
				return this[0] && styleOf(this[0])[propertyName];
			}

			if (typeof propertyName === "object") {
				var properties = propertyName;
				return foreach(this, function(el) {
					foreach(properties, function(value, propertyName) {
						el.style[propertyName] = cssValue(propertyName, value);
					});
				});
			}
		}

		return foreach(this, function(el) {
			el.style[propertyName] = cssValue(propertyName, value);
		});
	},

	click: function(event) {
		return foreach(this, function(el) {
			el.click(event);
		});
	},

	data: function(key, value) {
		/// @TODO:
	},

	each: function(fn) {
		for (var i = 0, len = this.length; i < len; i++) {
			if (fn.call(this[i], i, this[i]) === false) break;
		}
		return this;
	},

	empty: function() {
		return foreach(this, function(el) {
			emptyNode(el);
		});
	},

	eq: function(index) {
		return jQuery(this[index < 0 ? this.length + index : index]);
	},

	filter: function(fn) {
		var ret = jQuery();
		foreach(this, function(node, index) {
			fn(index, node) && ret.add(node);
		})
		return ret;
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
		return foreach(this, function(node) {
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
			emptyNode(el);
			el.innerHTML = htmlString;
		});
	},

	index: function(target) {
		target = jQuery(target)[0];
		return indexOf(this, target);
	},

	innerHeight: function() {
		/// @TODO:
	},

	innerWidth: function() {
		/// @TODO:
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
		var result = jQuery();
		foreach(this, function(el) {
			do {
				el = el.nextSibling;
			} while(el && el.nodeType !== ELEMENT_NODE);
			el && result.add(el);
		});
		return result;
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

	one: function(eventType, handler) {
		if (arguments.length === 1) {
			var self = this;
			foreach(eventType, function(handler, eventType) {
				self.one(eventType, handler);
			});
			return this;
		}

		eventType = eventType.split(regexp_whitespace);
		return foreach(this, function(el) {
			foreach(eventType, function(eventType) {
				var fn = function() {
					handler.apply(el, arguments);
					removeEvent(el, eventType, fn);
				}
				addEvent(el, eventType, fn);
			});
		});
	},

	outerHeight: function() {
		/// @TODO:
	},

	outerWidth: function() {
		/// @TODO:
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
		if (this[0] === undefined) return {top: 0, left: 0};
		return {top: this[0].offsetTop, left: this[0].offsetLeft};
	},

	prepend: function() {
		var args = arguments;
		return foreach(this, function(el) {
			var frag = makeFragment(args);
			el.firstChild ? el.insertBefore(frag, el.firstChild) : el.appendChild(frag);
		});
	},

	prependTo: function(target) {
		jQuery(target).prepend(this);
		return this;
	},

	/// @TODO: previousElementSibling
	prev: function() {
		var result = jQuery();
		foreach(this, function(el) {
			do {
				el = el.previousSibling;
			}
			while(el && el.nodeType !== ELEMENT_NODE);
			el && result.add(el);
		});
		return result;
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
			removeNode(el);
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
			try {
				delete el[propertyName]
			}
			catch(e) {
				el[propertyName] = undefined;
			}
		});
	},

	scrollLeft: function(value) {
		if (arguments.length === 0) return this.prop("scrollLeft");
		if (arguments.length === 1) return this.prop("scrollLeft", value);
	},

	scrollTop: function(value) {
		if (arguments.length === 0) return this.prop("scrollTop");
		if (arguments.length === 1) return this.prop("scrollTop", value);
	},

	scrollParent: function() {
		var ret = $();
		if (this.length === 0) return ret;

		var el = this[0];
		while(el = el.parentNode) {
			if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
				return ret.add(el);
			}
		}
		return ret;
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
		return jQuery(Array.prototype.slice.apply(this, arguments));
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
		/// @TODO:
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
		/// @TODO:
	},

	unbind: function() {
		/// @TODO:
	},

	unwrap: function() {
		/// @TODO:
	},

	val: function(value) {
		if (arguments.length === 0) return this.prop("value");
		if (arguments.length === 1) return this.prop("value", value);
	},

	width: function() {
		/// @TODO:
	},

	wrap: function() {
		/// @TODO:
	},

	wrapAll: function() {
		/// @TODO:
	},

	wrapInner: function() {
		/// @TODO:
	}
})

jQuery.makeArray = makeArray;
jQuery.extend = extend;

window.$ = window.jQuery = jQuery;


/// Local Storage
function get_localStorage(key) {
	try {
		return JSON.parse(localStorage.getItem(key));
	} catch(e) {
		return null;
	}
}

function set_localStorage(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function $localStorage(key, value) {
	if (arguments.length === 1) return get_localStorage(key);
	if (arguments.length === 2) return set_localStorage(key, value);
}

window.$localStorage = $localStorage;


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
		toFixedFix = function(n, prec) {
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

var dateFormat = function() {
	var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMisTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function(val, len) {
			val = String(val);
			len = len || 2;
			while(val.length < len) val = "0" + val;
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

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

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
	"default": "ddd mmm dd yyyy HH:MM:ss",
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
}

Date.format = function(date, mask, utc) {
	if (!date) return "";
	return dateFormat(Date.parse(date), mask, utc);
}

Date.curDate = function() {
	return new Date(dateFormat(new Date(), "yyyy-mm-dd"));
}

Date.format.i18n = dateFormat.i18n;


if (typeof define === "function" && define.amd) {
	define("jquery", [], function() {
		return jQuery;
	});
}


}(window, document))


