import {JSContext} from "../parser/context.js";

import {traverseDOM} from "./compile.util.js";
import {$compile_element_node} from "./compile.element.js";
import {$compile_text_node} from "./compile.text.js";

import {$module} from "../module.js";


/// -----------------------------------------------------------------------
/// Compile
/// -----------------------------------------------------------------------
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function $compile(el, context, to) {
	
	if (!(context instanceof JSContext)) {
		context = new JSContext(context);
	}
	
	if (el.tagName === "TEMPLATE") {
		$compile_element_node(el, context, to);
		el = el.content;
	}
	
	traverseDOM(el, (node) => {
		if (!node) return false;
		
		switch (node.nodeType) {
			case ELEMENT_NODE:
				return $compile_element_node(node, context);
			
			case TEXT_NODE:
				return $compile_text_node(node, context);
		}
	});
	
	return context;
}

export {
	traverseDOM,
	$compile
}

/// @FIXME:
$module.compile = $compile;