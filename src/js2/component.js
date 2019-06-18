import {JSContext, $compile} from "./1px.js";

const $$templetes = Object.create(null);

export class WebComponent extends HTMLElement {
	static define(name, template, cls) {
		let t = document.createElement("body");
		t.innerHTML = template;
		template = t.getElementsByTagName("template")[0];
		$$templetes[name] = template;

		window.customElements.define(name, cls);
	}

	constructor() {
		super();
		this.created();
	}

	connectedCallback() {
		this.$$originalContent = document.createDocumentFragment();
		while (this.childNodes.length) {
			this.$$originalContent.appendChild(this.childNodes[0]);
		}

		let context = JSContext.connect(this);
		this.init(context);


		let name = this.tagName.toLowerCase();
		let template = $$templetes[name];
		if (template) {
			template = template.cloneNode(true);
			$compile(template, context);

			// /// Attach Shady DOM!!
			// let contents = DocumentFragment.from(this.childNodes);
			//
			// // @TODO: select="h1,h2,h3"
			// // for (let content of template.querySelectorAll("content[select]")) {
			// // 	content.remove();
			// // }
			//
			// let content = template.querySelector("content");
			// if (content) {
			// 	content.replaceWith(contents);
			// }
			// this.appendChild(template);


			this.appendChild(template.content);
		}

		this.connected();
	}

	disconnectedCallback() {
		this.innerHTML = "";
		this.appendChild(this.$$originalContent);
		delete this.$$originalContent;
		this.disconnected();
	}

	init() {}

	created() {}

	connected() {}

	disconnected() {}
}