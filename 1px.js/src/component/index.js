import {$module, makeInjectable} from "../compiler/module.js";
import {$compile} from "../compiler/compile";

export class WebComponent extends HTMLElement {
	
	connectedCallback() {
		
		/// @FIXME: Make Once
		if (this.__connected) {
			this.connected();
			return;
		}
		this.__connected = true;
		
		
		/// Load Template
		const html = this.hasAttribute("inline-template") ?
			this.innerHTML :
			this.constructor.templateHTML;
		
		const wrap = document.createElement("template");
		wrap.innerHTML = html || "";
		const template = wrap.content.querySelector("template") || wrap;
		
		
		/// Compile
		const context = $compile(template, this, this);
		
		/// Import Template
		const frag = document.createDocumentFragment();
		for (const node of Array.from(this.childNodes)) {
			frag.appendChild(node);
		}
		this.appendChild(template.content);
		
		
		/// Import Content
		for (const content of Array.from(this.querySelectorAll("content"))) {
			content.replaceWith(frag);
		}
		
		/// Init Component
		this.init(context);
		this.connected();
	}
	
	init() {}
	
	connected() {}
}

$module.component = function(name, callback) {
	
	const decorator = Object.create(null);
	const _callback = callback.bind(decorator);
	_callback.$inject = makeInjectable(callback).$inject;
	
	return $module.require(_callback, Component => {
		Component = Component || class extends WebComponent {};
		Object.assign(Component, decorator);
		
		window.customElements.define(name, Component);
	})
};


$module.value("JSContext", {});
$module.value("WebComponent", WebComponent);