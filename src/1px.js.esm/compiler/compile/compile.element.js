import {_} from "../../fp";
import {Observable} from "../../observable";
import {$module} from "../module.js";

import {templateSyntax, renderPipeLine} from "./compile.util.js";


/// -----------------------------------------------------------------------
/// Compile Element
/// -----------------------------------------------------------------------
const localSVG = {};

export function $compile_element_node(el, context, to = el) {
	const tagName = el.tagName.toLowerCase();
	
	if (tagName === "script") return false;
	if (tagName === "style") return false;
	
	
	const attributes = Array.from(el.attributes);
	
	let ret;
	
	const hasTemplateDirective = ["*foreach", "*if", "*else", "*template"].some(attrName => {
		const attr = el.getAttributeNode(attrName);
		if (!attr) return false;
		
		$module.directive.require([attr.nodeName, (directive) => {
			directive(context, el, attr.nodeValue, attr.nodeName)
		}]);
		
		return true;
	});
	
	if (hasTemplateDirective) {
		return false;
	}
	
	
	/// @TODO: make Directive Hook
	if (tagName === "svg") {
		const svg = el;
		
		const loadSVG = () => {
			let src = svg.getAttributeNode("src");
			if (!src || !src.nodeValue) return;
			
			if (src) {
				if (localSVG[src.nodeValue]) {
					svg.replaceWith(localSVG[src.nodeValue]);
				}
				else {
					fetch(src.nodeValue).then(res => res.text()).then(res => {
						
						let template = document.createElement("template");
						template.innerHTML = res;
						localSVG[src.nodeValue] = template.content;
						
						svg.replaceWith(localSVG[src.nodeValue]);
					});
				}
			}
		};
		
		
		const observer = new MutationObserver(function(mutations) {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === "src") {
					loadSVG();
				}
			});
		});
		
		observer.observe(svg, {attributes: true});
		loadSVG();
	}
	
	
	for (const attr of attributes) {
		
		// /// Custom Directives
		// /// @TODO: custom-directive 등록할때 아래처럼 syntax를 등록하는건 어떨까?
		// let customDefaultPrevent = false;
		// $module.directive.require([attr.nodeName, directive => {
		// 	if (typeof directive === "function") {
		// 		let ret = directive(context, el, attr.nodeValue);
		// 		customDefaultPrevent = ret === false;
		// 	}
		// }]);
		// if (customDefaultPrevent) continue;
		
		
		/// Basic Directives
		if (templateSyntax(context, to, attr, "(", _event, ")")) continue;
		if (templateSyntax(context, to, attr, "[attr.", _attr, "]")) continue;
		if (templateSyntax(context, to, attr, "[visible", _visible, "]")) continue;
		if (templateSyntax(context, to, attr, "[class.", _class, "]")) continue;
		if (templateSyntax(context, to, attr, "[style.", _style, "]")) continue;
		// if (templateSyntax(context, to, attr, "[show.", _transition, "]")) continue;
		if (templateSyntax(context, to, attr, "[(", _twoway, ")]")) continue;
		if (templateSyntax(context, to, attr, "[", _prop, "]")) continue;
		if (templateSyntax(context, to, attr, "$", _ref2, "")) continue;
		// if (templateSyntax(context, to, attr, "#", _ref, "")) continue;
		// if (templateSyntax(context, to, attr, ".", _call, ")")) continue;
		
		if (el !== to) {
			to.setAttributeNode(attr.cloneNode(true));
		}
	}
	
	
	/// @TODO: Iframe Component
	// if (tagName === "iframe" && el.hasAttribute("is")) {
	//
	// 	const iframe = el;
	// 	const is = el.getAttribute("is");
	//
	// 	window.customElements.whenDefined(is).then(() => {
	// 		const Component = window.customElements.get(is);
	// 		const component = new Component;
	// 		component.iframe = iframe;
	// 		iframe.contentDocument.body.appendChild(component);
	// 	});
	//
	// 	return false;
	// }
	
	
	/// Bind Controller
	if (el.hasAttribute("is")) {
		$module.controller.require([el.getAttribute("is"), (Controller) => {
			const controller = new Controller;
			const context = $compile(el.content || el.childNodes, controller);
			typeof controller.init === "function" && controller.init(context);
			
			if (el.content) {
				el.replaceWith(el.content);
			}
			
			ret = false;
		}]);
		
		return ret;
	}
}


