/// -----------------------------------------------------------------------
/// Text Node
/// -----------------------------------------------------------------------
import {renderPipeLine} from "./compile.util.js";


function _nodeValue(node, value) {
	
	/// HTML Element
	if (node.__node__) {
		node.__node__.remove();
		delete node.__node__;
	}
	
	if (Object(value) !== value) {
		node.nodeValue = value === undefined ? "" : value;
		return;
	}
	
	if (value instanceof DocumentFragment) {
		node.nodeValue = "";
		const content = value.cloneNode(true);
		const ref = Array.from(content.childNodes);
		node.__node__ = {remove: () => ref.forEach(node => node.remove())};
		node.before(content);
		return;
	}
	
	if (value instanceof Text) {
		node.nodeValue = value.nodeValue;
		return;
	}
	
	if (value instanceof Element) {
		node.nodeValue = "";
		node.__node__ = value.cloneNode(true);
		node.before(value);
		return;
	}
}


export function $compile_text_node(node, context) {
	let index = node.nodeValue.indexOf("{{");
	
	while(index >= 0) {
		node = node.splitText(index);
		index = node.nodeValue.indexOf("}}");
		if (index === -1) return;
		
		let next = node.splitText(index + 2);
		let script = node.nodeValue.slice(2, -2);
		node.nodeValue = "";
		context(script).pipe(renderPipeLine).subscribe(_nodeValue.bind(null, node));
		
		node = next;
		index = node.nodeValue.indexOf("{{");
	}
}