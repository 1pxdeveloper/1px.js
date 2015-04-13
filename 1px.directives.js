/*
 @TODO:
 1. angular가 spec을 참 잘 짰다고 생각한다. 완전 동일하게는 못가져가겠지만 restict라던가 require라던가 template require등은 참조하자.
 2. init, value, update, done 나는 이해하지만 좀더 네이밍을 고민해보자..
  - 특히 value를 이용해서 야메로 처리하는 with, value등도 있고...
  - scope 처리 하는 루틴이라던가..
  - scope는 별도로 만드는게 좋을 듯 싶다.
  - 추후 directive(name).decorator 를 생각하면 이런 방식으로 만들면 decorator를 하기가 너무 힘들어진다.
  - self는 꼭 필요하긴 한데... 고민중..

 3. directive FAST DOM!! read, write를 구분하는 법!!
 */
(function(module, document, undefined) {

	module.directive("controller", ["$controller", function($controller) {
		return {
			init: function(self) {
				self.controller = $controller(self.script);
			},

			value: function(self, el, scope) {
				scope.push(self.controller)
			},

			done: function(self, el, scope) {
				scope.pop();
			}
		}
	}]);

	module.directive("repeat", ["trim", "msie", "removeNode", "create_binding", "$eval", "$compile", "expandoStore", function(trim, msie, removeNode, create_binding, $eval, $compile, expandoStore) {

		var repeat_hanlder = {
			init: function(self, el) {
				/// @FIXME: 이 방법도 수정할 수 있으면 해보자.
				if (self.script === "@") {
					el.removeAttribute("repeat");
					return;
				}

				var rows, row, index, lastIndex, script;
				rows = script = self.script;

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


				var begin = msie > 8 ? document.createTextNode("") : document.createComment("");
				self.placeholder = document.createTextNode("");

				el.parentNode.insertBefore(begin, el);
				el.parentNode.insertBefore(document.createTextNode(""), el);
				el.parentNode.insertBefore(self.placeholder, el);

				el.setAttribute("repeat", "@");
				self.repeatNode = el.cloneNode(true);
				removeNode(el);

				create_binding(begin, 0, "repeat", repeat_item_hanlder, self);
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
		};


		var repeat_item_hanlder = {
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
						frag.appendChild(node);
						$compile(node);

						/// @FIXME: .. 이걸 어떻게 수정할수 있을까?
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
		};

		return repeat_hanlder;
	}]);


	/// @TODO: .. 컨텐츠과 슬롯(select)에 대해서 다시 고민을 할것!!
	/// @TODO 2: template tag과 document.importNode 등의 새로운 API에 대해 검토 해 볼것!!!
	module.directive("template", ["foreach", "extend", "emptyNode", "removeNode", "extractTemplate", "$parse", "$compile", "$update", "$cache", function(foreach, extend, emptyNode, removeNode, extractTemplate, $parse, $compile, $update, $cache) {
		return {
			init: function(self, el) {
				self.templates = {};

				foreach(el.getElementsByTagName("template"), function(node) {
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
				el.innerHTML = "";
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
	}]);

	/// @TODO: with="obj [as alias]" as 기능을 만들어야 한다.
	module.directive("with", ["$eval", function($eval) {
		return {
			value: function(self, el, scope) {
				scope.push($eval(self.script, scope) || {});
			},

			done: function(self, el, scope) {
				scope.pop();
			}
		}
	}]);


	/// @TODO: {value|text}, {value|html} 을 개발하면 너넨 없어질 것이야~

	/// @TODO: nl2br을 적용한다. !! {text} 와는 다르다. {text} 와는...
	module.directive("text", [function() {
		function htmlEntities(str) {
			return (""+str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		function nl2br(text) {
			var breakTag = "<br/>";
			return (""+text).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
		}

		return {
			update: function(self, el, value) {
				el.innerText = nl2br(htmlEntities(value));
			}
		}
	}]);

	/// @TODO: {value|text}, {value|html} 을 개발하면 너넨 없어질 것이야~
	module.directive("html", [function() {
		return {
			update: function(self, el, value) {
				el.innerHTML = value;
			}
		}
	}]);


	/// @TODO: 애매하다;; 에니메이션과 연계하거나 다른 걸로 대체 가능한지 생각해보자. ^hidden과 대체할수 있으나 hidden보다 visible이 직관적이라서...
	module.directive("visible", ["show", "hide", function(show, hide) {
		return {
			value: "boolean",

			update: function(self, el, bool) {
				bool ? show(el) : hide(el);
			}
		}
	}]);


/// @FIXME: @if: DOM에서 완전 사라지고 나타나게 하는 겁니다.
	module.directive("if", ["show", "hide", function(show, hide) {
		return {
			value: "boolean",

			update: function(self, el, bool) {
				bool ? show(el) : hide(el);
			}
		}
	}]);

}($module("1px"), document));
