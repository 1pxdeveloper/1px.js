app.$templates = {};
app.$components = {};

app.component = function(name, factory) {
	app.$components[name] = factory;
};


//////// Template Engine
function $replaceTemplateContents(template, el) {

	$traversal(template, null, function(node) {
		node.isShadyDOM = true;
	});

	var contents = template.querySelectorAll("content");
	var contents_noselect = [];

	// <content select=""></content>
	foreach(contents, function(content) {
		var select = content.getAttribute("select");
		if (!select) {
			contents_noselect.push(content);
			return;
		}

		var frag = document.createDocumentFragment();
		var nodeList = el.querySelectorAll(select);
		foreach(nodeList, function(node) {
			// @NOTE: <content>의 select는 자식 노드에만 해당된다.
			if (node.parentNode !== el) {
				return;
			}

			frag.appendChild(node);
		});

		content.parentNode.replaceChild(frag, content);
	});


	// <content></content>
	foreach(contents_noselect, function(content) {
		var frag = document.createDocumentFragment();
		while (el.firstChild) {
			frag.appendChild(el.firstChild);
		}

		content.parentNode.replaceChild(frag, content);
	});

	return template;
}


function $bindLinkFunction(element, linkFn) {
	if (!linkFn) {
		return;
	}

	var controllerFactory = createFactory(linkFn);
	controllerFactory.$inject.values["self"] = element;

	var controller = module.invoke(controllerFactory);

	for (var prop in controller) {
		if (controller.hasOwnProperty(prop)) {
			element[prop] = controller[prop];
		}
	}

	if (typeof element.init === "function") {
		element.init();
	}
}

function $createWebComponent(name, template, _extends) {

	var prototype = {

		attachedCallback: function() {
			var self = this;

			// 현재 컨텐츠 보관
			var originalContents = [];
			var templates = {};
			foreach(this.childNodes, function(node) {
				originalContents.push(node);

				if (node.tagName === "TEMPLATE") {
					var name = node.getAttribute("name");
					templates[name] = node;
				}
			});
			this.$$originalContents = originalContents;
			this.$$templates = templates;

			/// 템플릿 컴파일
			var tmpl = document.importNode(template.content, true);


			// <slot> <-> <template> 적용
			$traversal(tmpl, null, function(node) {
				if (node.tagName === "SLOT") {

					var name = node.getAttribute("name");
					if (!self.$$templates[name]) {
						node.parentNode.removeChild(node);
						return;
					}

					var t = document.importNode(self.$$templates[name].content, true);
					node.parentNode.replaceChild(t, node);
				}
			});

			$compile(tmpl, this);
			$compile_process_element(template, this, this);


			// 컨트롤러 연동
			$bindLinkFunction(this, app.$components[name]);

			/// <content select="">에 따라 재구성 후 렌더링
			var content = $replaceTemplateContents(tmpl, this);

			this.innerHTML = "";
			this.appendChild(content);
		},

		detachedCallback: function() {

			// 소멸자 호출
			if (typeof this.$destroy === "function") {
				this.$destroy();
			}

			/// 기존 컨텐츠로 원복한다.
			var frag = document.createDocumentFragment();
			foreach(this.$$originalContents, function(node) {
				frag.appendChild(node);
			});

			this.innerHTML = "";
			this.appendChild(frag);

			delete this.$$originalContents;
		},


		/// JSContext 기능
		createdCallback: function() {
			this.$$ = {};
			this.$value("this", this);
			this.$$template = app.$templates[this.tagName.toLowerCase()];
		},

		$value: function(name, value) {
			this.$$[name] = {
				type: "(literal)",
				value: value
			}
		},

		$define: function(name, value) {
			this.$$[name] = {
				type: "(macro)",
				value: value
			}
		},

		$watch: function(script, callback, args) {
			var def = this.$$;
			return $$watch(script, this, callback, args, def);
		}
	};

	return $registerElement(name, prototype, _extends);
}


$registerElement("web-component", {

	createdCallback: function() {
		var name = this.getAttribute("name").toLocaleLowerCase();
		var template = this.querySelector("template");
		var _extends = this.getAttribute("extends");

		app.$templates[name] = template;
		$createWebComponent(name, template, _extends);
	}
});


$registerElement("dom-bind", {

	attachedCallback: function() {

		var template = this;
		var name = this.getAttribute("link");

		/// 템플릿 컴파일
		var tmpl = document.importNode(template.content, true);
		$compile(tmpl, this);

		// 컨트롤러 연동
		$bindLinkFunction(this, app.$components[name]);
		this.parentNode.replaceChild(tmpl, this);
	},

	/// JSContext 기능
	createdCallback: function() {
		this.$$ = {};
		this.$value("this", this);
		this.$$template = app.$templates[this.tagName.toLowerCase()];
	},

	$value: function(name, value) {
		this.$$[name] = {
			type: "(literal)",
			value: value
		}
	},

	$define: function(name, value) {
		this.$$[name] = {
			type: "(macro)",
			value: value
		}
	},

	$watch: function(script, callback, args) {
		var def = this.$$;
		return $$watch(script, this, callback, args, def);
	}


}, "template");


$registerElement("dom-placeholder", {

	attachedCallback: function() {
		var placeholderStart = document.createComment("");
		var placeholderEnd = document.createComment("");
		var frag = document.createDocumentFragment();
		frag.appendChild(placeholderStart);
		frag.appendChild(placeholderEnd);

		this.parentNode.replaceChild(frag, this);
	}

});