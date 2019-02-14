function traverse(node, fn) {
	fn = fn || noop;

	let stack = [];
	while(node) {
		node = fn(node) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
}

function $compile(el, context) {

	context = context || new JSContext(el);

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


/// ELEMENT_NODE
function compile_element_node(el, context) {
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
	let hasTemplateDirective = ["*repeat", "*if", "*else"].some(attrName => {
		let hasAttr = el.hasAttribute(attrName);
		if (hasAttr) {
			let attrValue = el.getAttribute(attrName);
			module.directive.require(attrName, directive => directive(context, el, attrValue));
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
		module.directive.require(attr.nodeName, directive => {
			if (typeof directive === "function") {
				let ret = directive(context, el, attr.nodeValue);
				customDefaultPrevent = ret === false;
			}
		});
		if (customDefaultPrevent) continue;


		/// Basic directives
		if (syntax(context, el, attr, "#", _ref, "")) continue;
		if (syntax(context, el, attr, "(", _event, ")")) continue;
		if (syntax(context, el, attr, "[(", _twoway, ")]")) continue;
		if (syntax(context, el, attr, "[attr.", _attr, "]")) continue;
		if (syntax(context, el, attr, "[style.", _style, "]")) continue;
		if (syntax(context, el, attr, "[class.", _class, "]")) continue;
		if (syntax(context, el, attr, "[", _prop, "]")) continue;
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
	context.watch$(script, value => _value = el[prop] = value);
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
		if (value === undefined || value === false || value === null) el.removeAttribute(attr);
		else el.setAttribute(attr, value)
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


/// Default Template Directive
module.directive("*repeat", function() {

	function LCS(s1, s2) {
		s1 = s1 || [];
		s2 = s2 || [];

		let M = [];
		for (let i = 0; i <= s1.length; i++) {
			M.push([]);

			for (let j = 0; j <= s2.length; j++) {
				let currValue = 0;
				if (i === 0 || j === 0) {
					currValue = 0;
				} else if (s1[i - 1] === s2[j - 1]) {
					currValue = M[i - 1][j - 1] + 1;
				} else {
					currValue = Math.max(M[i][j - 1], M[i - 1][j]);
				}

				M[i].push(currValue);
			}
		}

		let i = s1.length;
		let j = s2.length;

		// let s3 = [];
		let s4 = [];
		let s5 = [];

		while(M[i][j] > 0) {
			if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
				// s3.unshift(s1[i - 1]);

				s4[i - 1] = s1[i - 1];
				s5[j - 1] = s1[i - 1];

				i--;
				j--;
			} else if (M[i - 1][j] > M[i][j - 1]) {
				i--;
			} else {
				j--;
			}
		}

		return [s4, s5];
	}

	/// @FIXME: 고급스럽게 전환하기
	function createRepeatNode(repeatNode, context, row, index, value, i) {
		let node = repeatNode.cloneNode(true);
		let _context = context.fork();

		row && (_context.local[row] = value);
		index && (_context.local[index] = i);

		$compile(node, _context);

		return {
			index: i,
			value: value,
			node: node,
			context: _context,
		}
	}

	return function(context, el, script) {

		/// Prepare Placeholder
		let placeholder = document.createComment("repeat: " + script);
		let placeholderEnd = document.createComment("endrepeat");
		let repeatNode = el.cloneNode(true);
		repeatNode.removeAttribute("*repeat");

		el.before(placeholder);
		el.replaceWith(placeholderEnd);


		////
		let container = [];
		let prevArray = [];

		context.watch$(script, array => {

			/// @FIXME: 고급스럽게 전환하기
			let [$row, $index] = array["@@keys"];
			array = array.map(v => v["@@entries"][0]);


			/// LCS 알고리즘을 통해 삭제할 노드와 남길 노드를 분리한다.
			let [d, e] = LCS(prevArray, array);

			let fixed_container = [];
			let values_for_reuse = [];

			prevArray.forEach((value, index) => {
				if (d[index] === undefined) {
					values_for_reuse[index] = value;
					container[index].context.disconnect();
					container[index].node.remove();
				} else {
					fixed_container.push(container[index]);
				}
			});
			fixed_container.push({node: placeholderEnd});


			/// 변경되지 않는 노드를 중심으로 새로운 노드들을 추가/재배치 한다.
			let placeholder_index = 0;
			let placeholder = fixed_container[placeholder_index].node;

			container = array.map((value, index) => {
				if (e[index] === undefined) {
					let idx = values_for_reuse.indexOf(value);
					let r = container[idx];
					if (r) {
						placeholder.before(r.node);
						delete container[idx];
					} else {
						r = createRepeatNode(repeatNode, context, $row, $index, value, index);
						placeholder.before(r.node);
					}

					return r;
				}

				let r = fixed_container[placeholder_index];
				placeholder = fixed_container[++placeholder_index].node;
				return r;
			});

			container.forEach((data, index) => {
				let _context = data.context;
				$row && (_context.local[$row] = data.value);
				$index && (_context.local[$index] = index);
			});

			prevArray = array.slice();
		});
	}
});


/// Directive: "*if"
module.directive("*if", function() {
	return function(context, el, script) {
		let placeholder = document.createComment("if: " + script);
		el._ifScript = placeholder._ifScript = script;

		context.watch$(script, function(bool) {

			if (bool) {
				if (placeholder.parentNode) {
					placeholder.replaceWith(el);
				}
			} else {
				el.replaceWith(placeholder);
			}

			// console.log("if", script, bool);
		});
	}
});


/// @TODO: 사실은 *if watch에서 모든것을 처리하고 placeholder는 1개만 가져가는게 더 좋을텐데...
/// @TODO: *if 부터 false일때 => 전달 => 전달 하는 식으로...


/// Directive: "*else"
module.directive("*else", function() {
	return function(context, el, script) {

		let placeholder = document.createComment("else: " + script);

		/// prev가 ifScript가 있거나...

		let prev = el.previousSibling;
		for (let i = 0; i < 5; i++) {
			prev = prev.previousSibling;
			if (prev._ifScript) {
				script = prev._ifScript;
				// console.log("#############", prev, prev.ifScript);
				break;
			}
		}

		script = "!(" + script + ")";

		// console.log(script);


		context.watch$(script, function(bool) {

			if (bool) {
				if (placeholder.parentNode) {
					placeholder.replaceWith(el);
				}
			} else {
				el.replaceWith(placeholder);
			}

			// console.log("if", script, bool);
		});
	}
});
