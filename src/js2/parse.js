(function() {
	"use strict";

	const {Observable} = require("./observable");


	function noop() {}

	function foreach(arr, fn) {
		for (let i = 0, len = arr.length; i < len; i++) {
			fn(arr[i], i);
		}
	}


	/// watch$
	const watch$ = (function() {

		const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
		const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

		function mutationObservableFromClass$(object, methods) {
			let key = methods[0];
			if (object[key].observable$) {
				return object[key].observable$;
			}

			let observable$ = new Observable(observer => {
				let prototype = Object.getPrototypeOf(object);
				let o = Object.create(prototype);
				Object.setPrototypeOf(object, o);

				for (let method of methods) {
					o[method] = function() {
						let result = prototype[method].apply(this, arguments);
						observer.next(this);
						observer.complete();
						return result;
					}
				}

				o[key].observable$ = observable$;

				return function() {
					delete o[key].observable$;
					Object.setPrototypeOf(object, prototype);
				}

			}).share();

			return observable$;
		}

		function mutationObservable$(object) {
			if (Array.isArray(object)) return mutationObservableFromClass$(object, ARRAY_METHODS);
			if (object instanceof Date) return mutationObservableFromClass$(object, DATE_METHODS);
			return Observable.NEVER;
		}


		let num = 0;

		function watch$(object, prop) {

			if (Object(object) !== object) {
				return Observable.NEVER;
			}

			if (Array.isArray(object) && +prop === prop) {
				return Observable.NEVER;
			}

			let desc = Object.getOwnPropertyDescriptor(object, prop);
			if (desc) {
				if (desc.set && desc.set.observable$) {
					return desc.set.observable$;
				}

				if (desc.configurable === false || desc.writable === false) {
					return mutationObservable$(object[prop]);
				}
			}

			let observable$ = new Observable(function(observer) {
				num++;
				// console.log("watch$ ob: " + num, object, prop);

				let value = object[prop];
				let subscription = mutationObservable$(value).subscribe(observer);

				function set(newValue) {
					if (Object.is(value, newValue)) {
						return;
					}
					value = newValue;
					observer.next(value);
					observer.complete();
				}

				set.observable$ = observable$;

				Object.defineProperty(object, prop, {
					enumerable: true,
					configurable: true,
					get: function() {
						return value;
					},
					set: set,
				});

				/// cleanup!
				return function() {

					num--;
					// console.log("-watch$ ob: " + num, object, prop);

					subscription.unsubscribe();
					delete set.observable$;
					delete object[prop];
					object[prop] = value;
				}

			}).share();

			return observable$;
		}

		return watch$;
	})();


	////////////////
	let $tokens;
	let $token;

	function next(id) {
		if (id && $token && $token.id !== id) {
			$token.error("unexpected token: " + $token.id);
			return;
		}

		let t = $token;
		$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
		return t;
	}

	function expression(rbp) {
		rbp = rbp || 0;

		let t = $token;
		next();

		let left = t.nud() || t;
		while ($token.lbp > rbp) {
			t = $token;
			next();
			left = t.led(left) || t;
		}

		return left;
	}


	/// Symbol
	let $symbol_prototype = {
		lbp: 0,
		nbp: 0,
		length: 0,

		nud() {
			throw SyntaxError("Undefined.");
		},

		led() {
			throw SyntaxError("Missing Operator.");
		},

		push() {
			for (let token of arguments) {
				this[this.length++] = token;
				token.parent = this;
			}

			return arguments[arguments.length - 1];
		},

		watch(object, prop) {},

		setObjectProp(object, prop) {
			this.object = object;
			this.prop = prop;
			this.watch(object, prop);
			return object && object[prop];
		},
	};


	let $symbol_table = {};

	function symbol(id) {
		let s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
		s.id = id;
		return s;
	}

	function default_constant_nud() {
		this.id = "(literal)";
	}

	function default_prefix_nud() {
		this.push(expression(this.nbp));
	}

	function default_infix_led(left) {
		this.push(left, expression(this.lbp));
	}

	function default_infixr_led(left) {
		this.push(left, expression(this.lbp - 1));
	}

	function constant(id, value) {
		let s = symbol(id);
		s.value = value;
		s.nud = default_constant_nud;
		return s;
	}

	function prefix(bp, id, nud) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.nbp = bp;
			s.nud = nud || default_prefix_nud;
		});
	}

	function infix(bp, id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.lbp = bp;
			s.led = led || default_infix_led;
		});
	}

	function infixr(bp, id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.lbp = bp;
			s.led = led || default_infixr_led;
		});
	}


	// Define Symbols
	constant("true", true);
	constant("false", false);
	constant("undefined", undefined);
	constant("null", null);
	constant("NaN", NaN);
	constant("Math", Math);
	constant("Date", Date);
	constant("Boolean", Boolean);
	constant("Number", Number);
	constant("Array", Array);
	constant("Object", Object);

	symbol(":");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol(",");
	symbol("=>");

	symbol("(array)");

	symbol("(end)").nud = noop;
	symbol("(literal)").nud = noop;
	symbol("(name)").nud = noop;
	symbol("this").nud = noop;


	/// Operator precedence
	// function precedence() {
	//
	// }
	//

	// precedence("=>");
	// precedence(".", "[");
	// precedence("(");
	// precedence("!", "-", "+");
	// precedence("*", "/", "%");
	// precedence("+", "-");
	// precedence("<", ">", ">=", "in");
	// precedence("===", "!==", "==", "!=");
	// precedence("|");
	// precedence("=");
	// precedence("if");
	// precedence(";");


	infix(5, ";");

	infix(7, "if");

	infixr(10, "=", function(left) {
		if (left.id !== "." && left.id !== "[" && left.id !== "(name)") {
			left.error("Bad lvalue.");
		}

		this.push(left);
		this.push(expression(9));
	});


	infix(20, "as", function(left) {
		this.push(left, next("(name)"));

		if ($token.id === ",") {
			next(",");
			this.push(next("(name)"));
		}
		else {
			this.push({});
		}


		if ($token.id === "=>") {
			next("=>");
			this.push(expression());
		}
	});


	infix(30, "|", function(left) {
		if ($token.id !== "(name)") {
			throw SyntaxError("Unexpected token " + $token.id);
		}

		this.push(left);
		this.push($token);
		next();

		let args = this.push([]);

		if ($token.id === ":") {
			next(":");

			for (; ;) {
				let o = expression();
				args.push(o);

				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}
	});


	infix(40, "?", function(left) {
		this.push(left, expression());
		next(":");
		this.push(expression());
	});

	infixr(50, ["&&", "||"]);
	infixr(60, ["===", "!==", "==", "!=", "<", "<=", ">", ">="]);

	infix(70, ["+", "-"]);
	infix(80, ["*", "/"]);

	prefix(90, ["+", "-", "!"]);

	prefix(90, "(", function() {

		let _next = $tokens[$tokens.index];
		let _next2 = $tokens[$tokens.index + 1];

		if (_next.id === "," || (_next.id === ")" && _next2.id === "=>")) {
			let args = Object.create($symbol_table["(array)"]);
			args.value = [];
			this.push(args);

			for (; ;) {
				args.value.push(next("(name)"));
				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
			next(")");

			next("=>");

			this.push(expression());
			return;
		}

		if (_next.id === "=>") {
			let args = Object.create($symbol_table["(array)"]);
			args.value = [];
			this.push(args);
			next(")");

			next("=>");

			this.push(expression());
			return;
		}


		let e = expression();
		next(")");
		return e;
	});


	prefix(90, "[", function() {
		let array = Object.create($symbol_table["(array)"]);
		array.value = [];

		if ($token.id !== "]") {
			for (; ;) {
				let e = expression();
				e.parent = array;
				array.value.push(e);

				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}

		next("]");
		return array;
	});

	prefix(90, "{", function() {
		let args = this.push([]);

		if ($token.id !== "}") {
			for (; ;) {
				if ($token.id !== "(name)" && $token.id !== "(literal)") {
					throw SyntaxError("Unexpected token " + $token.id);
				}

				let key = next().value;
				next(":");

				let o = expression();
				o.key = key;
				args.push(o);

				if ($token.id !== ",") {
					break;
				}

				next(",");
			}
		}

		next("}");
	});

	infix(100, ".", function(left) {
		if ($token.id !== "(name)") {
			throw SyntaxError("Unexpected token " + $token.id);
		}

		this.push(left, next());
	});

	infix(100, "[", function(left) {
		this.push(left, expression());
		next("]");
	});

	infix(100, "(", function(left) {
		let args = Object.create($symbol_table["(array)"]);
		args.value = [];

		if (left.id === "." || left.id === "[") {
			this.push(left[0], left[1], args);
		}
		else {
			this.push(left, args);
		}

		if ($token.id !== ")") {
			for (; ;) {
				let e = expression();
				e.parent = args;
				args.value.push(e);

				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}

		next(")");
	});


	infix(110, "=>", function(left) {
		this.push(left);
		this.push(expression());
	});


	/// Tokenizer
	tokenize.re = /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)|((?:\d*\.\d+)|\d+)|('[^']*'|"[^"]*")|(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/!?:;.,<>=\[\]\(\){}])|(\s)|./g;

	tokenize.types = [
		"",
		"(name)",
		"(number)",
		"(string)",
		"(operator)",
		"(ws)",
		"(unknown)",
	];

	function tokenize(script) {
		let tokens = [];

		String(script).trim().replace(tokenize.re, function(value) {
			let type;
			let token;

			/// parse Type
			for (let i = 1; i < arguments.length; i++) {
				if (arguments[i]) {
					type = tokenize.types[i];
					break;
				}
			}

			switch (type) {
				case "(name)":
					token = Object.create($symbol_table[value] || $symbol_table["(name)"]);
					token.value = "value" in token ? token.value : value;
					tokens.push(token);
					break;

				case "(number)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = +value;
					tokens.push(token);
					break;

				case "(string)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = value.slice(1, -1);
					tokens.push(token);
					break;

				case "(operator)":
					token = Object.create($symbol_table[value]);
					token.value = value;
					tokens.push(token);
					break;

				case "(unknown)":
					throw SyntaxError("Unexpected token " + value);
			}

			return value;
		});

		tokens.index = 0;
		return tokens;
	}


	/// Evaluate
	let evaluateRules = {};

	function evaluate(token) {
		return evaluateRules[token.id][token.length].apply(token, token);
	}

	function evaluateRule(id, fn) {
		let length = fn.length;
		evaluateRules[id] = evaluateRules[id] || {};
		evaluateRules[id][length] = fn;
	}

	evaluateRule("(end)", () => undefined);
	evaluateRule("(literal)", function() {
		return this.value;
	});

	evaluateRule("(array)", function() {
		return this.value.map(evaluate);
	});

	evaluateRule("{", function(a) {
		return a.reduce(function(object, o) {
			object[o.key] = evaluate(o);
			return object;
		}, {});
	});

	evaluateRule("+", (a) => +evaluate(a));
	evaluateRule("-", (a) => -evaluate(a));
	evaluateRule("!", (a) => !evaluate(a));

	evaluateRule(";", (a, b) => {
		evaluate(a);
		return evaluate(b);
	});

	evaluateRule("&&", (a, b) => evaluate(a) && evaluate(b));
	evaluateRule("||", (a, b) => evaluate(a) || evaluate(b));
	evaluateRule("===", (a, b) => evaluate(a) === evaluate(b));
	evaluateRule("!==", (a, b) => evaluate(a) !== evaluate(b));
	evaluateRule("==", (a, b) => evaluate(a) == evaluate(b));
	evaluateRule("!=", (a, b) => evaluate(a) != evaluate(b));
	evaluateRule("<", (a, b) => evaluate(a) < evaluate(b));
	evaluateRule("<=", (a, b) => evaluate(a) <= evaluate(b));
	evaluateRule(">", (a, b) => evaluate(a) > evaluate(b));
	evaluateRule(">=", (a, b) => evaluate(a) >= evaluate(b));

	evaluateRule("+", (a, b) => evaluate(a) + evaluate(b));
	evaluateRule("-", (a, b) => evaluate(a) - evaluate(b));
	evaluateRule("*", (a, b) => evaluate(a) * evaluate(b));
	evaluateRule("/", (a, b) => evaluate(a) / evaluate(b));
	evaluateRule("%", (a, b) => evaluate(a) % evaluate(b));

	evaluateRule("?", (a, b, c) => evaluate(a) ? evaluate(b) : evaluate(c));

	evaluateRule("(name)", function() {
		return this.setObjectProp(this.value in this.local ? this.local : this.scope, this.value);
	});

	evaluateRule("this", function() {
		return this.scope;
	});

	evaluateRule(".", function(a, b) {
		return this.setObjectProp(evaluate(a), b.value);
	});

	evaluateRule("[", function(a, b) {
		return this.setObjectProp(evaluate(a), evaluate(b));
	});

	evaluateRule("(", function(a, b) {

		if (a.id === "(array)") {
			/// @TODO: 이거 중복인데....
			let args = a.value.map(v => v.value);
			let tokens = _flat_tokens(b);

			return function(..._args) {
				let r = {};
				args.forEach((key, index) => r[key] = _args[index]);
				tokens.forEach(t => t.local = r);
				return evaluate(b);
			}
		}

		let fn = this.setObjectProp(a in this.local ? this.local : this.scope, a.value);
		return fn && fn.apply(this.object, evaluate(b));
	});

	evaluateRule("(", function(a, b, c) {
		let fn = this.setObjectProp(evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
		return fn && fn.apply(this.object, evaluate(c));
	});


	evaluateRule("=>", function(a, b) {

		let args = [a.value];
		let tokens = _flat_tokens(b);

		return function(..._args) {
			let r = {};
			args.forEach((key, index) => r[key] = _args[index]);
			tokens.forEach(t => t.local = r);
			return evaluate(b);
		}
	});


	evaluateRule("as", function(a, b, c) {

		let arrayLike = evaluate(a) || [];

		let name_of_item = b.value;
		let name_of_index = c.value || b.value;

		let ret = Array.from(arrayLike).map((value, index) => {
			let r = Object.create(null);
			r[name_of_index] = index;
			r[name_of_item] = value;
			r["@@entries"] = [value, index];
			return r;
		});

		ret["@@keys"] = [name_of_item, name_of_index];
		return ret;

		// 	return Observable.from(observable).pipe(observer => {
		// 		let index = 0;
		//
		// 		return {
		// 			next: function(value) {
		//
		//
		// //				$watch(observable, index)
		//
		// 				observer.next(value, index++, b.value, c.value);
		// 			},
		//
		// 			complete: function() {
		// 				observer.complete();
		// 				index = 0;
		// 			}
		// 		}
		// 	});
	});


	evaluateRule("=", function(a, b) {
		let A = evaluate(a);
		let B = evaluate(b);

		if (a.object) {
			a.object[a.prop] = B;
		}

		return B;
	});


	evaluateRule("|", function(a, b, c) {
		let value = evaluate(a);
		let args = c.map(evaluate);

		return module.pipe.require(b.value, pipe => {
			return pipe(value, ...args);
		});
	});


	function _flat_tokens(token) {
		let tokens = [];

		let stack = [token];
		while (stack.length) {
			let t = stack.pop();
			tokens.push(t);
			if (t.length) {
				foreach(t, o => stack.push(o));
			}
		}

		return tokens;
	}

	evaluateRule("as", function(a, b, c, d) {

		let arrayLike = evaluate(a) || [];

		let name_of_item = b.value;
		let name_of_index = c.value || b.value;

		let tokens = _flat_tokens(d);

		let ret = Array.from(arrayLike).map((value, index) => {
			let r = Object.create(null);
			r[name_of_index] = index;
			r[name_of_item] = value;
			r["@@entries"] = [value, index];
			r["@@keys"] = [name_of_item, name_of_index];

			tokens.forEach(t => {
				t.local = r;
			});

			return evaluate(d);
		});

		ret["@@keys"] = [name_of_item, name_of_index];
		return ret;


		// 	return Observable.from(observable).pipe(observer => {
		// 		let index = 0;
		//
		// 		return {
		// 			next: function(value) {
		//
		//
		// //				$watch(observable, index)
		//
		// 				observer.next(value, index++, b.value, c.value);
		// 			},
		//
		// 			complete: function() {
		// 				observer.complete();
		// 				index = 0;
		// 			}
		// 		}
		// 	});
	});


	evaluateRule("if", function(a, b) {

		this.ifcondition = evaluate(b);
		if (this.ifcondition) {
			return evaluate(a);
		}

		return undefined;
	});


	function setContext(tokens, scope, local) {
		tokens.forEach(function(token) {
			token.scope = scope;
			token.local = local || Object.create(null);
			token.cached = false;
		});
	}

	function $parse(script) {
		$tokens = tokenize(script);
		let tokens = $tokens.slice();

		next();
		let root = expression();

		function $expr(context, local) {
			setContext(tokens, context, local);
			return evaluate(root);
		}

		$expr.assign = function(context, local, value) {

			setContext(tokens, context, local);
			evaluate(root);

			if (!root.object || !root.prop || root.ifcondition === false) {
				return false;
			}

			root.object[root.prop] = value;
			return true;
		};


		$expr.watch$ = function(context, local) {
			return new Observable(function(observer) {
				setContext(tokens, context, local);

				let stop$ = Observable.subject();

				let watchers = [];
				tokens.forEach(token => {
					token.watch = function() {
						watchers.push(watch$(token.object, token.prop).takeUntil(stop$));
					};
				});

				function nextValue() {
					stop$.next();

					watchers = [];
					let value = evaluate(root);

					if (root.ifcondition !== false) {
						value instanceof Observable ? value.subscribe(observer) : observer.next(value);
					}

					Observable.merge(...watchers).take(1).subscribe(_ => {
						nextTick(nextValue);
					});
				}

				nextValue();

				return function() {
					stop$.complete();
				}
			});
		};

		return $expr;
	}


	const nextTick = function() {

		let i = 0;
		let index = 0;
		let queue = [];

		function nextTick(fn) {
			if (fn && typeof fn !== "function") throw TypeError("argument is must be function.");

			if (queue.length === 0) {
				Promise.resolve().then(() => {
					nextTick.commit();
				})
			}

			queue.push(fn);
		}

		nextTick.queue = queue;

		nextTick.commit = function() {
			let fn;
			while (fn = queue[index++]) {
				fn();
			}

			index = 0;
			queue.length = 0;
		};

		return nextTick;
	}();


	/// @FIXME: JS는 말고 템플릿에서도 적용되는데... 1pxContext 처럼 이름을 지으면 붙여줘야겠다.
	class JSContext {
		static get nextTick() {
			return nextTick;
		}

		static parse(script) {
			return $parse(script);
		}

		static connect(global, local) {
			let context = new JSContext(global, local);
			let ret = context.watch$.bind(context);
			Object.setPrototypeOf(ret, context);

			// @FIXME:...
			ret.nextTick = nextTick;
			return ret;
		}

		constructor(global, local) {
			this.global = global || Object(null);
			this.local = local || Object(null);
			this.disconnect$ = Observable.subject();
		}

		disconnect() {
			this.disconnect$.complete();
		}

		fork(local) {
			local = Object.assign(Object.create(this.local), local);
			return new JSContext(this.global, local);
		}

		evaluate(script) {
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
			$parse(script).watch$(this.global, this.local).takeUntil(this.disconnect$).do(next).subscribe();

			if (typeof fn === "function") {
				return;
			}

			return new Observable(observer => {
				next = observer.next.bind(observer);
			}).takeUntil(this.disconnect$);
		}

		on$(el, type, useCapture) {
			if (Array.isArray(type)) {
				return Observable.merge(...type.map(type => this.on$(el, type, useCapture)));
			}

			return Observable.fromEvent(el, type, useCapture).takeUntil(this.disconnect$);
		}

		/// @FIXME: .. 기능 확대 필요!!! ex) /users/:id
		route(handler) {
			let route = () => {
				let hash = location.hash || "#/";
				(handler[hash] && handler[hash]()) || handler["*"] && handler["*"]();
			};

			this.on$(window, "popstate").subscribe(route);
			route();
		}
	}

	exports.JSContext = JSContext;
})();