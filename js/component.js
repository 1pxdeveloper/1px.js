DocumentFragment.from = function(nodes) {
	return Array.from(nodes).reduce((frag, node) => {
		frag.appendChild(node);
		return frag;
	}, document.createDocumentFragment());
};


class WebComponent extends HTMLElement {

	constructor() {
		super();

		/// @FIXME: init async 하게 만들기.. require 옵션 추가하기
		module.component.require(this.tagName, component => {
			Object.setPrototypeOf(component, WebComponent.prototype);
			Object.setPrototypeOf(this, component);
		});
	}

	connectedCallback() {
		let originalContent = Array.from(this.childNodes);

		/// @FIXME: init & template & compile async 하게 만들기

		/// Apply Template Engine
		let o = WebComponentDefine.map[this.tagName];

		/// @FIXME: ... 여기서 굳이 importNode여야 한가?
		let template = document.importNode(o.template.content, true);

		/// @FIXME: private scope;;;;
		/// @FIXME: nextTick dependancy
		let context = JSContext.create(this);
		$compile(template, context);
		this.init(context);
		nextTick.flush(); /// @NOTE: 즉각 업데이트를 하기 위함.

		/// Attach Shady DOM!!
		let contents = DocumentFragment.from(this.childNodes);

		// @TODO: select="h1,h2,h3"
		// for (let content of template.querySelectorAll("content[select]")) {
		// 	content.remove();
		// }

		let content = template.querySelector("content");
		if (content) {
			content.replaceWith(contents);
		}
		this.appendChild(template);


		/// Override disconnected
		this.destroy = () => {
			delete this.destroy;
			context.disconnect();
			while(this.lastChild) this.lastChild.remove();
			this.appendChild(DocumentFragment.from(originalContent));
		};


		/// Override connected Call
		this.connected(...arguments);
	}

	disconnectedCallback() {
		this.destroy();

		/// Override disconnected Call
		this.disconnected(...arguments);
	}

	init() {

	}

	connected() {

	}

	disconnected() {

	}

	destroy() {

	}
}


class WebComponentDefine extends HTMLElement {
	constructor() {
		super();
		let name = this.getAttribute("name");
		if (!name) {
			throw new SyntaxError("name attribute is required.")
		}

		let template = this.querySelector("template");
		WebComponentDefine.map[name.toUpperCase()] = {
			template: template
		};

		if (!window.customElements.get(name)) {
			window.customElements.define(name, class extends WebComponent {
			});
		}
	}

	connectedCallback() {
		this.remove();
	}
}

WebComponentDefine.map = {};
document.addEventListener("DOMContentLoaded", function() {
	window.customElements.define("web-component", WebComponentDefine);
});