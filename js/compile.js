class Scope {
	constructor(global, local) {
		this.global = global || Object(null);
		this.local = local || Object(null);

		this.stop$ = new Observable(observer => {
			this.stop = function() {
				observer.complete();
			}
		}).share();
	}

	stop() {

	}

	fork(local) {
		local = Object.assign(Object.create(this.local), local);
		return new Scope(this.global, local);
	}

	on$(el, type, useCapture) {
		return Observable.fromEvent(el, type, useCapture).takeUntil(this.stop$);
	}

	$eval(script) {
		return $parse(script)(this.global, this.local);
	}

	assign(script, value) {
		return $parse(script).assign(this.global, this.local, value);
	}

	watch$(script, fn) {

		/// @TODO: script 가 array 면?? watch$(['a', 'b', 'c'], ...)

		/// @TODO: script 가 template 면?? watch$(`this.dkjfksfd `) script.raw 확인....

		/// @TODO: fn이 있던 없던 Observer로??
		script = String(script).trim();

		let next = typeof fn === "function" ? fn : noop;
		$parse(script).watch$(this.global, this.local).takeUntil(this.stop$).do(next).subscribe();

		if (typeof fn === "function") {
			return;
		}

		return new Observable(observer => {
			next = function(value) {
				observer.next(value);
			}
		}).takeUntil(this.stop$);
	}
}


function traverse(node, fn) {
	fn = fn || noop;

	let stack = [];
	while(node) {
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
		if (syntax(scope, el, attr, "(", _event, ")")) continue;
		if (syntax(scope, el, attr, "(", _event, ")")) continue;
		if (syntax(scope, el, attr, "[(", _twoway, ")]")) continue;
		if (syntax(scope, el, attr, "[attr.", _attr, "]")) continue;
		if (syntax(scope, el, attr, "[style.", _style, "]")) continue;
		if (syntax(scope, el, attr, "[class.", _class, "]")) continue;
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


function handleEvent(event, scope, el, script, options) {
	/// form.submit prevent
	if (event.type === "submit" && !el.hasAttribute("action")) {
		event.preventDefault();
		event.stopPropagation();
	}

	options.prevent && event.preventDefault();
	options.stop && event.stopPropagation();

	scope.local.event = event;
	scope.local.$el = el;
	let ret = scope.$eval(script);
	delete scope.local.event;
	delete scope.local.$el;

	/// @TOOD: promise, observable
	if (ret instanceof Promise) {

	}
}


/// @TODO: (keypress.enter) (keypress.ctrl.enter)
function _event(scope, el, script, events) {

	let [type, ...options] = events.split(".");
	switch (type) {
		case "keydown":
		case "keypress":
		case "keyup":
			return _keyevent(...arguments, type, options);
	}

	options = options.reduce((o, option) => {
		o[option] = true;
		return o;
	}, Object.create(null));

	let o$ = scope.on$(el, type, options.capture);
	if (options.once) {
		o$ = o$.take(1);
	}

	o$.subscribe(function(event) {
		handleEvent(event, scope, el, script, options);
	});
}


/// @FIXME:.. 왤케 정리를 못하ㅇ냐!!!!!!!!!!!!!!

function _keyevent(scope, el, script, events, type, options) {

	console.log(type, options);

	let keys = Object.create(null);
	let hasKey = options.some(option => {
		if (option[0] === "[") {
			keys[option.slice(1, -1)] = true;
			return true;
		}
		return false;
	});

	options = options.reduce((o, option) => {
		o[option] = true;
		return o;
	}, Object.create(null));

	let o$ = scope.on$(el, type, options.capture);
	if (options.once) {
		o$ = o$.take(1);
	}

	o$.subscribe(function(event) {
		if (hasKey) {
			keys[event.key.toLowerCase()] && handleEvent(event, scope, el, script, options);
		} else {
			handleEvent(event, scope, el, script, options);
		}
	});
}

function _twoway(scope, el, script, value) {

	let [prop, ...options] = value.split(".");

	options = options.reduce((o, option) => {
		o[option] = true;
		return o;
	}, Object.create(null));

	scope.watch$(script, function(value) {
		el[prop] = value;
	});

	scope.on$(el, options.change ? "change" : "input").subscribe(function() {
		scope.assign(script, el[prop]);
	});
}

function _attr(scope, el, script, attr) {
	scope.watch$(script, value => {
		if (value === null || value === undefined) el.removeAttribute(attr);
		else el.setAttribute(attr, value)
	});
}

function _style(scope, el, script, name) {

	let [prop, unit] = name.split(".", 2);
	unit = unit || "";

	scope.watch$(script, value => {
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

function _class(scope, el, script, name) {
	scope.watch$(script, value => {
		value ? el.classList.add(name) : el.classList.remove(name);
	});
}

function _ref(scope, el, script, name) {
	scope.global["$" + name] = el;
}


/// TEXT_NODE
function compile_text_node(textNode, scope) {
	let index = textNode.nodeValue.indexOf("{{");

	while(index >= 0) {
		textNode = textNode.splitText(index);
		index = textNode.nodeValue.indexOf("}}");
		if (index === -1) return;
		let next = textNode.splitText(index + 2);
		let script = textNode.nodeValue.slice(2, -2);

		textNode.nodeValue = "";
		scope.watch$(script, function(value) {

			/// HTML Element
			if (this.__node) {
				this.__node.forEach(node => node.remove());
				delete this.__node;
			}

			if (value instanceof Node) {
				this.__node = Array.from(value.childNodes || [value]).slice();
				this.before(value);
				this.nodeValue = "";
				return;
			}

			this.nodeValue = value === undefined ? "" : value;
			//			domChanged(textNode.parentNode);
		}.bind(textNode));

		textNode = next;
		index = textNode.nodeValue.indexOf("{{");
	}
}


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

		scope.watch$(script, array => {

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


