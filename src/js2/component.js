(function() {
	"use strict";
	
	const {JSContext, $compile} = require("./compile");
	
	const $$templates = Object.create(null);
	
	class WebComponent extends HTMLElement {

		/// @TODO: template 연동은 임시..
		static template() {
			let html = String.raw(...arguments);
			let wrap = document.createElement("body");
			wrap.innerHTML = html;
			$$templates[WebComponent.template.tagName] = wrap.getElementsByTagName("template")[0];
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
			this.$$originalContent = document.createDocumentFragment();
			while(this.childNodes.length) {
				this.$$originalContent.appendChild(this.childNodes[0]);
			}
			
			let context = JSContext.connect(this);
			this.init(context);
			
			
			let name = this.tagName.toLowerCase();
			let template = $$templates[name];
			
			console.log(template);
			
			
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
	
	exports.WebComponent = WebComponent;
	
})();

