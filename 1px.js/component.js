(function() {
	"use strict";
	
	const {JSContext, $compile} = require("./compile");
	
	const $$templates = Object.create(null);
	
	class WebComponent extends HTMLElement {
		
		/// @TODO: template 연동은 임시..
		static template() {
			let html = String.raw(...arguments);
			let wrap = document.createElement("template");
			wrap.innerHTML = html;
			
			let template = wrap.content.querySelector("template") || wrap;
			$$templates[WebComponent.template.tagName] = template;
			console.log(WebComponent.template.tagName, $$templates[WebComponent.template.tagName]);
			
			return template;
		}
		
		static templateSelector(selector) {
			console.log(WebComponent.template.tagName, document.querySelector(selector));
			$$templates[WebComponent.template.tagName] = document.querySelector(selector);
		}
		
		constructor() {
			super();
			this.created();
		}
		
		connectedCallback() {
			this.$$originalContent = Array.from(this.childNodes);

			let context = JSContext.connect(this);
			let template = $$templates[this.tagName.toLowerCase()];

			/// inline-template 기능
			if (this.hasAttribute("inline-template")) {
				template = document.createElement("template");
				template.innerHTML = this.innerHTML;
				for (let attr of this.attributes) {
					template.setAttributeNode(attr.cloneNode(true));
				}
			}
			
			/// template 상속
			else if (!template && this.constructor.$template) {
				template = this.constructor.$template;
			}
			
			if (template) {
				template = template.cloneNode(true);
				$compile(template, context, this);
				
				for (let slot of template.content.querySelectorAll("slot[name]")) {
					let slotName = slot.getAttribute("name");
					let contents = DocumentFragment.from(this.querySelectorAll(`[slot="${slotName}"]`));
					slot.replaceWith(contents);
				}
				
				for (let slot of template.content.querySelectorAll("slot")) {
					let contents = DocumentFragment.from(this.childNodes);
					console.log(slot, contents);
					slot.replaceWith(contents);
				}
				
				this.innerHTML = "";
				this.appendChild(template.content);
			}
			
			this.$ = context;
			this.init(context);
			this.connected();
		}
		
		disconnectedCallback() {
			this.innerHTML = "";
			this.appendChild(DocumentFragment.from(this.$$originalContent));
			delete this.$$originalContent;
			this.$.disconnect();
			this.disconnected();
		}
		
		init() {}
		
		created() {}
		
		connected() {}
		
		disconnected() {}
	}
	
	exports.WebComponent = WebComponent;
})();

