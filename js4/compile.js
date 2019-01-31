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
	stop() {
	},

	fork(local) {
		return new Scope(this.context, Object.assign(this.local, local));
	},

	on$(el, type, useCapture) {
		return Observable.fromEvent(el, type, useCapture);
	},

	eval(script) {
		return $parse(script)(this.context, this.local);
	},

	assign(script, value) {
		return $parse(script).assign(this.context, this.local, value);
	},

	watch$(script, fn) {
		let o = $parse(script).watch$(this.context, this.local);//.filter(function() { return self.enable; }).takeUntil(self.stop$);
		return fn ? o.subscribe(fn) : o;
	}
};


function traverse(node, fn) {
	fn = fn || noop;

	let stack = [];
	while (node) {
		node = fn(node) === false ? stack.pop() : node.firstChild || stack.pop();
		node && node.nextSibling && stack.push(node.nextSibling);
	}
}

function $compile(el, scope) {

	scope = scope || new Scope(el);

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

	/// @FIXME:... default directive
	let attrValue = el.getAttribute("*repeat");
	if (attrValue) {
		module.directive.get$("*repeat").subscribe(f => f(scope, el, attrValue));
		return false;
	}

	attrValue = el.getAttribute("*if");
	if (attrValue) {
		module.directive.get$("*if").subscribe(f => f(scope, el, attrValue));
		return false;
	}

	attrValue = el.hasAttribute("*else");
	if (attrValue) {
		module.directive.get$("*else").subscribe(f => f(scope, el, attrValue));
		return false;
	}


	/// Attribute directive
	for (let attr of Array.from(el.attributes)) {
		if (syntax(scope, el, attr, "$", _ref, "")) ;
		else if (syntax(scope, el, attr, "(", _event, ")")) ;
		else if (syntax(scope, el, attr, "[(", _twoway, ")]")) ;
		else if (syntax(scope, el, attr, "[attr.", _attr, "]")) ;
		else if (syntax(scope, el, attr, "[style.", _style, "]")) ;
		else if (syntax(scope, el, attr, "[style]", _style_list)) ;
		else if (syntax(scope, el, attr, "[class.", _class, "]")) ;
		else if (syntax(scope, el, attr, "[class]", _class_list)) ;
		else if (syntax(scope, el, attr, "[", _prop, "]")) ;


		/// Custom directive
		// @TODO: directive => directive call
		module.directive.get$(attr.nodeName).subscribe(directive => {
			if (typeof directive === "function") {
				directive(scope, el, attr.nodeValue);
			}
		});
	}
}

function syntax(scope, el, attr, start, fn, end) {
	let name = attr.nodeName;
	let value = attr.nodeValue;

	if (end === "" && name.startsWith(start) && name.endsWith(end)) {
		fn(scope, el, value, name.slice(start.length));
		return true;
	}

	if (end !== undefined && name.startsWith(start) && name.endsWith(end)) {
		fn(scope, el, value, name.slice(start.length, -end.length));
		return true;
	}

	if (name === start) {
		fn(scope, el, value);
		return true;
	}
}

function _prop(scope, el, script, prop) {
	// @TODO: 1) prop이 reactive setter면 바로 적용. 아니면 nextFrame (id, hidden, visible 등... 때문)
	scope.watch$(script, value => el[prop] = value);
}

function _event(scope, el, script, events) {

	events = events.split(".");
	let eventType = events[0];

	scope.on$(el, eventType).subscribe(function(event) {

		/// form.submit prevent
		if (eventType === "submit" && !el.hasAttribute("method")) {
			event.preventDefault();
		}

		scope.local.event = event;
		scope.eval(script);
	});
}

function _twoway(scope, el, script, prop) {

	scope.watch$(script, function(value) {
		el[prop] = value;
	});

	scope.on$(el, "input").subscribe(function(value) {
		scope.assign(script, el[prop]);
	});
}

function _attr(scope, el, script, attr) {
	scope.watch$(script, value => {
		el.setAttribute(attr, value)
	});
}

function _style(scope, el, script, name) {
	scope.watch$(script, value => {
		el.style[name] = value;
	});
}

function _style_list(scope, el, script) {

}

function _class(scope, el, script, name) {
	scope.watch$(script, value => {
		value ? el.classList.add(name) : el.classList.remove(name);
	});
}

function _class_list(scope, el, script) {

}

function _ref(scope, el, script, name) {

	console.log("name111", name);

	scope.context["$" + name] = el;
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

		/// expression => *repeat="rows as row, index"
		let rows, row, index, lastIndex;
		rows = script;
		lastIndex = rows.lastIndexOf(" as ");
		if (lastIndex !== -1) {
			rows = rows.substring(0, lastIndex);
			row = script.substring(lastIndex + 4).trim();

			lastIndex = row.lastIndexOf(",");
			if (lastIndex !== -1) {
				index = row.substring(lastIndex + 1).trim();
				row = row.substring(0, lastIndex).trim();
			}
		}
		rows = "(" + rows + ")";


		/// Prepare Placeholder
		let placeholder = document.createComment("repeat: " + script);
		let placeholderEnd = document.createComment("endrepeat");
		let repeatNode = el.cloneNode(true);
		repeatNode.removeAttribute("*repeat");

		el.before(placeholder);
		el.replaceWith(placeholderEnd);


		////
		let container = [];

		scope.watch$(rows, array => {

			/// @TODO: 같은 Object일 경우 재사용할 수 있도록 sort하는 로직 추가 할것!!!
			foreach(array, (value, i) => {

				if (!container[i]) {
					let node = repeatNode.cloneNode(true);
					let _scope = scope.fork();

					// row && (_scope.local[row] = value);
					// index && (_scope.local[index] = i);

					$compile(node, _scope);
					placeholderEnd.before(node);

					container[i] = {
						nodes: [node],
						scope: _scope
					};

				} else {
					let _scope = container[i].scope;
					// row && (_scope.local[row] = value);
					// index && (_scope.local[index] = i);
				}

				lastIndex = i + 1;
			});


			for (let i = lastIndex, len = container.length; i < len; i++) {
				container[i].nodes.forEach(node => node.remove());
				container[i].scope.stop();
			}

			container.length = lastIndex;
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
	return function(scope, el, script) {

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


		scope.watch$(script, function(bool) {

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







