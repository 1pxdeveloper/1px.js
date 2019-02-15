module.factory("$parse", function($nextTick) {

	var $tokens;
	var $token;

	function next(id) {
		if (id && $token && $token.id !== id) {
			$token.error("unexpected token: " + $token.id);
			return;
		}

		var t = $token;
		$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
		return t;
	}

	function expression(rbp) {
		rbp = rbp || 0;

		var t = $token;
		next();

		var left = t.nud() || t;
		while ($token.lbp > rbp) {
			t = $token;
			next();
			left = t.led(left) || t;
		}

		return left;
	}


	/// Symbol
	var $symbol_prototype = {
		lbp: 0,
		nbp: 0,
		length: 0,

		cached: false,
		callback: noop,

		nud: function() {
			this.error("Undefined.");
		},

		led: function() {
			this.error("Missing Operator.");
		},

		push: function() {
			foreach(arguments, function(token) {
				this[this.length++] = token;
				token.parent = this;
			}, this);

			return arguments[arguments.length - 1];
		},

		setObjectProp: function(object, prop) {
			this.object = object;
			this.prop = prop;
		},

		getObjectProp: function() {
			return this.object && this.object[this.prop];
		},

		makeDirty: function() {
			var token = this;
			while (token.parent) {
				token.cached = false;
				token = token.parent;
			}

			token.cached = false;
			return token;
		},

		error: function(e) {
			throw SyntaxError(e);
		}
	};

	var $symbol_table = {};

	function symbol(id) {
		var s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
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
		var s = symbol(id);
		s.value = value;
		s.nud = default_constant_nud;
		return s;
	}

	function prefix(bp, id, nud) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			var s = symbol(id);
			s.nbp = bp;
			s.nud = nud || default_prefix_nud;
		});
	}

	function infix(bp, id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			var s = symbol(id);
			s.lbp = bp;
			s.led = led || default_infix_led;
		});
	}

	function infixr(bp, id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			var s = symbol(id);
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
	symbol("(array)");

	symbol("(end)").nud = noop;
	symbol("(literal)").nud = noop;

	symbol("(name)").nud = function() {
		this.push(this.value);
	};

	infix(20, "?", function(left) {
		this.push(left, expression());
		next(":");
		this.push(expression());
	});

	infixr(30, ["&&", "||"]);
	infixr(40, ["===", "!==", "==", "!=", "<", "<=", ">", ">="]);

	infix(50, ["+", "-"]);
	infix(60, ["*", "/"]);

	prefix(70, ["+", "-", "!"]);

	prefix(70, "(", function() {
		var e = expression();
		next(")");
		return e;
	});

	prefix(70, "[", function() {
		var array = Object.create($symbol_table["(array)"]);
		array.value = [];

		if ($token.id !== "]") {
			for (; ;) {
				var e = expression();
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

	prefix(70, "{", function() {
		var args = this.push([]);

		if ($token.id !== "}") {
			for (; ;) {
				if ($token.id !== "(name)" && $token.id !== "(literal)") {
					this.error("Unexpected token " + $token.id);
				}

				var key = next().value;
				next(":");

				var o = expression();
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

	infix(80, ".", function(left) {
		if ($token.id !== "(name)") {
			this.error("Unexpected token " + $token.id);
		}

		this.push(left, next());
	});

	infix(80, "[", function(left) {
		this.push(left, expression());
		next("]");
	});

	infix(80, "(", function(left) {
		var args = Object.create($symbol_table["(array)"]);
		args.value = [];

		if (left.id === "." || left.id === "[") {
			this.push(left.a, left.b, args);
		}
		else {
			this.push(left, args);
		}

		if ($token.id !== ")") {
			for (; ;) {
				var e = expression();
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


	/// Tokenizer
	var re = /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)|((?:\d*\.\d+)|\d+)|('[^']*'|"[^"]*")|(===|!==|==|!=|<=|>=|&&|\|\||[-+*/!?:.,<>\[\]\(\){}])|(\s)|./g;

	var token_types = [
		"",
		"(name)",
		"(number)",
		"(string)",
		"(operator)",
		"(ws)",
		"(unknown)"
	];

	function tokenize(script, def) {
		var tokens = [];

		script.replace(re, function(value) {
			var type;
			var token;

			if (def) {
				var o = def[value];
				if (o && o.type === "macro") {
					var prev = tokens[tokens.length - 1];
					if (!prev || prev.value !== ".") {
						tokens = tokens.concat(tokenize(o.value, def));
						return value;
					}
				}

				if (o && o.type === "value") {
					token = Object.create($symbol_table["(literal)"]);
					token.value = o.value;
					tokens.push(token);
					return value;
				}
			}

			for (var i = 1; i < arguments.length; i++) {
				if (arguments[i]) {
					type = token_types[i];
					break;
				}
			}

			switch (type) {
				case "(name)":
					token = Object.create($symbol_table[value] || $symbol_table["(name)"]);
					token.value = "value" in token ? token.value : value;
					break;

				case "(number)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = +value;
					break;

				case "(string)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = value.slice(1, -1);
					break;

				case "(operator)":
					token = Object.create($symbol_table[value]);
					token.value = value;
					break;

				case "(unknown)":
					throw SyntaxError("Unexpected token " + value);
					break;
			}

			if (token) {
				tokens.push(token);
			}

			return value;
		});

		tokens.index = 0;
		return tokens;
	}


	/// Evaluate
	var evaluateRules = {};

	function evaluate(token) {
		if (!token.cached) {
			token.cache = evaluateRules[token.id][token.length].apply(token, token);
			token.cached = true;
		}

		return token.cache;
	}

	function evaluateRule(id, length, fn) {
		evaluateRules[id] = evaluateRules[id] || {};
		evaluateRules[id][length] = fn;
	}

	evaluateRule("(end)", 0, function() { return undefined; });
	evaluateRule("(literal)", 0, function() { return this.value; });

	evaluateRule("(array)", 0, function() {
		return this.value.map(evaluate);
	});

	evaluateRule("{", 1, function(a) {
		return a.reduce(function(object, o) {
			object[o.key] = evaluate(o);
			return object;
		}, {});
	});

	evaluateRule("+", 1, function(a) { return +evaluate(a); });
	evaluateRule("-", 1, function(a) { return -evaluate(a); });
	evaluateRule("!", 1, function(a) { return !evaluate(a); });

	evaluateRule("&&", 2, function(a, b) { return evaluate(a) && evaluate(b); });
	evaluateRule("||", 2, function(a, b) { return evaluate(a) || evaluate(b); });
	evaluateRule("===", 2, function(a, b) { return evaluate(a) === evaluate(b); });
	evaluateRule("!==", 2, function(a, b) { return evaluate(a) !== evaluate(b); });
	evaluateRule("==", 2, function(a, b) { return evaluate(a) == evaluate(b); });
	evaluateRule("!=", 2, function(a, b) { return evaluate(a) != evaluate(b); });
	evaluateRule("<", 2, function(a, b) { return evaluate(a) < evaluate(b); });
	evaluateRule("<=", 2, function(a, b) { return evaluate(a) <= evaluate(b); });
	evaluateRule(">", 2, function(a, b) { return evaluate(a) > evaluate(b); });
	evaluateRule(">=", 2, function(a, b) { return evaluate(a) >= evaluate(b); });

	evaluateRule("+", 2, function(a, b) { return evaluate(a) + evaluate(b); });
	evaluateRule("-", 2, function(a, b) { return evaluate(a) - evaluate(b); });
	evaluateRule("*", 2, function(a, b) { return evaluate(a) * evaluate(b); });
	evaluateRule("/", 2, function(a, b) { return evaluate(a) / evaluate(b); });

	evaluateRule("?", 3, function(a, b, c) { return evaluate(a) ? evaluate(b) : evaluate(c); });

	evaluateRule("(name)", 1, function(a) {
		this.setObjectProp(this.scope, a);
		return this.getObjectProp();
	});

	evaluateRule(".", 2, function(a, b) {
		this.setObjectProp(evaluate(a), b.value);
		return this.getObjectProp();
	});

	evaluateRule("[", 2, function(a, b) {
		this.setObjectProp(evaluate(a), evaluate(b));
		return this.getObjectProp();
	});

	evaluateRule("(", 2, function(a, b) {
		this.setObjectProp(this.scope, a.value);
		var fn = this.getObjectProp();
		return fn && fn.apply(this.object, evaluate(b));
	});

	evaluateRule("(", 3, function(a, b, c) {
		this.setObjectProp(evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
		var fn = this.getObjectProp();
		return fn && fn.apply(this.object, evaluate(c));
	});


	/// watch / unwatch
	var ARRAY_KEYS = ["push", "pop", "unshift", "shift", "splice", "reverse", "sort"];
	var DATE_KEYS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

	window.num_watchers = 0;
	window.watchers = [];

	function addWatchToken(tokens, token) {
		if (tokens.indexOf(token) === -1) {
			tokens.push(token);
			window.num_watchers++;
			window.watchers.push(token);
			//console.log(window.num_watchers);
			//console.log(token);
		}
	}

	function removeWatchToken(tokens, token) {
		if (!Array.isArray(tokens)) {
			return false;
		}

		var index = tokens.indexOf(token);
		if (index >= -1) {
			tokens.splice(index, 1);
			window.num_watchers--;
			window.watchers.splice(window.watchers.indexOf(token), 1);
			//console.log(window.num_watchers);
			//console.log(token);
		}

		return tokens.length === 0;
	}

	function notifyCallbacks(tokens) {

		var roots = [];
		foreach(tokens, function(token) {
			var root = token.makeDirty();
			if (roots.indexOf(root) === -1) {
				roots.push(root);
			}
		});

		foreach(roots, function(token) {
			$nextTick(function() { token.callback() });
		});
	}

	function makeObservable(value, token) {
		if (Array.isArray(value)) {
			addWatchToken(makeObservableArray(value), token);
		}

		else if (value instanceof Date) {
			addWatchToken(makeObservableDate(value), token);
		}
	}

	/// @TODO: callbacks Array를 WeakMap을 사용하는 방법으로 변경해보자.
	function makeObservableArray(object) {
		if (!object.__proto__.splice.$tokens) {
			var ObservableArray = Object.create(Array.prototype);
			foreach(ARRAY_KEYS, function(method) {
				ObservableArray[method] = function() {
					var result = Array.prototype[method].apply(this, arguments);
					notifyCallbacks(ObservableArray["splice"].$tokens);
					return result;
				};
			});

			Object.setPrototypeOf(object, ObservableArray);
			object.__proto__.splice.$tokens = [];
		}

		return object.__proto__.splice.$tokens;
	}

	function makeObservableDate(object) {
		if (!object.__proto__.setDate.$tokens) {
			var ObservableDate = Object.create(Date.prototype);
			foreach(DATE_KEYS, function(method) {
				ObservableDate[method] = function() {
					var result = Date.prototype[method].apply(this, arguments);
					notifyCallbacks(ObservableDate.setDate.$tokens);
					return result;
				};
			});

			Object.setPrototypeOf(object, ObservableDate);
			object.__proto__.setDate.$tokens = [];
		}

		return object.__proto__.setDate.$tokens;
	}


	function makeUnObservable(value, token) {
		if (Array.isArray(value)) {
			if (removeWatchToken(value.__proto__["splice"].$tokens, token)) {
				Object.setPrototypeOf(value, Array.prototype);
			}
		}

		else if (value instanceof Date) {
			if (removeWatchToken(value.__proto__["setDate"].$tokens, token)) {
				Object.setPrototypeOf(value, Date.prototype);
			}
		}
	}

	function watch(token) {
		var object = token.object;
		var prop = token.prop;

		if (!object || typeof object !== "object") {
			return;
		}

		var value = object[prop];
		makeObservable(value, token);

		/// Array length over -> return;
		if (Array.isArray(object) && (+prop >= object.length)) {
			return;
		}

		/// Object
		var desc = Object.getOwnPropertyDescriptor(object, prop);
		if (desc && (desc.configurable === false || desc.writable === false)) {
			return;
		}

		/// setter에 watcher를 등록한다.
		if (!desc || !desc.set || !desc.set.$tokens) {

			function setter(newValue) {
				if (Object.is(value, newValue)) {
					return;
				}

				foreach(setter.$tokens, function(token) {
					makeUnObservable(value, token);
				});

				value = newValue;
				makeObservable(value, token);
				notifyCallbacks(setter.$tokens);
			}

			setter.$tokens = [];

			desc = {
				enumerable: true,
				configurable: true,
				set: setter,
				get: function() { return value; }
			};

			Object.defineProperty(object, prop, desc);
		}

		addWatchToken(desc.set.$tokens, token);
	}

	function unwatch(token) {
		var object = token.object;
		var prop = token.prop;

		if (object === null || typeof object !== "object") {
			return;
		}

		var value = object[prop];
		makeUnObservable(value, token);

		var desc = Object.getOwnPropertyDescriptor(object, prop);
		if (removeWatchToken(desc && desc.set && desc.set.$tokens, token)) {
			delete object[prop];
			object[prop] = value;
		}
	}


	/// $parse
	function setScope(tokens, scope) {
		foreach(tokens, function(token) {
			token.scope = scope;
			token.cached = false;
		});
	}

	function $parse(script, def) {
		$tokens = tokenize(script, def);
		var tokens = $tokens.slice();
		next();
		var root = expression();

		/// eval
		var $expression = function(scope) {
			setScope(tokens, scope);
			return evaluate(root);
		};

		/// assign
		$expression.assign = function(scope, value) {
			setScope(tokens, scope);
			evaluate(root);

			if (!root.object || !root.prop) {
				return false;
			}

			root.object[root.prop] = value;
			return true;
		};

		/// watch
		$expression.watch = function(scope, callback, args, array, index) {
			array = array || [];
			index = index || 0;
			var isStarted = false;

			return {
				start: function() {
					if (isStarted) return;
					isStarted = true;

					setScope(tokens, scope);
					foreach(tokens, function(token) {
						token.setObjectProp = function(object, prop) {
							if (this.object === object && this.prop === prop) {
								return;
							}

							unwatch(this);

							this.object = object;
							this.prop = prop;

							watch(this);
						}
					});


					var callCount = 0;
					root.callback = function() {
						if (callCount > 0) {
//							console.log("circular!!");
							return;
						}

						var old_value = root.cache;
						var result = evaluate(root);

						var $args = new Array(array.length);
						for (var i = 0; i < array.length; i++) {
							if (index !== i) {
								$args[i] = $parse(array[i], def)(scope);
							}
						}
						$args[index] = result;
						$args = $args.concat(args);

						if (old_value !== result) {
							callCount++;
							callback.apply(null, $args);
							callCount--;
						}
					};

					root.callback();
				},

				stop: function() {
					if (!isStarted) return;
					isStarted = false;

					foreach(tokens, function(token) {
						unwatch(token);
					});
				}
			}
		};

		return $expression;
	}


	return $parse;
});