/// Render From Template Syntax
function _attr(context, el, script, attr) {
	return context(script)
		.pipe(renderPipeLine)
		.tap(value => (value || _.isStringLike(value)) ? el.setAttribute(attr, value) : el.removeAttribute(attr))
		.catchError()
		.subscribe()
}

function _class(context, el, script, name) {
	return context(script)
		.mergeMap(value => Observable.castAsync(value))
		.pipe(renderPipeLine)
		.tap(value => value ? el.classList.add(name) : el.classList.remove(name))
		.catchError()
		.subscribe()
}

function _style(context, el, script, name) {
	const [prop, unit = ""] = name.split(".", 2);
	
	return context(script)
		.pipe(renderPipeLine)
		.map(value => {
			switch (unit) {
				case "url":
					return "url('" + encodeURI(value) + "')";
				
				default:
					return value + unit;
			}
		})
		.tap(value => el.style[prop] = value)
		.catchError()
		.subscribe();
}

function _visible(context, el, script) {
	return context(script)
		.pipe(renderPipeLine)
		.tap(value => el.hidden = !value)
		.catchError()
		.subscribe();
}

function _prop(context, el, script, prop) {
	return context(script)
	// .pipe(renderPipeLine) // @TODO: hasOwnProperty가 없는데 HTMLElement가 가지고 있는 경우에는 renderPipe를 통해야함. ex) id, src 등...
		.tap(value => el[prop] = value)
		.catchError()
		.subscribe();
}


function _twoway(context, el, script, value) {
	
	let [prop, eventType, ...options] = value.split(".");
	
	context.fromEvent(el, eventType || "input")
		.mergeMap(() => context.assign(script, el[prop]))
		.subscribe();
	
	return context(script)
		.reject(_.isUndefined)
		.reject(value => el[prop] === value)
		.tap(value => el[prop] = value)
		.catchError()
		.subscribe();
}


function _ref2(context, el, script, name) {
	context.state["$" + name] = el;
}


Event.pipes = {
	prevent: $ => $.tap(e => e.preventDefault()),
	stop: $ => $.tap(e => e.stopPropagation()),
	capture: $ => $,
	self: ($, element) => $.filter(e => e.target === element),
	once: $ => $.take(1),
	shift: $ => $.filter(e => e.shiftKey),
	alt: $ => $.filter(e => e.altKey),
	ctrl: $ => $.filter(e => e.ctrlKey),
	meta: $ => $.filter(e => e.metaKey),
	cmd: $ => $.filter(e => e.ctrlKey || e.metaKey)
};


function _event(context, el, script, value) {
	
	let [type, ...options] = value.split(/\s*\|\s*/);
	const useCapture = options.includes("capture");
	
	/// @FIXME: Keyboard Event
	let keys = [];
	if (type.startsWith("keydown") || type.startsWith("keypress") || type.startsWith("keyup")) {
		[type, ...keys] = type.split(".");
	}
	
	/// Normal Event
	let event$ = context.fromEvent(el, type, useCapture);
	if (keys.length) {
		event$ = event$.filter(e => keys.includes(e.key.toLowerCase()))
	}
	
	/// Event Pipe
	options.forEach(pipe => {
		let handler = Event.pipes[pipe];
		if (!handler) throw new Error(pipe + " is not registered event pipe.");
		event$ = handler(event$, el);
	});
	
	/// Event Handler
	return event$
		.mergeMap(event => context.fork({event, el}).evaluate(script))
		.mergeMap(ret => Observable.castAsync(ret))
		.catchError()
		.subscribe()
}