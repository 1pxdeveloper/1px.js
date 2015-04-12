$module("1px").define(["foreach", "trim", "msie", "$cache", "noop", "addClass", "removeClass", "traversal", "traversal2", "removeNode", "attributesOf", "expandoStore", "closest", "addEvent", "bind", "$parse", "$eval", "parse_expr", function(foreach, trim, msie, $cache, noop, addClass, removeClass, traversal, traversal2, removeNode, attributesOf, expandoStore, closest, addEvent, bind, $parse, $eval, parse_expr) {

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


	/// @FIXME: app 처리를 어떻게 할지 고민해보자.
	var $app = $module("1px");
	$module("1px").value("$controller", function(name) {
		return $app.require("controller/" + name);
	});


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
				handler = $app.require("directive/" + name);
				console.log(handler, name)
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
		parse_expr(textNode.nodeValue, function(text, isexpr) {
			var newTextNode = document.createTextNode(isexpr ? '' : text);
			if (isexpr) {
				create_binding(newTextNode, 0, "#text", __nodeValue, {script: text});
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

		binding.handler = handler;
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


	var __nodeValue = {
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


	// @FIXME:..
	var $rootScope = {};
	$module("1px").value("$rootScope", $rootScope);

	document.controller = {};
	document.update = function() {
		$update(document, [$rootScope, document.controller]);
	};

	return {
		"$compile": $compile,
		"$update": $update,

		// @FIXME:..
		"extractTemplate": extractTemplate,
		"create_binding": create_binding
	}
}]);