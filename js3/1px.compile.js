module.value("$traverse", function(node, fn, data) {
	fn = fn || noop;

	var stack = [];
	while (node) {
		node = fn(node, data) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
});

module.value("$$makeFragment", function(arr) {
	var frag = document.createDocumentFragment();
	foreach(arr, function(node) {
		frag.appendChild(node);
	});
	return frag;
});


module.factory("Scope", function($parse) {

	function Scope(context, def) {
		this.context = context || {};
		this.def = Object.create(def || {});
		this.value("self", this.context);
		this.value("this", this.context);
		this.watchers = [];
		this.children = [];
	}

	Scope.prototype = {
		fork: function() {
			var s = new Scope(this.context, this.def);
			this.children.push(s);
			return s;
		},

		eval: function(script) {
			return $parse(script, this.def)(this.context);
		},

		assign: function(script, value) {
			return $parse(script, this.def).assign(this.context, value);
		},

		watch: function(script, fn, args) {
			if (Array.isArray(script)) {
				foreach(script, function(_script, index) {
					this.watchers.push($parse(_script, this.def).watch(this.context, fn, args, script, index));
				}, this);
				return;
			}

			this.watchers.push($parse(script, this.def).watch(this.context, fn, args));
		},

		macro: function(name, value) {
			this.def[name] = {type: "macro", value: value}
		},

		value: function(name, value) {
			this.def[name] = {type: "value", value: value}
		}
	};

	return Scope;
});

function domChanged(element) {
	element.dispatchEvent(new CustomEvent("dom-changed", {
		bubbles: true,
		cancelable: true
	}));
}


module.factory("$compile", function($traverse, Scope) {

	module.compile = function(selector, fn) {
		return foreach(document.querySelectorAll(selector), function(element) {
			$compile(element, fn(element)).start();
		})[0];
	};

	function $hypenToCamelCase(str) {
		return str.replace(/-([a-z])/g, function(a, b) {
			return b.toUpperCase();
		});
	}

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;

	function $compile(el, scope, to, template) {
		if (!(scope instanceof Scope)) {
			scope = new Scope(scope);
		}

		if (template) {
			compileElementNode(template, scope, to);
		}

		if (el.nodeName === "TEMPLATE" || el.nodeName === "CONTENT") {
			compileElementNode(el, scope, to);
			el = el.content;
		}

		$traverse(el, compileProcess, scope);

		function startWatch(scope) {
			foreach(scope.watchers, function(watcher) {
				watcher.start();
			});

			foreach(scope.children, function(scope) {
				startWatch(scope);
			});
		}

		function stopWatch(scope) {
			foreach(scope.watchers, function(watcher) {
				watcher.stop();
			});

			foreach(scope.children, function(scope) {
				stopWatch(scope);
			});
		}

		return {
			scope: scope,
			is_running: false,

			start: function() {
				this.is_running = true;
				startWatch(scope);
			},

			stop: function() {
				this.is_running = false;
				stopWatch(scope);
			}
		}
	}

	function compileProcess(node, scope) {
		switch (node.nodeType) {
			case ELEMENT_NODE:
				return compileElementNode(node, scope);

			case TEXT_NODE:
				return compileTextNode(node, scope);
		}
	}

	function compileElementNode(from, scope, element) {
		element = element || from;

		switch (element.tagName) {
			case "HEAD":
			case "STYLE":
			case "SCRIPT":
				return false;

			case "CONTENT":
				element.scope = scope;
				return false;
		}

		var directive;
		if (from.getAttribute("*repeat")) {
			directive = module.directive.get("*repeat");
			return directive(element, scope, from.getAttribute("*repeat"));
		}

		//if (from.getAttribute("*if")) {
		//	directive = module.directive.get("*if");
		//	return directive(element, scope, from.getAttribute("*if"));
		//}
		//
		//if (from.getAttribute("*template")) {
		//	directive = module.directive.get("*template");
		//	return directive(element, scope, from.getAttribute("*template"));
		//}

		foreach(from.attributes, function(attr) {
			var name = attr.nodeName;
			var script = attr.nodeValue;
			var prop;

			/// Custom Directive
			directive = module.directive.get(name);
			if (directive) {
				return directive(element, scope, script);
			}

			/// two-way binding: [(attr.name)]="expression"
			if (name.slice(0, 7) === "[(attr." && name.slice(-2) === ")]") {
				prop = name.slice(7, -2);

				element[prop] = element.getAttribute(prop);

				// @TODO: attr change -> set Value
				//var setAttribute = element.setAttribute;
				//element.setAttribute(prop);

				scope.watch(script, function(value) {
					value ? element.setAttribute(prop, value) : element.removeAttribute(prop);
					domChanged(element);
				});
				return;
			}

			/// two-way binding: [(prop)]="expression"
			if (name.slice(0, 2) === "[(" && name.slice(-2) === ")]") {
				prop = name.slice(2, -2);

				scope.watch(script, function(value) {
					element[prop] = value;
				});

				// @FIXME:...
				element.addEventListener(name, function(e) {
					scope.assign(script, e.detail || element[prop]);
				});

				// @FIXME:...
				if (prop === "value") {
					element.addEventListener("input", function(e) {
						element.dispatchEvent(new CustomEvent(name, {detail: this.value}));
					});
				}

				return;
			}


			/// (event)="statement"
			if (name.charAt(0) === "(" && name.slice(-1) === ")") {
				var options = name.slice(1, -1).split(".");
				var type = options.shift();

				var flags = {};
				foreach(options, function(option) {
					flags[option] = true;
				});

				/*
				 .stop
				 .prevent
				 .capture
				 .self
				 .once
				 */

				var _scope = scope.fork();
				var fn = function(event) {
					_scope.value("this", element);
					_scope.value("event", event);

					// @TODO: 이렇게 하지 말고 fn를 factory방식으로 생성하자.
					// 이러면 매번 불필요한 if 구문이 너무 많이 실행된다.

					flags["prevent"] && event.preventDefault();
					flags["stop"] && event.stopPropagation();
					if (flags["self"] && event.target !== element) {
						return;
					}

					if (type === "submit" && !element.getAttribute("action")) {
						event.preventDefault();
						event.stopPropagation();
					}

					else if (type === "click") {
						event.stopPropagation();
					}

					return _scope.eval(script);
				};

				element.addEventListener(type, fn, flags["capture"]);
				return;
			}


			/// 프로퍼티 접근자. Property e.g) [prop]="value"
			if (name.charAt(0) === "[" && name.slice(-1) === "]") {


				// [attr.*]
				if (name.substr(1, 5) === "attr.") {
					prop = name.slice(6, -1);
					scope.watch(script, function(value) {
						value ? element.setAttribute(prop, value) : element.removeAttribute(prop);
						domChanged(element);
					});
					return;
				}

				// [style.prop.unit]
				if (name.substr(1, 6) === "style.") {
					prop = name.slice(7, -1);

					var split = prop.split(".");
					prop = split[0];
					var unit = split[1] || "";

					switch (unit) {
						case "":
							scope.watch(script, function(value) {
								element.style[prop] = value;
								domChanged(element);
							});
							break;

						case "url":
							scope.watch(script, function(value) {
								element.style[prop] = "url(" + encodeURI(value) + ")";
								domChanged(element);
							});
							break;

						default:
							scope.watch(script, function(value) {
								element.style[prop] = value + unit;
								domChanged(element);
							});
							break;
					}

					return;
				}

				// [class.*]
				if (name.substr(1, 6) === "class.") {
					prop = name.slice(7, -1);

					scope.watch(script, function(value) {
						value ? element.classList.add(value) : element.classList.remove(value);
						domChanged(element);
					});
					return;
				}

				prop = $hypenToCamelCase(name.slice(1, -1));
				scope.watch(script, function(value) {
					element[prop] = value;
					domChanged(element);
				});

				return;
			}

			/// #ref
			if (name.charAt(0) === "#") {
				prop = name.slice(1);
				scope.context[prop] = element;
			}
		});
	}

	/// {{ expression }}
	function compileTextNode(textNode, scope) {
		var index = textNode.nodeValue.indexOf("{{");
		while (index >= 0) {
			textNode = textNode.splitText(index);
			index = textNode.nodeValue.indexOf("}}");
			if (index === -1) return;
			var next = textNode.splitText(index + 2);
			var script = textNode.nodeValue.slice(2, -2);

			textNode.nodeValue = "";
			scope.watch(script, function(value, textNode) {
				textNode.nodeValue = value == undefined ? "" : value;
				domChanged(textNode.parentNode);
			}, [textNode]);

			textNode = next;
			index = textNode.nodeValue.indexOf("{{");
		}
	}

	return $compile;
});

/// DOM Repeater
module.directive("*repeat", function($compile) {

	function $repeat(element, scope, script) {

		/// expression => repeat="rows as row, index"
		var rows, row, index, lastIndex;
		rows = script;
		lastIndex = rows.lastIndexOf(" as ");
		if (lastIndex !== -1) {
			rows = rows.substring(0, lastIndex);
			row = script.substring(lastIndex + 4).trim();

			lastIndex = row.lastIndexOf(",");
			if (lastIndex !== -1) {
				index = row.substring(lastIndex + 1).trim();
				row = row.substring(0, lastIndex).trim();
			}
		}
		rows = "(" + rows + ")";

		/// create repeatNode
		element.removeAttribute("*repeat");
		var repeatNode = document.importNode(element, true);

		/// replace with placeholder(comment element);
		var frag = document.createDocumentFragment();
		var placeholderStart = document.createComment(" repeat(" + script + ") ");
		var placeholderEnd = document.createComment(" endrepeat ");
		frag.appendChild(placeholderStart);
		frag.appendChild(placeholderEnd);
		element.parentNode.replaceChild(frag, element);

		/// watch (rows).length => render
		scope.watch(rows, render, [scope, repeatNode, rows, row, index, placeholderEnd, []]);
		return false;
	}

	function render(array, $scope, $repeatNode, rows, row, index, placeholderEnd, container) {
		var isNumber = typeof array === "number";
		var length = (isNumber ? +array : (array && array.length)) || 0;

		for (var i = length; i < container.length; i++) {
			foreach(container[i].content, function(node) {
				document.createDocumentFragment().appendChild(node);
			});
			container[i].program.stop();
		}

		var frag = document.createDocumentFragment();
		for (i = container.length; i < length; i++) {
			var scope = $scope.fork();
			if (isNumber) {
				row && scope.macro(row, i);
				index && scope.value(index, i);
			}
			else {
				row && scope.macro(row, rows + "[" + i + "]");
				index && scope.value(index, i);
			}

			var repeatNode = document.importNode($repeatNode, true);
			var wrapNode = document.createDocumentFragment();
			wrapNode.appendChild(repeatNode);

			var program = $compile(repeatNode, scope);
			program.start();

			// @NOTE: template!!
			if (repeatNode.tagName === "TEMPLATE" && repeatNode.parentNode === wrapNode) {
				wrapNode.replaceChild(repeatNode.content, repeatNode);
			}

			container[i] = {
				program: program,
				content: Array.from(wrapNode.childNodes)
			};

			frag.appendChild(wrapNode);
		}
		placeholderEnd.parentNode.insertBefore(frag, placeholderEnd);
		container.length = length;

		domChanged(placeholderEnd);
	}

	return $repeat;
});


/// DOM show/hide
module.directive("*if", function($compile) {

	var DOCUMENT_FRAGMENT = 11;

	function $if(element, scope, script) {

		/// create ifNode
		element.removeAttribute("*if");
		var ifNode = document.importNode(element, true);

		$compile(ifNode, scope).start();
		var ifContent = ifNode.nodeType === DOCUMENT_FRAGMENT ? Array.from(ifNode.childNodes) : [ifNode];

		/// replace with placeholder(comment element);
		var frag = document.createDocumentFragment();
		var placeholderStart = document.createComment(" if(" + script + ") ");
		var placeholderEnd = document.createComment(" endif ");
		placeholderEnd.$if = script;
		frag.appendChild(placeholderStart);
		frag.appendChild(placeholderEnd);

		element.parentNode.replaceChild(frag, element);


		/// watch script => render
		scope.watch(script, render, [ifContent, placeholderEnd]);
		return false;
	}

	function render(bool, ifContent, placeholderEnd) {
		if (bool) {
			var frag = document.createDocumentFragment();
			foreach(ifContent, function(node) {
				frag.appendChild(node.content || node);
			});
			placeholderEnd.parentNode.insertBefore(frag, placeholderEnd)
		}
		else {
			foreach(ifContent, function(node) {
				node.parentNode && node.parentNode.removeChild(node);
			});
		}

		//domChanged(element);
	}

	return $if;
});


/// DOM template include
module.directive("*template", function($compile) {

	function $template(element, $scope, script) {
		var program = {stop: noop};

		$scope.watch(script, function(template) {
			element.innerHTML = "";
			program.stop();

			if (typeof template === "string") {
				template = module.get("#" + template);
			}

			if (!template || template.tagName !== "TEMPLATE") {
				return;
			}

			// console.log("template", template);
			// console.log("template", template.content.childNodes);

			var content = document.importNode(template.content, true);
			var scope = $scope.fork();
			scope.value("this", element);

			program = $compile(content, scope);
			program.start();
			element.appendChild(content);

			domChanged(element);
		});

		return false;
	}

	return $template;
});


// @TODO: [hidden], [visible]

// @TODO: [disabled]

// @TODO: [innerHTML], [inner-html]

