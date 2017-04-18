module.require(function($parse, $compile, $$makeFragment) {

	var ELEMENT_NODE = 1;

	/// registerElement
	function $$registerElement(tagName, prototype, tag) {
		var proto = tag ? document.createElement(tag).__proto__ : HTMLElement.prototype;
		prototype = Object.assign(Object.create(proto), prototype);
		document.registerElement(tagName, {prototype: prototype, extends: tag});
	}

	/// createShadyDOM with <content>
	function $$createShadyDOM(el, template, scope) {
		var frag = $$makeFragment(Array.from(el.childNodes));

		/// <content select="foo">
		foreach(template.querySelectorAll("content[select]"), function(content) {
			var select = content.getAttribute("select");
			var selected = Array.from(frag.children).filter(function(node) {
				return node.matches(select);
			});

			foreach(selected, function(node) {
				if (node.nodeType !== ELEMENT_NODE) return;
				$compile(content, scope, node);
			});

			content.parentNode.replaceChild($$makeFragment(selected), content);
		});

		/// <content></content>
		foreach(template.querySelectorAll("content"), function(content) {
			foreach(frag.childNodes, function(node) {
				//console.log("@@@", content, node);

				if (node.nodeType !== ELEMENT_NODE) return;
				$compile(content, scope, node);
			});
			content.parentNode.replaceChild(frag, content);
		});

		el.innerHTML = "";
		el.appendChild(template);
	}

	function makeAutoEventListener(element) {
		var addEventListener = element.addEventListener;

		element.addEventListener = function() {
			addEventListener.apply(this, arguments);
			this.addEventListener.$listeners.push(arguments);
		};
		element.addEventListener.$listeners = [];

		return function() {
			foreach(this.addEventListener.$listeners, function(args) {
				this.removeEventListener.apply(this, args);
			}, this);

			delete this.addEventListener;
		}
	}


	/// <web-component name="my-component" extends?="basetag">
	$$registerElement("web-component", {
		createdCallback: function() {
			var $tagName = this.getAttribute("name");
			var $baseTag = this.getAttribute("extends");
			var $template = this.querySelector("template");
			var $templates = this.querySelectorAll("template");

			/// Create Template Map
			foreach($templates, function(template) {
				var id = template.getAttribute("id");
				if (id) {
					module.value("#" + id, template);
				}
			});

			var prototype = {
				init: function() {},
				destroy: function() {},

				get: function(script) {
					return $parse(script)(this);
				},

				set: function(script, value) {
					return $parse(script).assign(this, value);
				},

				emit: function(event, detail) {
					return this.dispatchEvent(new CustomEvent(event, {
						bubbles: true,
						cancelable: true,
						detail: detail
					}));
				},

				detachedCallback: function() {
					/// @TODO: flag를 만들어서 진짜 detach가 되었을 때만 아래 루틴이 타면, 혹시나 destroy 그냥 실행시키는 문제를 해결할수 있겠
					this.destroy();
				},

				attachedCallback: function() {
					//console.log("attached!!", this);

					var originalContent = Array.from(this.childNodes);
					this.$content = originalContent;

					/// @TODO: 여기 순서랑 코드 좀 정리하자!!!

					var removeAutoAutoEventListener = makeAutoEventListener(this);
					module.component.create(this);

					var template = document.importNode($template.content, true);
					var program = $compile(template, this, this, $template);
					$$createShadyDOM(this, template, program.scope);

					// @FIXME:...
					this.watch = function() {
						program.scope.watch.apply(program.scope, arguments);
						if (program.is_running) {
							program.start();
						}
					};

					this.init();
					program.start();

					/// Destory Callback
					var destroy = this.destroy;

					this.destroy = function() {
						destroy.apply(this, arguments);

						/// @TODO: flag를 만들어서 진짜 detach가 되었을 때만 아래 루틴이 타면, 혹시나 destroy 그냥 실행시키는 문제를 해결할수 있겠
						if (false) {
							return;
						}

						/// Remove all event listeners
						removeAutoAutoEventListener();

						/// Unwatch All
						program.stop();

						/// Rollback original content
						this.innerHTML = "";
						this.appendChild($$makeFragment(originalContent));

						this.destroy = destroy;
					}
				}
			};

			$$registerElement($tagName, prototype, $baseTag);
		}
	});
});
