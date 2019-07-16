(function() {
	const {$module} = require("./1px.module");
	const {JSContext} = require("./parse");
	
	
	function traverse(node, fn) {
		fn = fn || noop;
		
		let stack = [];
		while(node) {
			node = fn(node) === false ? stack.pop() : node.firstChild || stack.pop();
			node && node.nextSibling && stack.push(node.nextSibling);
		}
	}
	
	
	/// ELEMENT_NODE
	function compile_element_node(el, context, to) {
		to = to || el;
		
		switch (el.tagName) {
			case "STYLE":
			case "SCRIPT":
				return false;
		}
		
		/// @NOTE: FORM Submit 방지
		if (el.tagName === "FORM") {
			if (!el.hasAttribute("method") && !el.hasAttribute("action")) {
				context.on$(el, "submit").subscribe(event => event.preventDefault());
				el.submit = function() {
					this.dispatchEvent(new CustomEvent("submit"));
				};
			}
			
			// @TODO: validate, keyenter -> submit, etc...
		}
		
		
		/// @FIXME:... default template directive
		let hasTemplateDirective = ["*foreach", "*if", "*else"].some(attrName => {
			let hasAttr = el.hasAttribute(attrName);
			if (hasAttr) {
				let attrValue = el.getAttribute(attrName);
				$module.directive.require([attrName, directive => directive(context, el, attrValue)]);
			}
			return hasAttr;
		});
		
		
		if (hasTemplateDirective) {
			return false;
		}
		
		/// Attribute directive
		for (let attr of Array.from(el.attributes)) {
			
			/// Custom directives
			let customDefaultPrevent = false;
			$module.directive.require([attr.nodeName, directive => {
				if (typeof directive === "function") {
					let ret = directive(context, el, attr.nodeValue);
					customDefaultPrevent = ret === false;
				}
			}]);
			if (customDefaultPrevent) continue;
			
			
			/// Basic directives
			if (syntax(context, to, attr, "#", _ref, "")) continue;
			if (syntax(context, to, attr, "$", _ref2, "")) continue;
			if (syntax(context, to, attr, "(", _event, ")")) continue;
			if (syntax(context, to, attr, "[(", _twoway, ")]")) continue;
			if (syntax(context, to, attr, "[attr.", _attr, "]")) continue;
			if (syntax(context, to, attr, "[style.", _style, "]")) continue;
			if (syntax(context, to, attr, "[class.", _class, "]")) continue;
			if (syntax(context, to, attr, "[", _prop, "]")) continue;
		}
	}
	
	/// @FIXME...
	function syntax(context, el, attr, start, fn, end) {
		let name = attr.nodeName;
		let value = attr.nodeValue;
		
		if (end === "" && name.startsWith(start) && name.endsWith(end)) {
			fn(context, el, value, name.slice(start.length));
			// el.removeAttributeNode(attr); // @TODO: DEBUG mode
			return true;
		}
		
		if (end !== undefined && name.startsWith(start) && name.endsWith(end)) {
			fn(context, el, value, name.slice(start.length, -end.length));
			// el.removeAttributeNode(attr);
			return true;
		}
		
		if (name === start) {
			fn(context, el, value);
			// el.removeAttributeNode(attr);
			return true;
		}
	}
	
	// function _getOptions(value) {
	// 	return options.reduce((o, option) => {
	// 		o[option] = true;
	// 		return o;
	// 	}, Object.create(null));
	// }
	
	
	function _prop(context, el, script, prop) {
		context.watch$(script, value => el[prop] = value);
	}
	
	function _event(context, el, script, value) {
		
		let [type, ...options] = value.split("|");
		let useCapture = options.indexOf("capture") >= 0;
		
		let event;
		let o$ = context.on$(el, type, useCapture).do(e => event = e);
		o$.element = el;
		
		options.forEach(pipe => {
			let handler = Event.pipes[pipe] || Event.pipes["*"];
			if (!handler) throw new Error(pipe + " is not registered event pipe.");
			o$ = handler(o$);
			o$.element = el;
		});
		
		o$.subscribe(function(event) {
			context.local.event = event;
			context.evaluate(script);
		});
	}
	
	/// two-way
	function _twoway(context, el, script, value) {
		
		let [prop, ...options] = value.split(".");
		
		options = options.reduce((o, option) => {
			o[option] = true;
			return o;
		}, Object.create(null));
		
		
		context.watch$(script, value => el[prop] = value);
		context.on$(el, options.change ? "change" : "input").subscribe(function() {
			context.assign(script, el[prop]);
		});
	}
	
	function _attr(context, el, script, attr) {
		context.watch$(script, value => {
			if (value === undefined || value === false || value === null) {
				el.removeAttribute(attr);
			}
			else {
				el.setAttribute(attr, value)
			}
		});
	}
	
	function _style(context, el, script, name) {
		
		let [prop, unit] = name.split(".", 2);
		unit = unit || "";
		
		context.watch$(script, value => {
			switch (unit) {
				case "url":
					value = "url('" + encodeURIComponent(value) + "')";
					break;
				
				default:
					value = value + unit;
					break;
			}
			
			el.style[prop] = value;
		});
	}
	
	function _class(context, el, script, name) {
		context.watch$(script, value => {
			value ? el.classList.add(name) : el.classList.remove(name);
		});
	}
	
	function _ref(context, el, script, name) {
		context.local[name] = el;
	}
	
	function _ref2(context, el, script, name) {
		context.global["$" + name] = el;
	}
	
	/// TEXT_NODE
	function _nodeValue(value) {
		/// HTML Element
		if (this.__node) {
			this.__node.forEach(node => node.remove());
			delete this.__node;
		}
		
		if (value instanceof Node) {
			this.nodeValue = "";
			this.__node = Array.from(value.childNodes || [value]).slice();
			this.before(value);
			return;
		}
		
		this.nodeValue = value === undefined ? "" : value;
		//			domChanged(textNode.parentNode);
	}
	
	function compile_text_node(textNode, context) {
		let index = textNode.nodeValue.indexOf("{{");
		
		while(index >= 0) {
			textNode = textNode.splitText(index);
			
			index = textNode.nodeValue.indexOf("}}");
			if (index === -1) return;
			
			let next = textNode.splitText(index + 2);
			let script = textNode.nodeValue.slice(2, -2);
			context.watch$(script, _nodeValue.bind(textNode));
			
			textNode = next;
			index = textNode.nodeValue.indexOf("{{");
		}
	}
	
	
	function $compile(el, context, if_template_to) {
		if_template_to = if_template_to || el;
		
		if (arguments.length === 1) {
			context = context || new JSContext(el);
		}
		if (!(context instanceof JSContext)) {
			context = new JSContext(context);
		}
		
		if (el.tagName === "TEMPLATE") {
			compile_element_node(el, context, if_template_to);
			el = el.content;
		}
		
		traverse(el, node => {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					return compile_element_node(node, context);
				
				case Node.TEXT_NODE:
					return compile_text_node(node, context);
			}
		});
		
		return el;
	}
	
	
	/// @TODO: selector가 el일때 처리. block이 object일 때, el이 1개일때, 여려개일때 각각 처리...

	$module.compile = function(selector, block) {
		
		let elements = Array.from(document.querySelectorAll(selector));
		elements.forEach(el => {
			$module.require(block, function(value) {
				$compile(el, value);
				
				if (el.tagName === "TEMPLATE") {
					el.before(el.content);
					el.remove();
				}
			});
		});
		
		return elements;
	};
	
	exports.$compile = $compile;
})();

