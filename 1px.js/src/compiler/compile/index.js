import {JSContext} from "../parser/context.js";

import {traverseDOM} from "./compile.util.js";
import {$compile_element_node} from "./compile.element.js";
import {$compile_text_node} from "./compile.text.js";


/// -----------------------------------------------------------------------
/// Compile
/// -----------------------------------------------------------------------
const $compile = (el, context, to) => {
	
	if (!(context instanceof JSContext)) {
		context = new JSContext(context);
	}
	
	if (el.tagName === "TEMPLATE") {
		$compile_element_node(el, context, to);
		el = el.content;
	}
	
	traverseDOM(el, (node) => {
		if (!node) return;
		
		switch (node.nodeType) {
			case Node.ELEMENT_NODE:
				return $compile_element_node(node, context);
			
			case Node.TEXT_NODE:
				return $compile_text_node(node, context);
		}
	});
	
	return context;
};

export {
	traverseDOM,
	$compile
}