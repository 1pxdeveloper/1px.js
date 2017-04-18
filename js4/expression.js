////////////////
let $tokens;
let $token;

function noop() {}

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

	cached: false,
	callback: noop,

	nud() {
		this.error("Undefined.");
	},

	led() {
		this.error("Missing Operator.");
	},

	push() {
		foreach(arguments, function(token) {
			this[this.length++] = token;
			token.parent = this;
		}, this);

		return arguments[arguments.length - 1];
	},

	setObjectProp(object, prop) {
		this.object = object;
		this.prop = prop;
		return this.object && this.object[this.prop];
	},

	makeDirty() {
		let token = this;
		while (token.parent) {
			token.cached = false;
			token = token.parent;
		}

		token.cached = false;
		return token;
	},

	error(e) {
		throw SyntaxError(e);
	}
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
	let e = expression();
	next(")");
	return e;
});

prefix(70, "[", function() {
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

prefix(70, "{", function() {
	let args = this.push([]);

	if ($token.id !== "}") {
		for (; ;) {
			if ($token.id !== "(name)" && $token.id !== "(literal)") {
				this.error("Unexpected token " + $token.id);
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
	let args = Object.create($symbol_table["(array)"]);
	args.value = [];

	if (left.id === "." || left.id === "[") {
		this.push(left.a, left.b, args);
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


/// Tokenizer
let re = /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)|((?:\d*\.\d+)|\d+)|('[^']*'|"[^"]*")|(===|!==|==|!=|<=|>=|&&|\|\||[-+*/!?:.,<>\[\]\(\){}])|(\s)|./g;

let token_types = [
	"",
	"(name)",
	"(number)",
	"(string)",
	"(operator)",
	"(ws)",
	"(unknown)"
];

function tokenize(script, def) {
	let tokens = [];

	script.replace(re, function(value) {
		let type;
		let token;

		if (def) {
			let o = def[value];
			if (o && o.type === "macro") {
				let prev = tokens[tokens.length - 1];
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

		for (let i = 1; i < arguments.length; i++) {
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
let evaluateRules = {};

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

evaluateRule("(end)", 0, () => undefined);
evaluateRule("(literal)", 0, function() { return this.value; });
evaluateRule("(array)", 0, function() { return this.value.map(evaluate); });

evaluateRule("{", 1, function(a) {
	return a.reduce(function(object, o) {
		object[o.key] = evaluate(o);
		return object;
	}, {});
});

evaluateRule("+", 1, (a) => +evaluate(a));
evaluateRule("-", 1, (a) => -evaluate(a));
evaluateRule("!", 1, (a) => !evaluate(a));

evaluateRule("&&", 2, (a, b) => evaluate(a) && evaluate(b));
evaluateRule("||", 2, (a, b) => evaluate(a) || evaluate(b));
evaluateRule("===", 2, (a, b) => evaluate(a) === evaluate(b));
evaluateRule("!==", 2, (a, b) => evaluate(a) !== evaluate(b));
evaluateRule("==", 2, (a, b) => evaluate(a) == evaluate(b));
evaluateRule("!=", 2, (a, b) => evaluate(a) != evaluate(b));
evaluateRule("<", 2, (a, b) => evaluate(a) < evaluate(b));
evaluateRule("<=", 2, (a, b) => evaluate(a) <= evaluate(b));
evaluateRule(">", 2, (a, b) => evaluate(a) > evaluate(b));
evaluateRule(">=", 2, (a, b) => evaluate(a) >= evaluate(b));

evaluateRule("+", 2, (a, b) => evaluate(a) + evaluate(b));
evaluateRule("-", 2, (a, b) => evaluate(a) - evaluate(b));
evaluateRule("*", 2, (a, b) => evaluate(a) * evaluate(b));
evaluateRule("/", 2, (a, b) => evaluate(a) / evaluate(b));
evaluateRule("%", 2, (a, b) => evaluate(a) % evaluate(b));

evaluateRule("?", 3, (a, b, c) => evaluate(a) ? evaluate(b) : evaluate(c));

evaluateRule("(name)", 1, function(a) {

	console.log(this.local);

	if (a in this.local) {
		return this.setObjectProp(this.local, a);
	}

	return this.setObjectProp(this.scope, a);
});

evaluateRule(".", 2, function(a, b) {
	return this.setObjectProp(evaluate(a), b.value);
});

evaluateRule("[", 2, function(a, b) {
	return this.setObjectProp(evaluate(a), evaluate(b));
});

evaluateRule("(", 2, function(a, b) {
	let fn = this.setObjectProp(this.scope, a.value);
	return fn && fn.apply(this.object, evaluate(b));
});

evaluateRule("(", 3, function(a, b, c) {
	let fn = this.setObjectProp(evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
	return fn && fn.apply(this.object, evaluate(c));
});


function foreach(arr, fn, thisObj) {
	for (let i = 0, len = arr.length; i < len; i++) {
		fn.call(thisObj, arr[i], i);
	}
}


function setScope(tokens, scope, local) {
	tokens.forEach(function(token) {
		token.scope = scope;
		token.local = local || Object.create(null);
		token.cached = false;
	});
}

function $parse(script, def) {
	$tokens = tokenize(script);
	let tokens = $tokens.slice();


	next();
	let root = expression();

//	console.log(script, root);


	function $eval(context, local) {
		setScope(tokens, context, local);
		return evaluate(root);
	}

	$eval.watch$ = function(context, local) {

		setScope(tokens, context, local);

		return new Observable(function(observer) {
			function callback() {
				tokens.forEach(function(self) {
					if (self.subscription) {
						self.subscription.unsubscribe();
					}
				});

				let cache = root.cache;
				let value = evaluate(root);

				console.log("token.callback: ", script, cache, value);

				observer.next(value);
			}

			tokens.forEach(function(token) {
				token.setObjectProp = function(object, prop) {
					this.object = object;
					this.prop = prop;

					if (this.subscription) {
						this.subscription.unsubscribe();
					}

					this.subscription = watch$(object, prop).subscribe((value) => {
						this.makeDirty();

						if (nextTick.queue.indexOf(callback) === -1) {
							nextTick(callback);
						}
					});

					return this.object && this.object[this.prop];
				}
			});

			observer.next(evaluate(root));

			return function() {
				tokens.forEach(function(self) {
					if (self.subscription) {
						self.subscription.unsubscribe();
					}
				});
			}
		});
	};

	return $eval;
}

let nextTick = function() {

	let queue = [];
	let uuid = true;

	let i = 0;
	let index = 0;

	let observer = new MutationObserver(function() {
		console.log("nextTick", i++);

		let fn;
		while (fn = queue[index++]) {
			fn();
		}

		index = 0;
		queue.length = 0;
	});

	let textNode = document.createTextNode("");
	observer.observe(textNode, {characterData: true});

	function start() {
		uuid = !uuid;
		textNode.nodeValue = uuid;
	}

	function nextTick(fn) {
		if (queue.length === 0) {
			start();
		}

		queue.push(fn);

		if (queue.length > 1024) {
			throw new Error();
		}
	}

	nextTick.queue = queue;
	return nextTick;
}();
