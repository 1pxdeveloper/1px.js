function Scope(context, local, watchTower) {
	let self = this;

	this.context = context || Object(null);
	this.local = local || Object(null);

	this.enable = true;
	this.stop$ = new Observable(function(observer) {
		self.stop = function() {
			observer.next();
			observer.complete();
		}
	});

	this.watchTower = watchTower || Object(null);
}

Scope.prototype = {
	stop() {

	},

	fork() {
		return new Scope(this.context, Object.create(this.local), this.watchTower);
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

		script = String(script).trim();

		let o = $parse(script).watch$(this.context, this.local).takeUntil(this.stop$).do(value => {

			try {


				if (this.watchTower[script]) {
					console.log("@@@@@@@", this.watchTower, this.watchTower[script], script);
					console.log("@@@@[watch script]", script);
					this.watchTower[script].next(value);
				}
			} catch (e) {

				console.error(e);
			}
		});

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

	if (el.tagName === "FORM") {
		if (!el.hasAttribute("method") && !el.hasAttribute("action")) {
			el.submit = function() {
				this.dispatchEvent(new CustomEvent("submit"));
			}
		}
	}


	/// @FIXME:... default template directive
	let attrValue = el.getAttribute("*repeat");
	if (attrValue) {
		module.directive.require("*repeat", f => f(scope, el, attrValue));
		return false;
	}

	attrValue = el.getAttribute("*if");
	if (attrValue) {
		module.directive.require("*if", f => f(scope, el, attrValue));
		return false;
	}

	attrValue = el.hasAttribute("*else");
	if (attrValue) {
		module.directive.require("*else", f => f(scope, el, attrValue));
		return false;
	}


	/// Attribute directive
	for (let attr of Array.from(el.attributes)) {

		/// Custom directives
		let customDefaultPrevent = false;
		module.directive.require(attr.nodeName, directive => {
			if (typeof directive === "function") {
				let ret = directive(scope, el, attr.nodeValue);
				customDefaultPrevent = ret === false;
			}
		});
		if (customDefaultPrevent) continue;


		/// Basic directives
		if (syntax(scope, el, attr, "$", _ref, "")) continue;
		if (syntax(scope, el, attr, "(", _event, ")")) continue;
		if (syntax(scope, el, attr, "[(", _twoway, ")]")) continue;
		if (syntax(scope, el, attr, "[attr.", _attr, "]")) continue;
		if (syntax(scope, el, attr, "[style.", _style, "]")) continue;
		if (syntax(scope, el, attr, "[style]", _style_list)) continue;
		if (syntax(scope, el, attr, "[class.", _class, "]")) continue;
		if (syntax(scope, el, attr, "[class]", _class_list)) continue;
		if (syntax(scope, el, attr, "[", _prop, "]")) continue;
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
		if (eventType === "submit" && !el.hasAttribute("action")) {
			event.preventDefault();
			event.stopPropagation();
		}

		scope.local.event = event;
		scope.local.$el = el;
		scope.eval(script);
		delete scope.local.event;
		delete scope.local.$el;

		return false;
	});


	// scope.on$(el, eventType).subscribe(function(event) {
	//
	//
	// 	alert(eventType);
	//
	//
	// 	/// form.submit prevent
	// 	if (eventType === "submit" && !el.hasAttribute("method")) {
	// 		event.preventDefault();
	// 	}
	//
	// 	scope.local.event = event;
	// 	scope.eval(script);
	// 	delete scope.local.event;
	// });
}

function _twoway(scope, el, script, prop) {

	scope.watch$(script, function(value) {
		el[prop] = value;
	});

	scope.on$(el, "input").subscribe(function(event) {
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

	// console.log("name111", name);

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
		scope.watch$(script, function(value) {
			this.nodeValue = value === undefined ? "" : value;
//			domChanged(textNode.parentNode);
		}.bind(textNode));

		textNode = next;
		index = textNode.nodeValue.indexOf("{{");
	}
}


/// Directive: "*repeat"
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

		while (M[i][j] > 0) {
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

	function createRepeatNode(repeatNode, scope, row, index, value, i) {
		let node = repeatNode.cloneNode(true);
		let _scope = scope.fork();

		row && (_scope.local[row] = value);
		index && (_scope.local[index] = i);

		$compile(node, _scope);

		return {
			index: i,
			value: value,
			node: node,
			scope: _scope,
		}
	}

	return function(scope, el, script) {

		/// expression => *repeat="rows as row, index"
		let rows, $row, $index, lastIndex;
		rows = script;
		lastIndex = rows.lastIndexOf(" as ");
		if (lastIndex !== -1) {
			rows = rows.substring(0, lastIndex);
			$row = script.substring(lastIndex + 4).trim();

			lastIndex = $row.lastIndexOf(",");
			if (lastIndex !== -1) {
				$index = $row.substring(lastIndex + 1).trim();
				$row = $row.substring(0, lastIndex).trim();
			}
		}
		// rows = "(" + rows + ")";


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

		scope.watch$(rows, array => {
			array = array || [];

			console.log("repeat!!!", array);

			let lcsResult = LCS(prevArray, array);
			let d = lcsResult[0];
			let e = lcsResult[1];


			/// LCS 알고리즘을 통해 삭제할 노드와 남길 노드를 분리한다.
			let fixed_container = [];
			let values_for_reuse = [];

			prevArray.forEach((value, index) => {
				if (d[index] === undefined) {
					values_for_reuse[index] = value;
					container[index].scope.stop();
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
						r = createRepeatNode(repeatNode, scope, $row, $index, value, index);
						placeholder.before(r.node);
					}

					return r;
				}

				let r = fixed_container[placeholder_index];
				placeholder = fixed_container[++placeholder_index].node;
				return r;
			});

			container.forEach((data, index) => {
				let _scope = data.scope;
				$row && (_scope.local[$row] = data.value);
				$index && (_scope.local[$index] = index);
			});

			prevArray = array.slice();
		});
	}
});


/// Directive: "*if"
module.directive("*if", function() {
	return function(scope, el, script) {
		let placeholder = document.createComment("if: " + script);
		el._ifScript = placeholder._ifScript = script;

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


