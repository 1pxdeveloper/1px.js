$module("1px", function(module) {

	var foreach = module.require("foreach");
	var makeArray = module.require("makeArray");
	var noop = module.require("noop");


	/// @FIXME: app 처리를 어떻게 할지 고민해보자.
	var $app = module;

	function $controller(name) {
		return $app.require("controller/" + name);
	}

	function $directive(name) {
		return $app.require("directive/" + name);
	}

	module.value("$controller", $controller);
	module.value("$directive", $directive);


	// @FIXME:..
	var $rootScope = {};
	module.value("$rootScope", $rootScope);

	module.factory("$compile", ["$cache", "removeNode", "expandoStore", "$$parse_expr", "attributesOf", "closest", "$eval", "$parse", function($cache, removeNode, expandoStore, $$parse_expr, attributesOf, closest, $eval, $parse) {

		var ELEMENT_NODE = 1;
		var TEXT_NODE = 3;

		var regexp_skip = /^(script|style|head|link|meta)$/i;
		var regexp_template = /^(template)$/i;


		function isRadioButton(el) {
			return el && el.tagName === "INPUT" && el.type === "radio";
		}

		function isCheckbox(el) {
			return el && el.tagName === "INPUT" && el.type === "checkbox";
		}

		function isArrayCheckbox(el) {
			return isCheckbox(el) && el.name.slice(-2) === "[]";
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
				while (node === true) {
					fn2(stack.pop(), data);
					node = stack.pop();
				}

				node && node.nextSibling && stack.push(node.nextSibling);
			}
		}

		// @FIXME:..
		function create_binding(node, name, index, handler, binding) {
			var bindings = expandoStore(node, "bindings") || [];

			binding = binding || {};
			bindings[index] = binding;
			bindings[name] = binding;
			expandoStore(node, "bindings", bindings);

			binding.handler = handler;
			binding.handler.init = binding.handler.init || noop;
			binding.handler.update = binding.handler.update || noop;
			binding.handler.done = binding.handler.done || noop;

			if (binding.handler.init && binding.handler.init(binding, node) === false) {
				return false;
			}
		}

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

			/// @NOTE: APP atrr에 대해서 app module을 불러온다.
			/// @TODO: 예외 처리 추가
			var appName = el.getAttribute("app");
			if (appName) {
				$app = $module(appName);
			}

			var result = true;
			var num_bindings = 0;

			foreach(attrs.sort(by_attr_priority), function(attr) {
				var name = attr.name;
				var value = attr.value;
				var prefix = name.charAt(0);

				var handler;
				try {
					handler = $directive(name);
					console.log(name, handler)
				} catch(e) {}

				if (handler) {

				}

				else if ("on" + name in el) {
					handler = __event;
				}

				else if (prefix === "@") {
					handler = __attrValue;
					name = name.slice(1);
					el.removeAttributeNode(attr);
				}

				else if (prefix === "^") {
					handler = __boolean;
					name = name.slice(1);
					el.removeAttributeNode(attr);
				}

				else if (prefix === "+") {
					handler = __classList;
					name = name.slice(1);
					el.removeAttributeNode(attr);
				}

				else if (value.indexOf("{") >= 0) {
					handler = __attrValue;
				}

				else if (isBooleanAttr(name)) {
					handler = __boolean;
				}

				if (!handler) {
					return;
				}

				var params = {
					name: name,
					script: value
				};

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
			$$parse_expr(textNode.nodeValue, function(text, isexpr) {
				var newTextNode = document.createTextNode(isexpr ? '' : text);
				if (isexpr) {
					create_binding(newTextNode, 0, "#text", __textNodeValue, {script: text});
				}
				frag.appendChild(newTextNode);
			});

			textNode.parentNode.replaceChild(frag, textNode);
			return false;
		}



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

		var __textNodeValue = {
			value: "expr",

			update: function(self, node, value) {
				if (value === undefined || value === null) {
					value = "";
				}
				node.nodeValue = value;
			}
		};

		var __attrValue = {
			update: function(self, el, value) {
				el.setAttribute(self.name, value);
			}
		};

		var __boolean = {
			value: "boolean",

			update: function(self, el, bool) {
				var name = self.name;
				bool ? el.setAttribute(name,"") : el.removeAttribute(name);

				/// @FIXME: .. 이건 IE6 때문에 ㅠㅠ
				//bool ? addClass(el, name) : removeClass(el, name);
			}
		};

		var __classList = {
			value: "boolean",

			update: function(self, el, bool) {
				var name = self.name;
				bool ? addClass(el, name) : removeClass(el, name);
			}
		};


		var __event = {
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

					if (closest(e.target, "[disabled]")) {
						e.preventDefault();
						e.stopPropagation();
						return;
					}


					window.$event = e;
					var result = $eval(script, self.$scope);
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
								dispatchEvent(el, "submit");
							}, 0);
						}
					});
				}
			},

			value: function(self, el, scope) {
				self.$scope = cloneScope(scope);
			}
		};

		document.update = function() {
			$update(document, [$rootScope]);
		};

		return $compile;
	}]);
});