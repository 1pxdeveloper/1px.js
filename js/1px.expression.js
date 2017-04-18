(function(window, document, undefined) {

	/// Tokenizer
	var re = /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)|((?:\d*\.\d+)|\d+)|('[^']*'|"[^"]*")|(===|!==|==|!=|<=|>=|&&|\|\||[-+*/!?:.,<>\[\]\(\){}])|./g;

	var TOKEN_TYPES = [
		"",
		"(name)",
		"(number)",
		"(string)",
		"(operator)"
	];

	function tokenize(expr, def) {
		if (typeof expr !== "string") {
			throw "arguments 0 is must be string.";
		}

		def = def || {};

		var tokens = [];
		expr.replace(re, function(value) {
			for (var i = 1, len = TOKEN_TYPES.length; i < len; i++) {
				if (!arguments[i]) {
					continue;
				}

				var o = def[value];
				if (o && o.type === "(macro)") {
					tokens = tokens.concat(tokenize(o.value, def));
					break;
				}

				if (o) {
					tokens.push(def[value]);
					break;
				}

				tokens.push({
					type: TOKEN_TYPES[i],
					value: value
				});
				break;
			}

			return value;
		});

		tokens.index = 0;
		return tokens;
	}


	/// Scope
	var symbol_table = {};


	/// Expression
	var tokens;
	var token;

	function expression(rbp) {
		rbp = rbp || 0;

		var t = token;
		next();

		var left = t.nud();
		while (rbp < token.lbp) {
			t = token;
			next();

			left = t.led(left);
		}

		return left;
	}

	function next(id) {
		if (id && token.id !== id) {
			token.error("Unexpected token " + token.id);
		}

		var t = tokens[tokens.index++];
		if (!t) {
			token = symbol_table["(end)"];
			return token;
		}

		var type = t.type;
		var value = t.value;
		var o;

		/// scope에서 찾는다.
		switch (type) {
			case "(name)":
				o = symbol_table[value] || symbol_table["(name)"];
				if (o.hasOwnProperty("value")) {
					value = o.value;
				}
				break;

			case "(number)":
				o = symbol_table["(literal)"];
				value = +value;
				break;

			case "(string)":
				o = symbol_table["(literal)"];
				value = value.slice(1, -1);
				break;

			case "(literal)":
				o = symbol_table["(literal)"];
				break;

			case "(operator)":
				o = symbol_table[value];
				break;
		}

		if (!o) {
			throw "has not defined symbol: " + id;
		}

		token = Object.create(o);
		token.value = value;

		t.token = token;

		return token;
	}


	/// Symbol
	var symbol_prototype = {
		lbp: 0,
		nbp: 0,
		arity: 0,

		cached: false,
		callback: noop,
		_unlink: noop,

		nud: function() {
			this.error("Undefined.");
		},

		led: function() {
			this.error("Missing Operator.");
		},

		push: function(key, token) {
			this[key] = token;
			token.parent = this;
			this.arity++;
		},

		error: function(e) {
			throw e;
		}
	};

	function constant_nud() {
		this.id = "(literal)";
		return this;
	}

	function default_prefix_nud() {
		this.push("a", expression(this.nbp));
		return this;
	}

	function default_infix_led(left) {
		this.push("a", left);
		this.push("b", expression(this.lbp));
		return this;
	}

	function default_infixr_led(left) {
		this.push("a", left);
		this.push("b", expression(this.lbp - 1));
		return this;
	}


	function symbol(id) {
		var s = symbol_table[id] = symbol_table[id] || Object.create(symbol_prototype);
		s.id = id;
		return s;
	}

	function constant(id, value) {
		var s = symbol(id);
		s.value = value;
		s.nud = constant_nud;
		return s;
	}

	function prefix(id, bp, nud) {
		var s = symbol(id);
		s.nbp = bp;
		s.nud = nud || default_prefix_nud;
		return s;
	}

	function infix(id, bp, led) {
		var s = symbol(id);
		s.lbp = bp;
		s.led = led || default_infix_led;
		return s;
	}

	function infixr(id, bp, led) {
		var s = symbol(id);
		s.lbp = bp;
		s.led = led || default_infixr_led;
		return s;
	}


	// Define Symbols
	symbol(":");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol(",");
	symbol("(array)");
	symbol("(object)");

	symbol("(end)").nud = function() {
		return this;
	};

	symbol("(literal)").nud = function() {
		return this;
	};

	symbol("(name)").nud = function() {
		this.push("a", this.value);
		return this;
	};

	constant("true", true);
	constant("false", false);
	constant("undefined", undefined);
	constant("null", null);
	constant("Math", Math);
	constant("NaN", NaN);
	constant("Date", Date);
	constant("Number", Number);
	constant("Array", Array);
	constant("Object", Object);


	infix("?", 20, function(left) {
		this.push("a", left);
		this.push("b", expression());
		next(":");
		this.push("c", expression());

		return this;
	});

	infixr("&&", 30);
	infixr("||", 30);

	infixr("===", 40);
	infixr("!==", 40);
	infixr("==", 40);
	infixr("!=", 40);
	infixr("<", 40);
	infixr("<=", 40);
	infixr(">", 40);
	infixr(">=", 40);

	infix("+", 50);
	infix("-", 50);

	infix("*", 60);
	infix("/", 60);

	prefix("+", 70);
	prefix("-", 70);
	prefix("!", 70);

	prefix("(", 70, function() {
		var e = expression();
		next(")");
		return e;
	});

	prefix("[", 70, function() {
		var array = Object.create(symbol_table["(array)"]);
		array.value = [];

		if (token.id !== "]") {
			for (; ;) {
				var e = expression(0);
				e.parent = array;
				array.value.push(e);

				if (token.id !== ",") {
					break;
				}
				next(",");
			}
		}

		next("]");
		return array;
	});

	prefix("{", 70, function() {
		var args = [];
		if (token.id !== "}") {
			for (; ;) {
				if (token.id !== "(name)" && token.id !== "(literal)") {
					this.error("Unexpected token " + token.id);
				}

				var key = token.value;
				next();
				next(":");

				var o = expression(0);
				o.key = key;
				args.push(o);

				if (token.id !== ",") {
					break;
				}
				next(",");
			}
		}
		next("}");

		this.push("a", args);
		return this;
	});

	infix(".", 80, function(left) {
		if (token.id !== "(name)") {
			this.error("Unexpected token " + token.id);
		}

		this.push("a", left);
		this.push("b", token);
		next();

		return this;
	});

	infix("[", 80, function(left) {
		this.push("a", left);
		this.push("b", expression());
		next("]");

		return this;
	});

	infix("(", 80, function(left) {
		var args = Object.create(symbol_table["(array)"]);
		args.value = [];

		if (left.id === "." || left.id === "[") {
			this.push("a", left.a);
			this.push("b", left.b);
			this.push("c", args);
			this.leftId = left.id;
		}
		else {
			this.push("a", left);
			this.push("b", args);
		}

		if (token.id !== ")") {
			for (; ;) {
				var e = expression(0);
				e.parent = args;
				args.value.push(e);

				if (token.id !== ",") {
					break;
				}
				next(",");
			}
		}
		next(")");

		return this;
	});


	/// Evaluate
	var evaluateRules = {};

	function evaluate(token) {
		if (!token.watchable || !token.cached) {
			token.cache = evaluateRules[token.id][token.arity](token, token.a, token.b, token.c);
			token.cached = true;
		}

		return token.cache;
	}

	function evaluateRule(id, arity, fn) {
		evaluateRules[id] = evaluateRules[id] || {};
		evaluateRules[id][arity] = fn;
	}

	evaluateRule("(end)", 0, function(token) {
		return undefined;
	});

	evaluateRule("(literal)", 0, function(token) {
		return token.value;
	});

	evaluateRule("(array)", 0, function(token) {
		var value = token.value;
		var len = value.length;
		var array = Array(len);
		for (var i = 0; i < len; i++) {
			array[i] = evaluate(value[i]);
		}

		return array;
	});

	evaluateRule("(name)", 1, function(token, a) {
		token.object = token.$scope || {};
		token.prop = a;
		return token.object[a];
	});

	evaluateRule("+", 1, function(token, a) {
		return +evaluate(a);
	});

	evaluateRule("-", 1, function(token, a) {
		return -evaluate(a);
	});

	evaluateRule("!", 1, function(token, a) {
		return !evaluate(a);
	});

	evaluateRule("{", 1, function(token, a) {
		var object = {};
		for (var i = 0, len = a.length; i < len; i++) {
			var o = a[i];
			object[o.key] = evaluate(o);
		}

		return object;
	});

	evaluateRule("&&", 2, function(token, a, b) {
		return evaluate(a) && evaluate(b);
	});
	evaluateRule("||", 2, function(token, a, b) {
		return evaluate(a) || evaluate(b);
	});

	evaluateRule("===", 2, function(token, a, b) {
		return evaluate(a) === evaluate(b);
	});
	evaluateRule("!==", 2, function(token, a, b) {
		return evaluate(a) !== evaluate(b);
	});
	evaluateRule("==", 2, function(token, a, b) {
		return evaluate(a) == evaluate(b);
	});
	evaluateRule("!=", 2, function(token, a, b) {
		return evaluate(a) != evaluate(b);
	});
	evaluateRule("<", 2, function(token, a, b) {
		return evaluate(a) < evaluate(b);
	});
	evaluateRule("<=", 2, function(token, a, b) {
		return evaluate(a) <= evaluate(b);
	});
	evaluateRule(">", 2, function(token, a, b) {
		return evaluate(a) > evaluate(b);
	});
	evaluateRule(">=", 2, function(token, a, b) {
		return evaluate(a) >= evaluate(b);
	});

	evaluateRule("+", 2, function(token, a, b) {
		return evaluate(a) + evaluate(b);
	});
	evaluateRule("-", 2, function(token, a, b) {
		return evaluate(a) - evaluate(b);
	});
	evaluateRule("*", 2, function(token, a, b) {
		return evaluate(a) * evaluate(b);
	});
	evaluateRule("/", 2, function(token, a, b) {
		return evaluate(a) / evaluate(b);
	});
	evaluateRule("?", 3, function(token, a, b, c) {
		return evaluate(a) ? evaluate(b) : evaluate(c);
	});

	evaluateRule(".", 2, function(token, a, b) {
		a = evaluate(a) || {};
		token.object = a;
		token.prop = b.value;

		return token.object[token.prop];
	});

	evaluateRule("[", 2, function(token, a, b) {
		a = evaluate(a) || {};
		b = evaluate(b);
		token.object = a;
		token.prop = b;

		return token.object[token.prop];
	});

	evaluateRule("(", 2, function(token, a, b) {
		token.object = token.$scope || {};
		token.prop = a.value;

		var fn = token.object[token.prop] || noop;
		var args = evaluate(b);

		return fn.apply(token.object, args);
	});

	evaluateRule("(", 3, function(token, a, b, c) {
		a = evaluate(a) || {};
		b = b.id === "(name)" ? b.value : evaluate(b);
		token.object = a;
		token.prop = b;

		var fn = token.object[token.prop] || noop;
		var args = evaluate(c);

		return fn.apply(token.object, args);
	});


	// -----------------------------------------------------------------------------

	function $$build(script, def) {
		try {
			tokens = tokenize(script, def);
			next();
			var e = expression();
			var _tokens = tokens.map(function(t) {
				return t.token;
			});

			return {
				e: e,
				tokens: _tokens
			}
		}
		catch (e) {
			throw script + " " + e;
		}

		return
	}

	function $parse(script, def) {

		var tree = $$build(script, def);

		var _tokens = tree.tokens;
		var e = tree.e;

		function setScope($scope) {
			foreach(_tokens, function(token) {
				token.$scope = $scope;
				token.cached = false;
			});
		}

		function result($scope) {
			setScope($scope);
			return evaluate(e);
		}

		result.assign = function($scope, value) {
			setScope($scope);
			evaluate(e);

			if (e.id === "(name)" || e.id === "[" || e.id === ".") {
				e.object[e.prop] = value;
			}
			else {
				throw "not assignable expression: " + script;
			}
		};

		result.e = e;

		return result;
	}


	function flush(token) {
		var root = token;

		while (token) {
			token.cached = false;
			token = token.parent;
		}

		return root;
	}

	function $$watchObjectProperty(token) {
		token._callback = function() {
			flush(token);
		};

		token._unlink = function(a, b, c) {
			return function() {
				$unwatch(a, b, c);
			}
		}(token.object, token.prop, token._callback);

		$watch(token.object, token.prop, token._callback);
	}


	function $$watch(script, context, callback, args, def) {
		var tree = $$build(script, def);
		var root = tree.e;
		var _tokens = tree.tokens;


		// 컨텍스트 설정
		foreach(_tokens, function(token) {
			token.$scope = context;
			token.watchable = true;
			token.cached = false;
		});


		// 콜백함수 설정
		root.callback = callback;
		root.args = [context].concat(args || []);


		// 초기값 확인 후 콜백 호출
		var result = evaluate(root);
		callback.apply(window, root.args.concat([result]));


		// 루트 callback
		$watch(root, "cached", function() {
			if (root.cached === true) {
				return;
			}

			$rAF(function() {
				// property 변화를 통해 expression 변경 감시
				foreach(_tokens, function(token) {
					if (token._unlink) {
						token._unlink()
					}
				});

				var oldValue = root.cache;
				var newValue = evaluate(root);
				callback.apply(window, root.args.concat([newValue, oldValue]));

				// property 변화를 통해 expression 변경 감시
				foreach(_tokens, function(token) {
					if (token.id === "(name)" || token.id === "[" || token.id === ".") {
						$$watchObjectProperty(token);
					}
				});
			});
		});

		// property 변화를 통해 expression 변경 감시
		foreach(_tokens, function(token) {
			if (token.id === "(name)" || token.id === "[" || token.id === ".") {
				$$watchObjectProperty(token);
			}
		});
	}

	window.$parse = $parse;
	window.$$watch = function(script, context, callback, args, def) {

		if (Array.isArray(script)) {
			foreach(script, function(_script) {
				$$watch(_script, context, callback, args, def);
			});

			return;
		}

		$$watch(script, context, callback, args, def);
	}

})(window, document);