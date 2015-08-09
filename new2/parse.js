(function(window, document) {
	var tokenize = function() {
		var regex = [
			["ws", /\s+/],
			["name", /[^0-9\s\u0000-\u0023\u0025-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u00a0\u200C\u200D][^\s\u0000-\u0023\u0025-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u00a0\u200C\u200D]*/],
			["operator", /===|!==|==|!=|<=|>=|&&|\|\|/],
			["operator", /\+\+|--|(?:>>>|>>|<<|[-+*\/%&^|])=?/],
			["number", /0[xX][0-9a-fA-F]+|[0-9]*\.[0-9]+|[0-9]+/],
			["string", /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/],
			["regexp", /\/(?:\\.|[^\/])+\/\w*/],
			["operator", /./]
		];

		var len = regex.length;
		var regex_string = regex.map(function(row) { return "(" + row[1].source + ")" }).join("|");
		var regexp = new RegExp(regex_string, "g");

		return function(script) {
			var result = [];
			var token = {};

			script.replace(regexp, function(value) {

				/// skip ws
				if (arguments[1] !== undefined) {
					token = {};
					return value;
				}

				for (var i = 1; i < len; i++) {
					if (arguments[i + 1] === undefined) {
						continue;
					}

					token = {};
					token.type = regex[i][0];
					token.value = value;
					result.push(token);
					return value;
				}

				return value;
			});

			return result;
		}
	}();

	var uuid = 0;
	var symbol_table = {};
	var token;
	var tokens;
	var token_nr;

	function error(t, message) {
		t.name = "SyntaxError";
		t.message = message;
		throw t;
	}

	function itself() {
		return this;
	}

	function advance(id) {
		var a, o, t, v;

		if (id && token.id !== id) {
			return error(token, "Expected '" + id + "'.");
		}

		if (token_nr >= tokens.length) {
			token = symbol_table["(end)"];
			return;
		}

		t = tokens[token_nr++];
		a = t.type;
		v = t.value;

		console.log(symbol_table, t, a, v);

		if (a === "name") {
			o = symbol_table.hasOwnProperty(v) ? symbol_table[v] : symbol_table["(name)"];
		}
		else if (a === "operator") {
			o = symbol_table[v];
			if (!o) {
				error(t, "Unknown operator.");
			}
		}
		else if (a === "string") {
			o = symbol_table["(literal)"];
			a = "literal";
			v = eval(v);
		}
		else if (a === "number") {
			o = symbol_table["(literal)"];
			a = "literal";
			v = +v;
		}
		else {
			error(t, "Unexpected token.");
		}

		token = Object.create(o);
		token.value = v;
		token.arity = a;
		token.uuid = uuid++;

		return token;
	}

	function expression(rbp) {
		var left;
		var t = token;

		advance();
		left = t.nud();
		while(rbp < token.lbp) {
			t = token;
			advance();
			left = t.led(left);
		}
		return left;
	}

	var original_symbol = {
		length: 0,

		nud: function() {
			error(this, "Undefined.");
		},

		led: function() {
			error(this, "Missing operator.");
		},

		push: function(value) {
			value.parent = this;
			this[this.length++] = value;
		},

		calc: function(scope) {
			var ret = this.calcFn[this.arity].call(this, scope, this[0], this[1], this[2]);
			this.calc = function() { return ret; };
			return ret;
		},

		uncache: function() {
			var t = this;
			while(t) {
				delete t.calc;
				t = t.parent;
			}
		}
	};

	function symbol(id, bp) {
		var s = symbol_table[id];
		bp = bp || 0;
		if (s) {
			if (bp >= s.lbp) {
				s.lbp = bp;
			}
		}
		else {
			s = Object.create(original_symbol);
			s.id = s.value = id;
			s.lbp = bp;
			s.calcFn = s.calcFn || {};
			symbol_table[id] = s;
		}
		return s;
	}

	function constant(s, v) {
		var x = symbol(s);
		x.nud = function() {
			this.arity = "constant";
			return this;
		};
		x.value = v;
		x.calc = function() { return v; };
		return x;
	}

	function infix(id, bp, led, calc, calc2) {
		var s = symbol(id, bp);
		s.led = led || function(left) {
			this.push(left);
			this.push(expression(bp)); /// bp? 따로 함수로 뺄수 있는지 확인해보자..
			this.arity = "binary";
			return this;
		};

		calc && (s.calcFn["binary"] = calc);
		calc2 && (s.calcFn["ternary"] = calc2);

		return s;
	}

	function infixr(id, bp, led, calc, calc2) {
		var s = symbol(id, bp);
		s.led = led || function(left) {
			this.push(left);
			this.push(expression(bp - 1));
			this.arity = "binary";
			return this;
		};

		calc && (s.calcFn["binary"] = calc);
		calc2 && (s.calcFn["ternary"] = calc2);

		return s;
	}

	function prefix(id, nud, calc) {
		var s = symbol(id);
		s.nud = nud || prefix.nud;
		s.calcFn["unary"] = calc;
		return s;
	}

	prefix.nud = function() {
		this.push(expression(80));
		this.arity = "unary";
		return this;
	};

	constant("undefined", undefined);
	constant("null", null);
	constant("true", true);
	constant("false", false);
	constant("Infinity", Infinity);
	constant("-Infinity", -Infinity);
	constant("NaN", NaN);

	symbol(":");
	symbol(",");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol("(end)");

	symbol("(name)").nud = function() {
		return this;
	};

	symbol("(name)").calcFn = {
		"name": function(scope) {
			var token = this;
			var obj = scope.$scope;
			var key = token.value;

			scope.$watch(obj, "", key, token);

			return scope.find(key);
		},

		"literal": function() {
			return this.value;
		}
	};

	symbol("(literal)").nud = itself;
	symbol("(literal)").calcFn = {
		"literal": function() {
			return this.value;
		}
	};

	symbol("this").nud = function() {
		this.arity = "this";
		return this;
	};


	infix("+", 60, null, function(scope, a, b) { return a.calc(scope) + b.calc(scope); });
	infix("-", 60, null, function(scope, a, b) { return a.calc(scope) - b.calc(scope); });
	infix("*", 70, null, function(scope, a, b) { return a.calc(scope) * b.calc(scope); });
	infix("/", 70, null, function(scope, a, b) { return a.calc(scope) / b.calc(scope); });
	infix("%", 70, null, function(scope, a, b) { return a.calc(scope) % b.calc(scope); });

	infix(".", 90, function(left) {
		if (token.arity !== "name") {
			error(token, "Expected a property name.");
		}
		token.arity = "literal";

		this.push(left);
		this.push(token);
		this.arity = "binary";

		advance();
		return this;

	}, function(scope, a, b) {
		var token = this;
		var obj = a.calc(scope);
		var key = b.value;

		scope.$watch(obj, a.path, key, token);

		return obj && obj[key];
	});

	infix("[", 90, function(left) {
		this.push(left);
		this.push(expression(0));
		this.arity = "binary";
		advance("]");
		return this;
	}, function(scope, a, b) {
		var token = this;
		var obj = a.calc(scope);
		var key = b.calc(scope);

		scope.$watch(obj, a.path, key, token);

		return obj && obj[key];
	});

	infix("(", 90, function(left) {
		var args = [];
		if (left.id === "." || left.id === "[") {
			this.arity = "ternary";
			this.push(Object.create(left[0]));
			this.push(Object.create(left[1]));
			this.push(args);
		}
		else {
			this.arity = "binary";
			this.push(left);
			this.push(args);
			if ((left.arity !== "unary" || left.id !== "function")
				&& left.arity !== "name" && left.id !== "("
				&& left.id !== "&&" && left.id !== "||" && left.id !== "?") {
				error(left, "Expected a variable name.");
			}
		}

		if (token.id !== ")") {
			while(true) {
				var v = expression(0);
				v.parent = args;
				args.push(v);
				if (token.id !== ",") {
					break;
				}
				advance(",");
			}
		}

		advance(")");
		return this;

	}, function(scope, a, b) {
		var thisObj = scope.$scope;
		return a.calc(scope).apply(thisObj, b.map(function(v) {
			return v.calc(scope);
		}));

	}, function(scope, a, b, c) {
		console.log("!", b);

		var thisObj = a.calc(scope);
		return thisObj[b.calc(scope)].apply(thisObj, c.map(function(v) {
			return v.calc(scope);
		}));
	});


	infix("?", 20, function(left) {
		this.push(left);
		this.push(expression(0));
		advance(":");
		this.push(expression(0));
		this.arity = "ternary";
		return this;
	}, null, function(scope, a, b, c) {
		return a.calc(scope) ? b.calc(scope) : c.calc(scope);
	});


	infixr("&&", 30, null, function(scope, a, b) { return a.calc(scope) && b.calc(scope); });
	infixr("||", 30, null, function(scope, a, b) { return a.calc(scope) || b.calc(scope); });
	infixr("===", 40, null, function(scope, a, b) { return a.calc(scope) === b.calc(scope); });
	infixr("!==", 40, null, function(scope, a, b) { return a.calc(scope) !== b.calc(scope); });
	infixr("==", 40, null, function(scope, a, b) { return a.calc(scope) == b.calc(scope); });
	infixr("!=", 40, null, function(scope, a, b) { return a.calc(scope) != b.calc(scope); });
	infixr("<", 50, null, function(scope, a, b) { return a.calc(scope) < b.calc(scope); });
	infixr("<=", 50, null, function(scope, a, b) { return a.calc(scope) <= b.calc(scope); });
	infixr(">", 50, null, function(scope, a, b) { return a.calc(scope) > b.calc(scope); });
	infixr(">=", 50, null, function(scope, a, b) { return a.calc(scope) >= b.calc(scope); });

	prefix("+", null, function(scope, a) { return +a.calc(scope); });
	prefix("-", null, function(scope, a) { return -a.calc(scope); });
	prefix("!", null, function(scope, a) { return !a.calc(scope); });

	prefix("(", function() {
		var e = expression(0);
		advance(")");
		return e;
	});

	prefix("[", function() {
		var array = [];
		if (token.id !== "]") {
			for (; ;) {
				array.push(expression(0));
				if (token.id !== ",") {
					break;
				}
				advance(",");
			}
		}
		advance("]");
		this.push(array);
		this.arity = "unary";
		return this;

	}, function(a) {
		return a.map(function(v) {
			return v.calc(scope);
		});
	});

	prefix("{", function() {
		var a = [], n, v;
		if (token.id !== "}") {
			for (; ;) {
				n = token;
				if (n.arity !== "name" && n.arity !== "literal") {
					error(token, "Bad property name.");
				}
				advance();
				advance(":");
				v = expression(0);
				v.key = n.value;
				a.push(v);
				if (token.id !== ",") {
					break;
				}
				advance(",");
			}
		}
		advance("}");
		this.push(a);
		this.arity = "unary";
		return this;
	}, function(scope, a) {
		var ret = {};
		a.forEach(function(v) {
			ret[v.key] = v.calc(scope);
		});
		return ret;
	});


// @TODO: parse는 cahce가능하게.. token도 cache가능하게 하자.
// @TODO: parse는 비용이 비싸니까 파스트리는 공유한다. scope는 별개, observer도 별개로 운용하도록!!

	function $parse(source) {
		tokens = tokenize(source);
		token_nr = 0;
		advance();
		var s = expression(0);
		advance("(end)");

		return function(scope) {
			var ret = s.calc(scope);

			console.info(JSON.stringify(s, [0, 1, 2, "uuid", "value", "arity", "path"], "\t"));

			return ret;
		}
	}

	window.$parse = $parse;
}(window));