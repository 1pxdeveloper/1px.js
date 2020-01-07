import {_} from "../../fp";
import {Observable} from "../../observable";


/// -----------------------------------------------------------------------
/// traverseDOM
/// -----------------------------------------------------------------------
export const traverseDOM = (node, callback) => {
	if (!node) return;
	
	const queue = ("length" in node) ? Array.from(node) : [node];
	
	while(queue.length) {
		node = queue.shift();
		
		if (!node) continue;
		
		// Option: Closing,
		if (typeof node === "function") {
			node();
			continue;
		}
		
		// Option: Skip children,
		let ret = callback(node);
		if (ret === false) {
			continue;
		}
		
		// Traverse ChildNodes
		if (node.childNodes) {
			if (typeof ret === "function") queue.unshift(ret);
			queue.unshift.apply(queue, node.childNodes);
		}
	}
};


/// -----------------------------------------------------------------------
/// templateSyntax
/// -----------------------------------------------------------------------
export const templateSyntax = (context, el, attr, start, callback, end) => {
	const {nodeName, nodeValue} = attr;
	
	if (nodeName.startsWith(start) && nodeName.endsWith(end)) {
		callback(context, el, nodeValue, nodeName.slice(start.length, -end.length || undefined));
		// el.removeAttributeNode(attr); // @TODO: DEBUG mode
		return true;
	}
};


/// -----------------------------------------------------------------------
/// renderPipeLine
/// -----------------------------------------------------------------------
const rAF$ = (value) => new Observable(observer => {
	
	if (document.readyState !== "complete") {
		observer.next(value);
		observer.complete();
		return;
	}
	
	return _.rAF((t) => {
		observer.next(value);
		observer.complete();
	});
});


export const renderPipeLine = $ => $.distinctUntilChanged().switchMap(rAF$);
