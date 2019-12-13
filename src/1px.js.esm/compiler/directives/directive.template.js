import {$module} from "../module.js";
import {$compile} from "../compile";


/// Default Template Directive
$module.directive("*template", function() {
	
	return function(context, el, script) {
		el.removeAttribute("*template");
		
		context(script)
			.map(id => document.querySelector("template#" + id))
			.filter(template => template)
			.map(template => template.cloneNode(true))
			.tap(template => {
				$compile(template.content, context);
				el.innerHTML = "";
				el.appendChild(template.content)
			})
			.subscribe();
	}
});