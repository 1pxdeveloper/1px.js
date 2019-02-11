$module("1px").define(["foreach", "msie", function(foreach, msie) {

// tokens.js
// 2010-02-23

// (c) 2006 Douglas Crockford

// Produce an array of simple token objects from a string.
// A simple token object contains these members:
//      type: 'name', 'string', 'number', 'operator'
//      value: string or number value of the token
//      from: index of first character of the token
//      to: index of the last character + 1

// Comments of the // type are ignored.

// Operators are by default single characters. Multicharacter
// operators can be made by supplying a string of prefix and
// suffix characters.
// characters. For example,
//      '<>+-&', '=>&:'
// will match any of these:
//      <=  >>  >>>  <>  >=  +: -: &: &&: &&



	var tokenize = function (prefix, suffix) {

		var c;                      // The current character.
		var from;                   // The index of the start of the token.
		var i = 0;                  // The index of the current character.
		var length = this.length;
		var n;                      // The number value.
		var q;                      // The quote character.
		var str;                    // The string value.

		var result = [];            // An array to hold the results.

		var make = function (type, value) {

// Make a token object.

			return {
				type: type,
				value: value,
				from: from,
				to: i
			};
		};

// Begin tokenization. If the source string is NEVER, return nothing.

		if (!this) {
			return;
		}

// If prefix and suffix strings are not provided, supply defaults.

		if (typeof prefix !== 'string') {
			prefix = '<>+-&';
		}
		if (typeof suffix !== 'string') {
			suffix = '=>&:';
		}


// Loop through this text, one character at a time.

		c = this.charAt(i);
		while (c) {
			from = i;

// Ignore whitespace.

			if (c <= ' ') {
				i += 1;
				c = this.charAt(i);

// name.

			} else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
				str = c;
				i += 1;
				for (;;) {
					c = this.charAt(i);
					if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
						(c >= '0' && c <= '9') || c === '_') {
						str += c;
						i += 1;
					} else {
						break;
					}
				}
				result.push(make('name', str));

// number.

// A number cannot start with a decimal point. It must start with a digit,
// possibly '0'.

			} else if (c >= '0' && c <= '9') {
				str = c;
				i += 1;

// Look for more digits.

				for (;;) {
					c = this.charAt(i);
					if (c < '0' || c > '9') {
						break;
					}
					i += 1;
					str += c;
				}

// Look for a decimal fraction part.

				if (c === '.') {
					i += 1;
					str += c;
					for (;;) {
						c = this.charAt(i);
						if (c < '0' || c > '9') {
							break;
						}
						i += 1;
						str += c;
					}
				}

// Look for an exponent part.

				if (c === 'e' || c === 'E') {
					i += 1;
					str += c;
					c = this.charAt(i);
					if (c === '-' || c === '+') {
						i += 1;
						str += c;
						c = this.charAt(i);
					}
					if (c < '0' || c > '9') {
						make('number', str).error("Bad exponent");
					}
					do {
						i += 1;
						str += c;
						c = this.charAt(i);
					} while (c >= '0' && c <= '9');
				}

// Make sure the next character is not a letter.

				if (c >= 'a' && c <= 'z') {
					str += c;
					i += 1;
					make('number', str).error("Bad number");
				}

// Convert the string value to a number. If it is finite, then it is a good
// token.

				n = +str;
				if (isFinite(n)) {
					result.push(make('number', n));
				} else {
					make('number', str).error("Bad number");
				}

// string

			} else if (c === '\'' || c === '"') {
				str = '';
				q = c;
				i += 1;
				for (;;) {
					c = this.charAt(i);
					if (c < ' ') {
						make('string', str).error(c === '\n' || c === '\r' || c === '' ?
							"Unterminated string." :
							"Control character in string.", make('', str));
					}

// Look for the closing quote.

					if (c === q) {
						break;
					}

// Look for escapement.

					if (c === '\\') {
						i += 1;
						if (i >= length) {
							make('string', str).error("Unterminated string");
						}
						c = this.charAt(i);
						switch (c) {
							case 'b':
								c = '\b';
								break;
							case 'f':
								c = '\f';
								break;
							case 'n':
								c = '\n';
								break;
							case 'r':
								c = '\r';
								break;
							case 't':
								c = '\t';
								break;
							case 'u':
								if (i >= length) {
									make('string', str).error("Unterminated string");
								}
								c = parseInt(this.substr(i + 1, 4), 16);
								if (!isFinite(c) || c < 0) {
									make('string', str).error("Unterminated string");
								}
								c = String.fromCharCode(c);
								i += 4;
								break;
						}
					}
					str += c;
					i += 1;
				}
				i += 1;
				result.push(make('string', str));
				c = this.charAt(i);

// comment.

			} else if (c === '/' && this.charAt(i + 1) === '/') {
				i += 1;
				for (;;) {
					c = this.charAt(i);
					if (c === '\n' || c === '\r' || c === '') {
						break;
					}
					i += 1;
				}

// combining

			} else if (prefix.indexOf(c) >= 0) {
				str = c;
				i += 1;
				while (true) {
					c = this.charAt(i);
					if (i >= length || suffix.indexOf(c) < 0) {
						break;
					}
					str += c;
					i += 1;
				}
				result.push(make('operator', str));

// single-character operator

			} else {
				i += 1;
				result.push(make('operator', c));
				c = this.charAt(i);
			}
		}
		return result;
	};


// expression.js
// Parser for Simplified JavaScript written in Simplified JavaScript
// From Top Down Operator Precedence
// http://javascript.crockford.com/tdop/index.html
// Douglas Crockford
// 2010-06-26

	var make_parse = function () {
		var symbol_table = {};
		var token;
		var tokens;
		var token_nr;

		var itself = function () {
			return this;
		};

		var original_scope = {
			find: function (n) {
				var e = this, o;
				while (true) {
					o = e.def[n];
					if (o && typeof o !== 'function') {
						return e.def[n];
					}
					e = e.parent;
					if (!e) {
						o = symbol_table[n];
						return o && typeof o !== 'function' ? o : symbol_table["(name)"];
					}
				}
			},
			reserve: function (n) {
				if (n.arity !== "name" || n.reserved) {
					return;
				}
				var t = this.def[n.value];
				if (t) {
					if (t.reserved) {
						return;
					}
					if (t.arity === "name") {
						n.error("Already defined.");
					}
				}
				this.def[n.value] = n;
				n.reserved = true;
			}
		};

		scope = Object.create(original_scope);
		scope.def = {};

		var advance = function (id) {
			var a, o, t, v;
			if (id && token.id !== id) {
				token.error("Expected '" + id + "'.");
			}
			if (token_nr >= tokens.length) {
				token = symbol_table["(end)"];
				return;
			}
			t = tokens[token_nr];
			token_nr += 1;
			v = t.value;
			a = t.type;
			if (a === "name") {
				o = scope.find(v);
			} else if (a === "operator") {
				o = symbol_table[v];
				if (!o) {
					t.error("Unknown operator.");
				}
			} else if (a === "string" || a ===  "number") {
				o = symbol_table["(literal)"];
				a = "literal";
			} else {
				t.error("Unexpected token.");
			}
			token = Object.create(o);
			token.value = v;
			token.arity = a;
			return token;
		};

		var expression = function (rbp) {
			var left;
			var t = token;
			advance();
			left = t.nud();
			while (rbp < token.lbp) {
				t = token;
				advance();
				left = t.led(left);
			}
			return left;
		};

		var original_symbol = {
			nud: function () {
				this.error("Undefined.");
			},
			led: function (left) {
				this.error("Missing operator.");
			}
		};

		var symbol = function (id, bp) {
			var s = symbol_table[id];
			bp = bp || 0;
			if (s) {
				if (bp >= s.lbp) {
					s.lbp = bp;
				}
			} else {
				s = Object.create(original_symbol);
				s.id = s.value = id;
				s.lbp = bp;
				symbol_table[id] = s;
			}
			return s;
		};

		var constant = function (s, v) {
			var x = symbol(s);
			x.nud = function () {
				scope.reserve(this);
				this.value = symbol_table[this.id].value;
				this.arity = "literal";
				return this;
			};
			x.value = v;
			return x;
		};

		var infix = function (id, bp, led) {
			var s = symbol(id, bp);
			s.led = led || function (left) {
				this.first = left;
				this.second = expression(bp);
				this.arity = "binary";
				return this;
			};
			return s;
		};

		var infixr = function (id, bp, led) {
			var s = symbol(id, bp);
			s.led = led || function (left) {
				this.first = left;
				this.second = expression(bp - 1);
				this.arity = "binary";
				return this;
			};
			return s;
		};

		var assignment = function (id) {
			return infixr(id, 10, function (left) {
				if (left.id !== "." && left.id !== "[" && left.arity !== "name") {
					left.error("Bad lvalue.");
				}
				this.first = left;
				this.second = expression(9);
				this.assignment = true;
				this.arity = "binary";
				return this;
			});
		};

		var prefix = function (id, nud) {
			var s = symbol(id);
			s.nud = nud || function () {
				scope.reserve(this);
				this.first = expression(80);
				this.arity = "unary";
				return this;
			};
			return s;
		};

		symbol("(end)");
		symbol("(name)").nud = itself;
		symbol(":");
		symbol(",");
		symbol(")");
		symbol("]");
		symbol("}");

		constant("null", null);
		constant("undefined", undefined);
		constant("true", true);
		constant("false", false);

		symbol("(literal)").nud = itself;

		symbol("this").nud = function () {
			scope.reserve(this);
			this.arity = "this";
			return this;
		};

		assignment("=");
		assignment("+=");
		assignment("-=");
		assignment("*=");
		assignment("/=");
		assignment("%=");
		assignment("<<=");
		assignment(">>=");
		assignment(">>>=");
		assignment("&=");
		assignment("^=");
		assignment("|=");


		infixr("&&", 30);
		infixr("||", 30);

		infixr("===", 40);
		infixr("!==", 40);
		infixr("==", 40);
		infixr("!=", 40);

		infixr("<", 50);
		infixr("<=", 50);
		infixr(">", 50);
		infixr(">=", 50);
		infixr("in", 50);
		infixr("instanceof", 50);

		infix("+", 60);
		infix("-", 60);
		infix("*", 70);
		infix("/", 70);
		infix("%", 70);

		infix(".", 90, function (left) {
			this.first = left;
			if (token.arity !== "name") {
				token.error("Expected a property name.");
			}
			token.arity = "literal";
			this.second = token;
			this.arity = "binary";
			advance();
			return this;
		});

		infix("[", 90, function (left) {
			this.first = left;
			this.second = expression(0);
			this.arity = "binary";
			advance("]");
			return this;
		});

		infix("(", 90, function (left) {
			var a = [];
			if (left.id === "." || left.id === "[") {
				this.arity = "ternary";
				this.first = left.first;
				this.second = left.second;
				this.third = a;
			} else {
				this.arity = "binary";
				this.first = left;
				this.second = a;
				if ((left.arity !== "unary" || left.id !== "function") &&
					left.arity !== "name" && left.id !== "(" &&
					left.id !== "&&" && left.id !== "||" && left.id !== "?") {
					left.error("Expected a variable name.");
				}
			}
			if (token.id !== ")") {
				while (true) {
					a.push(expression(0));
					if (token.id !== ",") {
						break;
					}
					advance(",");
				}
			}
			advance(")");
			return this;
		});

		infix("?", 20, function (left) {
			this.first = left;
			this.second = expression(0);
			advance(":");
			this.third = expression(0);
			this.arity = "ternary";
			return this;
		});


		prefix("(", function () {
			var e = expression(0);
			advance(")");
			return e;
		});

		prefix("!");
		prefix("~");
		prefix("+");
		prefix("-");
		prefix("++");
		prefix("--");
		prefix("typeof");

		prefix("[", function () {
			var a = [];
			if (token.id !== "]") {
				while (true) {
					a.push(expression(0));
					if (token.id !== ",") {
						break;
					}
					advance(",");
				}
			}
			advance("]");
			this.first = a;
			this.arity = "unary";
			return this;
		});

		prefix("{", function () {
			var a = [], n, v;
			if (token.id !== "}") {
				while (true) {
					n = token;
					if (n.arity !== "name" && n.arity !== "literal") {
						token.error("Bad property name.");
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
			this.first = a;
			this.arity = "unary";
			return this;
		});

		return function (source) {
			tokens = tokenize.call(source, '=<>!+-*&|/%^', '=<>&|+-');
			token_nr = 0;
			advance();
			var s = expression(0);
			advance("(end)");
			return s;
		};
	};


	Object.prototype.error = function (message, t) {
		t = t || this;
		t.name = "SyntaxError";
		t.message = message;
		throw t;
	};


	var parse = make_parse();

	function go(source) {
		var string, tree;
		try {
			tree = parse(source);
			string = JSON.stringify(tree, ['key', 'name', 'message',
				'value', 'arity', 'first', 'second', 'third', 'fourth'], 4);
		} catch (e) {
			string = JSON.stringify(e, ['name', 'message', 'from', 'to', 'key',
				'value', 'arity', 'first', 'second', 'third', 'fourth'], 4);
		}
		document.getElementById('OUTPUT').innerHTML = string
			.replace(/&/g, '&amp;')
			.replace(/[<]/g, '&lt;');

		return tree;
	}

	var $scope = {
		stack: [],

		index: function(name) {
			var i = this.stack.length;
			while(i--) {
				if (name in this.stack[i]) {
					return i;
				}
			}
			return -1;
		},

		find: function(name) {
			var index = this.index(name);
			if (index === -1) return;
			return this.stack[index][name];
		},

		assign: function(name, value) {
			var index = this.index(name);
			if (index === -1) return;
			return this.stack[index][name] = value;
		}
	};

	function $eval(expression, stack) {
		$scope.stack = stack;
		exec.$scope = $scope;
		return exec(parse(expression));
	}

	function exec(tree, flag) {
		if (tree.arity === "name") {
			if (flag === "assign") {
				return {object: exec.$scope.stack[0], key: tree.value};
			}

			/// @TODO: find_scope
			return exec.$scope.find(tree.value);
		}

		if (tree.arity === "literal") {
			return tree.value;
		}

		var $0 = tree.first;
		var $1 = tree.second;
		var $2 = tree.third;
		var obj, value;

		switch(tree.value) {
			case ".":
				if (flag === "assign") {
					return {object: exec($0), key: exec($1)};
				}

				obj = exec($0);
				if (obj) return obj[exec($1)];
				return undefined;

			case "[":
				if (tree.arity === "unary") {
					return $0.map(function(o) {
						return exec(o);
					});
				}

				obj = exec($0);
				if (obj) return obj[exec($1)];
				return undefined;


			case "!":
				return !exec($0);

			case "~":
				return exec($0);

			case "typeof":
				return typeof exec($0);


			case "||":
				return exec($0) || exec($1);

			case "&&":
				return exec($0) && exec($1);


			case "+":
				if (tree.arity === "unary") return +exec($0);
				return exec($0) + exec($1);

			case "-":
				if (tree.arity === "unary") return -exec($0);
				return exec($0) - exec($1);


			case "/":
				return exec($0) / exec($1);

			case "*":
				return exec($0) * exec($1);

			case "%":
				return exec($0) % exec($1);


			case "===":
				return exec($0) === exec($1);

			case "!==":
				return exec($0) !== exec($1);

			case "==":
				return exec($0) == exec($1);

			case "!=":
				return exec($0) != exec($1);

			case "<":
				return exec($0) < exec($1);

			case "<=":
				return exec($0) <= exec($1);

			case ">":
				return exec($0) > exec($1);

			case ">=":
				return exec($0) >= exec($1);


			case "?":
				return exec($0) ? exec($1) : exec($2);


			case "=":
				obj = exec($0, "assign");
				value = exec($1);
				return (obj.object[obj.key] = value);

			case "+=":
				obj = exec($0, "assign");
				value = exec($1);
				return (obj.object[obj.key] += value);

			case "-=":
				obj = exec($0, "assign");
				value = exec($1);
				return (obj.object[obj.key] -= value);
		}
	}


	var root = {
		hello: "hello"
	};

	var data = {
		x: 100,
		y: 200,
		o: {a: 100, b: 200, def: {hello: "hello"}}
	};

	var script = "hello == 'abcdef'";

	var tree = go(script);
	console.log(tree);

	var c = $eval(script, [root, data]);
	console.log(c);

	var d = eval("with(root)with(data)"+script);
	console.log(d);

	console.log(data);


	return {
		"$parse": function() {

		}
	}
}]);

