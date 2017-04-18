function Scope(context, local) {
	let self = this;

	this.context = context;
	this.local = Object.assign(Object.create(null), local);
	this.enable = true;

	this.stop$ = new Observable(function(observer) {
		self.stop = function() {
			observer.complete();
		}
	}).share();
}

Scope.prototype = {
	stop() {},

	fork(local) {
		return new Scope(this.context, Object.assign(this.local, local));
	},

	watch$(script, fn) {
		let self = this;
		let o = $parse(script).watch$(this.context, this.local);//.filter(function() { return self.enable; }).takeUntil(self.stop$);
		return fn ? o.subscribe(fn) : o;
	},

	watchGroup$(scripts, fn) {
		let self = this;

		let o = scripts.map(script => {
			return $parse(script).watch$(this.context, this.local);
		});

		o = Observable.zip.apply(null, o);

		return fn ? o.subscribe(fn) : o;
	}
};


const nextFrame = function() {

	let queue = [];

	function enterFrame() {
		let index = 0, fn;
		while (fn = queue[index++]) {
			fn();
		}
		queue = [];
	}

	return function nextFrame(fn) {
		if (queue.length === 0) {
			window.requestAnimationFrame(enterFrame);
		}

		queue.push(fn);
	}
}();


function traverse(node, fn) {
	fn = fn || noop;

	let stack = [];
	while (node) {
		node = fn(node) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
}

function compile(el, scope) {
	traverse(el, node => {
		switch (node.nodeType) {
			case Node.ELEMENT_NODE:
				return compile_element_node(node, scope);

			case Node.TEXT_NODE:
				return compile_text_node(node, scope);
		}
	});
}


/// ELEMENT_NODE
function compile_element_node(el, scope) {
	switch (el.tagName) {
		case "STYLE":
		case "SCRIPT":
			return false;
	}

	let attr;
	if (attr = el.getAttribute("*repeat")) {
		module.directive.get("*repeat")(scope, el, attr);
		return false;
	}

	if (attr = el.getAttribute("*if")) {
		module.directive.get("*if")(scope, el, attr);
		return false;
	}

	if (el.hasAttribute("*else")) {
		module.directive.get("*else")(scope, el, el.getAttribute("*else"));
		return false;
	}


	for (let attr of Array.from(el.attributes)) {
		// @TODO: directive => directive call
		if (syntax(scope, el, attr, "(", _event, ")")) continue;
		if (syntax(scope, el, attr, "[(", _twoway, ")]")) continue;
		if (syntax(scope, el, attr, "[attr.", _attr, "]")) continue;
		if (syntax(scope, el, attr, "[style.", _style, "]")) continue;
		if (syntax(scope, el, attr, "[style]", _style_list)) continue;
		if (syntax(scope, el, attr, "[class.", _class, "]")) continue;
		if (syntax(scope, el, attr, "[class]", _class_list)) continue;
		if (syntax(scope, el, attr, "[", _prop, "]")) continue;

		// @TODO: if, elif, else
	}
}

function syntax(scope, el, attr, start, fn, end) {
	let name = attr.nodeName;
	let value = attr.nodeValue;

	if (end && name.startsWith(start) && name.endsWith(end)) {
		fn(scope, el, value, name.slice(start.length, -end.length));
		return true;
	}

	if (name === start) {
		fn(scope, el, value);
		return true;
	}
}

function _prop(scope, el, script, prop) {
//	console.log("prop", arguments);

	// @TODO: 1) prop이 reactive setter면 바로 적용. 아니면 nextFrame (id, hidden, visible 등... 때문)


	scope.watch$(script, value => { el[prop] = value });
}

function _event(scope, el, script, event) {
//	console.log("event", arguments);

//		scope.eval(script, {event: event})

//	scope.on$(event).subscribe(function(event) {
//
//
//	});

}

function _twoway(scope, el, script, name) {

}

function _attr(scope, el, script, attr) {
	scope.watch$(script, value => { nextFrame(() => { el.setAttribute(attr, value) }) });
}

function _style(scope, el, script, name) {
	scope.watch$(script, value => {
		nextFrame(() => {
			el.style[name] = value;
		})
	});
}

function _style_list(scope, el, script) {

}

function _class(scope, el, script, name) {

}

function _class_list(scope, el, script) {

}


/// TEXT_NODE
function compile_text_node(textNode, scope) {
	let index = textNode.nodeValue.indexOf("{{");

	while (index >= 0) {
		textNode = textNode.splitText(index);
		index = textNode.nodeValue.indexOf("}}");
		if (index === -1) return;
		let next = textNode.splitText(index + 2);
		let script = textNode.nodeValue.slice(2, -2);

		textNode.nodeValue = "";

//		console.log("textNode.watch", script);

		scope.watch$(script, function(value) {


//			console.log(script, value);


			this.nodeValue = value === undefined ? "" : value;
//			domChanged(textNode.parentNode);
		}.bind(textNode));

		textNode = next;
		index = textNode.nodeValue.indexOf("{{");
	}
}


/// Directive: "*repeat"
module.directive("*repeat", function() {
	return function(scope, el, script) {

		let container = [];

		let placeholder = document.createComment("repeat: " + script);
		let placeholderEnd = document.createComment("end");
		let repeatNode = el.cloneNode(true);
		repeatNode.removeAttribute("*repeat");

		el.before(placeholder);
		el.replaceWith(placeholderEnd);

		scope.watch$("rows", function(rows) {
			let length = +rows.length || 0;

			console.log(length);


			/// Remove
			for (let i = length; i < container.length; i++) {
				container[i].nodes.forEach(node => node.remove());
				container[i].subscription.unsubscribe();
			}

			/// Add
			for (let i = container.length; i < length; i++) {

				let _scope = scope.fork({
					index: i,
					row: rows[i]
				});

				let subscription = watch$(rows, i).subscribe(function(value) {
					_scope.local.row = value;
				});

				let r = repeatNode.cloneNode(true);
				compile(r, _scope);

				placeholderEnd.before(r);

				container[i] = {
					nodes: [r],
					scope: _scope,
					subscription: subscription
				}
			}

			container.length = length;
		});
	}
});


/// Directive: "*if"
module.directive("*if", function() {
	return function(scope, el, script) {
		let placeholder = document.createComment("if: " + script);
		placeholder._ifScript = script;
		el._ifScript = script;

		scope.watch$(script, function(bool) {

			if (bool) {
				if (placeholder.parentNode) {
					placeholder.replaceWith(el);
				}
			}
			else {
				el.replaceWith(placeholder);
			}

			console.log("if", script, bool);
		});
	}
});


/// @TODO: 사실은 *if watch에서 모든것을 처리하고 placeholder는 1개만 가져가는게 더 좋을텐데...
/// @TODO: *if 부터 false일때 => 전달 => 전달 하는 식으로...


/// Directive: "*else"
module.directive("*else", function() {
	return function(scope, el, script) {

		let placeholder = document.createComment("else: " + script);


		/// prev가 ifScript가 있거나...


		let prev = el.previousSibling;
		for (let i = 0; i < 5; i++) {
			prev = prev.previousSibling;
			if (prev._ifScript) {
				script = prev._ifScript;
				console.log("#############", prev, prev.ifScript);
				break;
			}
		}

		script = "!(" + script + ")";

		console.log(script);


		scope.watch$(script, function(bool) {

			if (bool) {
				if (placeholder.parentNode) {
					placeholder.replaceWith(el);
				}
			}
			else {
				el.replaceWith(placeholder);
			}

			console.log("if", script, bool);
		});
	}
});






