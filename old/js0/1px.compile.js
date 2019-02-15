function $compile(el, $scope) {
	$traversal(el, $scope, $compile_process);
}

function $compile_process(node, $scope) {

	if (node.nodeType === 3) {
		return $compile_process_textNode(node, $scope);
	}

	if (node.nodeName === "SCRIPT" || node.nodeName === "TEMPLATE") {
		return false;
	}

	if (node.tagName === "FORM") {

		function addClass(input, className) {
			while (input !== node) {
				input.classList.add(className);
				input = input.parentNode;
			}
		}

		function removeClass(input, className) {
			while (input !== node) {
				input.classList.remove(className);
				input = input.parentNode;
			}
		}

		node.$validate = function() {

			var $valid = true;
			var re_int = /^\d+$/;
			var re_hashtag = /^#./;

			foreach(this, function(input) {
				input.$valid = true;
				input.$error = {};
				removeClass(input, "invalid");

				// required
				if (input.hasAttribute("required")) {

					var value = input.$getValue ? input.$getValue() : input.value;

					// int
					if (input.getAttribute("required") === "int" && !re_int.test(value)) {
						input.$valid = false;
					}

					// number
					else if (input.getAttribute("required") === "number" && isNaN(+value)) {
						input.$valid = false;
					}

					// hashtag
					else if (input.getAttribute("required") === "hashtag" && !re_hashtag.test(value)) {
						input.$valid = false;
					}

					else if (input.value === "") {
						input.$valid = false;
					}
				}

				if (input.$valid === false) {
					$valid = false;
					input.$error = {required: true};
					addClass(input, "invalid");
				}
			});

			return $valid;
		};
	}

	if (node.nodeType === 1) {
		return $compile_process_element(node, $scope);
	}
}

