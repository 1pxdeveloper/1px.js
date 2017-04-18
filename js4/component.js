DocumentFragment.from = function(nodes) {
	return Array.from(nodes).reduce((frag, node) => frag.appendChild(node) && frag, document.createDocumentFragment());
};

class WebComponent extends HTMLElement {

	constructor() {
		super();

		/// Link Component
		let component = module.component.get(this.tagName) || {};
		Object.setPrototypeOf(component, WebComponent.prototype);
		Object.setPrototypeOf(this, component);
	}

	connectedCallback() {
		let originalContent = Array.from(this.childNodes);

		/// Apply Template Engine
		let o = WebComponentDefine.map[this.tagName];
		let template = document.importNode(o.template.content, true);

		this.init();

		console.log("init");

		let scope = new Scope(this);
		compile(template, scope);

//			this.watch$ = scope.watch$.bind(scope);
//			this.on$ = scope.on$.bind(scope);


		/// Attach Shady DOM!!
		let contents = DocumentFragment.from(this.childNodes);

		// @TODO:
		for (let content of template.querySelectorAll("content[select]")) {
			console.log("content[select]", content);
			content.remove();
		}

		let content = template.querySelector("content");
		if (content) {
			content.replaceWith(contents);
		}

		this.appendChild(template);


		/// Override disconnected
		this.destroy = function() {
			scope.stop();
			let node;
			while (node = this.lastChild) { node.remove(); }
			this.appendChild(DocumentFragment.from(originalContent));
			delete this.destroy;
		};
	}

	disconnectedCallback() {
		this.destroy();
	}

	init() {}

	destroy() {}
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
			window.customElements.define(name, class extends WebComponent {});
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