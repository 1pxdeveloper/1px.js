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

	var _module = {};

	function $export(name, obj) {
		_module[name] = obj;
		return obj;
	}

	function $require(name) {
		return _module[name];
	}

	function $define(name, fn) {
		var source = fn.toString();
		var modules = regexp_args.exec(source)[0];
		modules = modules.slice(1, -1).split(regexp_comma);

		var args = [];
		foreach(modules, function(module_name) {
			var module = _module[module_name];
			args.push(module);
		});

		var ret = fn.apply(window, args);
		return $export(name, ret);
	}

	function $controller(name, fn) {
		var source = fn.toString();
		var modules = regexp_args.exec(source)[0];
		modules = modules.slice(1, -1).split(regexp_comma).slice(1);

		var self = {};
		var args = [self];
		foreach(modules, function(module_name) {
			var module = _module[module_name];
			args.push(module);
		});

		var ret = fn.apply(window, args);
		extend(self, ret);
		self.init && self.init();

		return $export(name, self);
	}


/// Core Function
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
			if (collection.hasOwnProperty(key)) {
				fn(collection[key], key);
			}
		}

		return collection;
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
		return str && str.replace(regex_trim, "");
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

	function closest(el, selector) {
		while(el && !matchesSelector(el, selector)) {
			el = el.parentNode;
		}
		return el;
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
		}
		catch(e) {
			el.style.cssText = el.style.cssText.replace(/display\s*:\s*none\s*(!important)?/ig, "");
		}
	}

	function hide(el) {
		try {
			el.style.cssText += ";display:none!important";
		}
		catch(e) {
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

	function dispatchEvent(el, type, canBubble, cancelable) {
		canBubble = canBubble === undefined ? true : canBubble;
		cancelable = cancelable === undefined ? true : cancelable;

		var event = document.createEvent("HTMLEvents");
		event.initEvent(type, canBubble, cancelable);
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


	$define("dom", function() {
		return {
			isElement: isElement,
			isRadioButton: isRadioButton,
			isCheckBox: isCheckbox,

			querySelectorAll: querySelectorAll,
			matchesSelector: matchesSelector,
			closest: closest,

			DOMContentLoaded: DOMContentLoaded,
			makeFragment: makeFragment,

			removeNode: removeNode,
			cssValue: cssValue,

			show: show,
			hide: hide,

			addClass: addEvent,
			removeClass: removeEvent,

			addEvent: addEvent,
			removeEvent: removeEvent,
			dispatchEvent: dispatchEvent,


			bind: bind,
			unbine: unbind
		}
	});


/// --- 1px.js
	function parse_expr(string, fn) {
		fn = fn || noop;
		while(string) {
			var index = string.indexOf("{");
			if (index === -1) {
				string && fn(string, false);
				return;
			}
			fn(string.substring(0, index), false);
			string = string.substring(index);

			var striped = string.replace(regex_string, function(a) { return Math.pow(10, a.length - 1) });
			var num_brace = index = 0;
			do {
				var ch = striped.charAt(index++);
				if (ch === "{") num_brace++;
				else if (ch === "}") num_brace--;
			} while(ch && num_brace > 0);

			fn(string.substring(1, index - 1), true);
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

		}
		catch(e) {
			console.error(e.stack);
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
	function $compile(el, scope) {
		traversal(el, $compile_process);
		return function(scope) {
			$update(el, scope);
		}
	};

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
		if (is_updating === true) {
			return;
		}

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
	};

	var _$ = {};
	_$["~nodeValue"] = __nodeValue();
	_$["~attrValue"] = __attrValue();
	_$["~boolean"] = __boolean();
	_$["~event"] = __event();
	_$["@repeat"] = __repeat();
	_$["~@repeat"] = __repeat__();
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

				node = node;
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
						el.__submit__ = true;
					}

					if (type === "click") {
						e.stopPropagation();
					}

					if (closest(e.target, ".disabled,[disabled]")) {
						e.preventDefault();
						e.stopPropagation();
						return;
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
							e.preventDefault();
							e.stopPropagation();

							setTimeout(function() {
								dispatchEvent(el, "submit", false, false);
							});
						}
					});
				}
			},

			value: function(self, el, scope) {
				self.$scope = cloneScope(scope);
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
						setTimeout(function() { dispatchEvent(el, "change"); });
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
		};

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
				try { document.documentElement.doScroll('left'); }
				catch(e) { return setTimeout(arguments.callee, 25); }
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
				};

				el.onblur = function() {
					if (el.value === "") {
						addClass(el, "input-placeholder");
						try { el.type = "text" }
						catch(e) {} // IE6,7
						el.value = self.placeholder;
					}
				};
				el.onblur();
			}
		};

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
		};

		removeClass = function(el, className) {
			var result = [];
			foreach(el.className.split(regexp_whitespace), function($className) {
				$className !== className && result.push($className);
			});
			el.className = result.join(" ");
		};

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
			function object() {}

			object.prototype = prototype;
			var o = new object();
			o.__proto__ = prototype;
			return o;
		};

		Object.getPrototypeOf = function(object) {
			return object.__proto__ || object.constructor.prototype;
		};

		attributesOf = function(el) {
			var result = [];
			foreach(el.attributes, function(attr) {
				attr.specified && result.push(attr);
			});
			return result;
		};

		hasAttribute = function(el, attr) {
			attr = el.getAttributeNode(attr);
			return attr && attr.specified;
		};

		matchesSelector = function(node, selector) {
			var nodeList = querySelectorAll(node.parentNode, selector);
			for (var i = 0, len = nodeList.length; i < len; i++) {
				if (nodeList[i] == node) return true;
			}
			return false;
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
		};

		if (!window.XMLHttpRequest) {
			window.XMLHttpRequest = function() {
				try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
				catch(e) {}
				try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
				catch(e) {}
				try { return new ActiveXObject("Microsoft.XMLHTTP"); }
				catch(e) {}
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

			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }

			return el.addEventListener(type, fn, false);
		};

		removeEvent = function(el, type, fn) {
			if (type === "click" || (type === "touchend" && fn.touchfix)) {
				_removeEvent(el, "touchend", fn.touchfix);
				delete fn.touchfix;
				return;
			}

			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }

			return el.removeEventListener(type, fn, false);
		}
	}

	function $newInstance(fn) {
		var self = {};
		extend(self, fn(self));

		if (typeof self.init === "function") {
			self.init();
		}
		return self;
	}


	var $component = {
		create: function(params, controllerFn) {
			var selector = params.selector;
			var templateId = params.templateId;
			var template = document.getElementById(templateId).cloneNode(true);
			var frag = extractTemplate(template);

			foreach(querySelectorAll(document, selector), function(el) {
				el.innerHTML = "";
				el.appendChild(frag.cloneNode(true));
				var update = $compile(el);
				var controller = $newInstance(controllerFn);
				controller.$update = function() {
					update([controller]);
				};
				$queue.push(controller.$update);
				controller.$update();

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