function $compile_process_element(el, $scope, to) {
	to = to || el;

	foreach(el.attributes, function(attr) {

		var attrName = attr.name;
		var attrValue = attr.value;
		var prop;

		var directive = $$directiveTable[attrName];
		if (directive) {
			return directive(el, $scope, to);
		}

		directive = module.directive.get(attrName);
		if (directive) {
			return directive(el, $scope, to);
		}


		/// [(value)] : two-way binding...
		if (attrName === "[(value)]") {

			// @FIXME!!!
			$scope.$watch(attrValue, function($scope, el, value) {

				if (el.$setValue) {
					el.$setValue(value);
					return;
				}

				if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
					value = (value === null || value === undefined) ? "" : value;
				}

				// value값 재조정시 커서 이동 문제 발생함.
				if (el.value != value) {
					el["value"] = value;
				}

			}, [to]);

			var parse = $parse(attrValue, $scope.$$);
			el.addEventListener("input", function() {
				var value = el.$getValue ? el.$getValue() : el.value;
				parse.assign($scope, value);
			});

			return;
		}


		// 프로퍼티 접근자. Property e.g) [prop]="value"
		if (attrName.charAt(0) === "[" && attrName.slice(-1) === "]") {

			// attrbute [attr.id]="sss"
			if (attrName.substr(1, 5) === "attr.") {
				prop = attrName.slice(6, -1);
				$scope.$watch(attrValue, function($scope, el, prop, value) {
					value ? el.setAttribute(prop, value) : el.removeAttribute(prop)
				}, [to, prop]);

				return;
			}

			// attrbute [style.id]="sss"
			if (attrName.substr(1, 6) === "style.") {
				prop = attrName.slice(7, -1);
				$scope.$watch(attrValue, function($scope, el, prop, value) {
					el.style[prop] = value;
				}, [to, prop]);

				return;
			}


			// property
			prop = $dashToCamelCase(attrName.slice(1, -1));


			// [visible] 프로퍼티
			if (prop === "visible") {
				$scope.$watch(attrValue, function($scope, el, prop, value) {
					el["hidden"] = !value;
				}, [to, prop]);
				return;
			}

			// [visible] 프로퍼티
			if (prop === "disabled") {
				$scope.$watch(attrValue, function($scope, el, prop, value) {
					value ? el.setAttribute("disabled", "") : el.removeAttribute("disabled");
				}, [to, prop]);
				return;
			}

			// [inner-html] 프로퍼티
			if (attrName === "[inner-html]") {
				prop = "innerHTML";
			}

			$scope.$watch(attrValue, function($scope, el, prop, value) {
				el[prop] = value;
			}, [to, prop]);

			return;
		}


		// (click)
		if (attrName === "(click)") {
			var clickHandler = $parse(attrValue, $scope.$$);

			$touch.bind(to, function() {

				var isActive = true;
				var promise;

				return {
					press: function(e) {
						e.originalEvent.preventDefault();
						return clickHandler($scope);
					},
				}


				return {
					press: function(e) {
						if (!isActive) {
							return;
						}

						to.classList.add("active");
						promise = Promise.resolve();
					},

					release: function() {
						if (!isActive) {
							return;
						}

						function t() {
							to.classList.remove("active");
							isActive = true;
						}

						promise.then(t, t);
					},

					tap: function(event) {
						if (!isActive) {
							return;
						}

						// @FIXME: 임시 event, go, back 연동
						delete $scope.event;
						$scope.event = event;

						$scope.go = window.go;
						$scope.back = window.back;

						promise = promise || Promise.resolve();
						promise = promise.then(function() {
							isActive = false;
							return clickHandler($scope);
						});
					}
				}
			});

			return;
		}

		// 이벤트 핸들러. Event Handler ex) (click)="..."
		if (attrName.charAt(0) === "(" && attrName.slice(-1) === ")") {
			var eventType = $dashToCamelCase(attrName.slice(1, -1));
			parse = $parse(attrValue, $scope.$$);

			to.addEventListener(eventType, function(event) {
				// @FIXME: 임시 event, go, back 연동
				delete $scope.event;
				$scope.event = event;

				$scope.go = window.go;
				$scope.back = window.back;

				return parse($scope);
			});

			return;
		}


		// Reference Syntax
		if (attrName.charAt(0) === "$") {
			prop = $dashToCamelCase(attrName);
			$scope[prop] = el;
			return;
		}


		// attr="{{foo}}"
		if (attrValue.indexOf("{{") >= 0) {

			var scripts = [];
			$interpolate(attrValue, function(text, isExpr, isLast) {
				if (isExpr) {
					var script = text.slice(2, -2);
					scripts.push(script);
				}
				else {
					scripts.push('"' + text.replace(/"/g, '\\"') + '"');
				}
			});
			scripts = scripts.join("+");

			$scope.$watch(scripts, function($scope, value) {
				el.setAttribute(attrName, value)
			});
		}
	});
}


function $compile_process_textNode(textNode, $scope) {
	var value = textNode.nodeValue;

	$interpolate(value, function(text, isExpr, isLast) {
		if (isLast) {
			textNode.nodeValue = text;
			return;
		}

		var _textNode = document.createTextNode(text);
		textNode.parentNode.insertBefore(_textNode, textNode);

		if (isExpr) {
			var script = text.slice(2, -2);
			$scope.$watch(script, __nodeValue, [_textNode]);
		}
	});
}

function __nodeValue($scope, node, value) {
	if (value === null || value === undefined) {
		value = "";
	}

	node.nodeValue = value;
}


var $$directiveTable = {


	/// @TODO: if시 기존에 있던 이벤트 및 컨텐츠 유지 필요!

	"*if": function() {

		function __if($scope, el, placeholder, value) {

			if (value) {
				placeholder.parentNode && placeholder.parentNode.replaceChild(el, placeholder);
			}
			else {
				el.parentNode && el.parentNode.replaceChild(placeholder, el);
			}
		}

		return function(el, $scope) {
			var script = el.getAttribute("*if");
			var placeholder = document.createComment(" if(" + script + "):");
			$scope.$watch(script, __if, [el, placeholder]);
		}
	}(),

	"*template": function() {

		function __template($scope, el, value) {

			var template = document.getElementById(value);
			el.innerHTML = "";
			if (!template) {
				return;
			}

			var content = document.importNode(template.content, true);
			$compile(content, $scope);
			el.appendChild(content);
		}

		return function(el, $scope) {
			var script = el.getAttribute("*template");
			$scope.$watch(script, __template, [el]);
		}
	}(),

	"*repeat": function() {

		function __repeatItem($scope, placeholderStart, repeatNode, placeholderEnd, container, rows, row, index, length) {
			length = length || 0;

			for (var i = length; i < container.length; i++) {
				$removeNode(container[i]);
			}

			var frag = document.createDocumentFragment();

			for (i = container.length; i < length; i++) {
				var $repeatNode = repeatNode.cloneNode(true);
				container[i] = $repeatNode;

				if (row) $scope.$define(row, rows + "[" + i + "]");
				if (index) $scope.$value(index, i);
				$compile($repeatNode, $scope);
				frag.appendChild($repeatNode);
			}

			container.length = length;

			if (frag.childNodes.length) {
				placeholderEnd.parentNode.insertBefore(frag, placeholderEnd);
				$nextFrame(function() {
					placeholderEnd.parentNode.dispatchEvent(new CustomEvent("repeatInsert"));
				})
			}
		}

		return function(el, $scope) {

			var rows, row, index, lastIndex;
			var script = el.getAttribute("*repeat");
			rows = script;

			lastIndex = rows.lastIndexOf(" as ");
			if (lastIndex !== -1) {
				rows = rows.substring(0, lastIndex);
				row = $trim(script.substring(lastIndex + 4));

				lastIndex = row.lastIndexOf(",");
				if (lastIndex !== -1) {
					index = $trim(row.substring(lastIndex + 1));
					row = $trim(row.substring(0, lastIndex));
				}
			}

			var repeatNode = el.cloneNode(true);
			repeatNode.removeAttribute("*repeat");

			var placeholderStart = document.createComment(" repeat(" + script + "): ");
			var placeholderEnd = document.createComment(" endrepeat ");

			var frag = document.createDocumentFragment();
			frag.appendChild(placeholderStart);
			frag.appendChild(placeholderEnd);
			el.parentNode.replaceChild(frag, el);


			// @FIXME: *repeat를 template를 사용하지 않을 경우, 부모 Element가 없어서 에러남
			// template 기반으로 repeat할 수 있도록 수정할 것!

			$scope.$watch(rows + ".length", __repeatItem, [placeholderStart, repeatNode, placeholderEnd, [], rows, row, index]);
			return false;
		}
	}()
};