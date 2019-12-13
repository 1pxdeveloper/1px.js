import {_} from "../../fp";

/// Utils
const {castArray, noop} = _;

/// Operator precedence
let bp = 1000;

function precedence(type, ...operators) {
	for (let operator of operators) {
		type[operator] = bp;
	}
	bp -= 10;
}

const PREFIX = precedence.PREFIX = Object.create(null);
const INFIX = precedence.INFIX = Object.create(null);

precedence(PREFIX, "(");
precedence(PREFIX, "#", "@");
precedence(INFIX, ".", "[", "(");
precedence(PREFIX, "!", "-", "+", "[", "{");
precedence(INFIX, "**");
precedence(INFIX, "*", "/", "%", "%%");
precedence(INFIX, "+", "-");
precedence(INFIX, "|");
precedence(INFIX, "<", ">", ">=", "in");
precedence(INFIX, "===", "!==", "==", "!=");
precedence(INFIX, "&&");
precedence(INFIX, "||");
precedence(INFIX, "?");
precedence(INFIX, "as");
precedence(INFIX, "=>");
precedence(INFIX, "=");
precedence(INFIX, "if");
precedence(INFIX, ";");


/// expression
let $tokens;
let $token;
let $script;

function next(id) {
	if (id && $token && $token.id !== id) {
		$token.error("Unexpected token: " + $token.id);
		return;
	}
	
	const t = $token;
	$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
	return t;
}

function expression(rbp = 0) {
	let t = $token;
	next();
	
	let left = t.nud() || t;
	while($token.lbp > rbp) {
		t = $token;
		next();
		left = t.led(left) || t;
	}
	
	return left;
}


/// Symbol
const $symbol_table = {};

const $symbol_prototype = {
	length: 0,
	
	lbp: 0,
	nbp: 0,
	
	error(err) { throw SyntaxError($script + " " + err) },
	
	nud() { throw SyntaxError($script + " Unexpected token: " + this.id) },
	
	led() { throw SyntaxError($script + " Missing Operator: " + this.id) },
	
	push() {
		let token;
		for (token of arguments) {
			this[this.length++] = token;
		}
		
		return token;
	},
	
	watch(object, prop) {}
};

function symbol(id) {
	const s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
	s.id = id;
	return s;
}

function nud_of_constant() {
	this.id = "(literal)";
}

function nud_of_prefix() {
	this.push(expression(this.nbp));
}

function led_of_infix(left) {
	this.push(left, expression(this.lbp));
}

function lef_of_infixr(left) {
	this.push(left, expression(this.lbp - 1));
}


///
function constant(id, value) {
	const s = symbol(id);
	s.value = value;
	s.nud = nud_of_constant;
	return s;
}

function prefix(id, nud) {
	for (id of castArray(id)) {
		const s = symbol(id);
		s.nbp = precedence.PREFIX[id];
		s.nud = nud || nud_of_prefix;
	}
}

function infix(id, led) {
	for (id of castArray(id)) {
		const s = symbol(id);
		s.lbp = precedence.INFIX[id];
		s.led = led || led_of_infix;
	}
}

function infixr(id, led) {
	for (id of castArray(id)) {
		const s = symbol(id);
		s.lbp = precedence.INFIX[id];
		s.led = led || lef_of_infixr;
	}
}


/// Define Symbols
symbol(":");
symbol(")");
symbol("]");
symbol("}");
symbol(",");
symbol("=>");

symbol("(end)").nud = noop;
symbol("(literal)").nud = noop;
symbol("(name)").nud = noop;
symbol("this").nud = noop;


/// Constants
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
constant("JSON", JSON);
constant("Infinity", Infinity);


/// Basic Operators
prefix(["+", "-", "!"]);
infix(["+", "-", "*", "/", "%", "%%"]);
infixr(["===", "!==", "==", "!=", "<", "<=", ">", ">=", "&&", "||", ";", "if"]);


/// @foo
prefix("@", function() {
	this.push(next("(name)"));
});

/// #foo
prefix("#", function() {
	this.push(next("(name)"));
});

/// foo.bar
infix(".", function(left) {
	this.push(left, next("(name)"));
});

/// foo[bar]
infix("[", function(left) {
	this.push(left, expression());
	next("]");
});

/// foo ? bar : baz
infix("?", function(left) {
	this.push(left, expression(), next(":") && expression());
});

/// [foo, bar, baz, ...]
prefix("[", function() {
	const args = this.push([]);
	
	if ($token.id !== "]") {
		do { args.push(expression()) }
		while($token.id === "," && next(","));
	}
	
	next("]");
});


/// {foo: bar, ...}
prefix("{", function() {
	const args = this.push([]);
	
	if ($token.id !== "}") {
		do {
			if ($token.id !== "(name)" && $token.id !== "(literal)") {
				throw SyntaxError("Unexpected token: " + $token.id);
			}
			
			let o = next();
			const key = o.value;
			
			if ($token.id === "," || $token.id === "}") {
				o.key = key;
				args.push(o);
				continue;
			}
			next(":");
			
			o = expression();
			o.key = key;
			args.push(o);
			
		} while($token.id === "," && next(","))
	}
	
	next("}");
});


/// foo(bar, ...)
/// foo.bar(baz, ...)
infix("(", function(left) {
	const args = this.push(left, []);
	
	if ($token.id !== ")") {
		do { args.push(expression()); }
		while($token.id === "," && next(","))
	}
	
	next(")");
});


/// (foo, ...) => bar
/// () => bar
/// (foo) => bar
/// (foo)
prefix("(", function() {
	
	let lookahead = $tokens[$tokens.index];
	let lookahead2 = $tokens[$tokens.index + 1];
	
	/// (foo, ...) => bar
	/// (foo) => bar
	if (lookahead.id === "," || (lookahead.id === ")" && lookahead2 && lookahead2.id === "=>")) {
		this.id = "=>";
		
		let args = this.push([]);
		do {
			args.push(next("(name)"));
		} while($token.id === "," && next(","));
		
		next(")");
		
		next("=>");
		
		this.push(expression());
		return;
	}
	
	/// (foo)
	const e = expression();
	next(")");
	return e;
});


/// foo as bar, baz
infix("as", function(left) {
	this.push(left, next("(name)"));
	
	if ($token.id === ",") {
		next(",");
		this.push(next("(name)"));
	}
	else {
		this.push({});
	}
});


/// foo => bar
infix("=>", function(left) {
	this.push([left], expression());
});


/// foo = bar
infixr("=", function(left) {
	if (left.id !== "." && left.id !== "[" && left.id !== "(name)") {
		left.error("Invalid left-hand side in assignment.");
	}
	
	this.push(left);
	this.push(expression(this.lbp - 1));
});


/// foo | bar: baz, ...
infix("|", function(left) {
	let args = this.push(left, next("(name)"), []);
	
	if ($token.id === ":") {
		next(":");
		
		do {
			args.push(expression());
		} while($token.id === "," && next(","))
	}
});


/// Tokenizer
const lex = [
	["(name)", /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)/],
	["(number)", /((?:\d*\.\d+)|\d+)/],
	["(string)", /('[^']*'|"[^"]*")/],
	["(operator)", /(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/%!#@?:;.,<>=\[\]\(\){}])/],
	["(ws)", /(\s)/],
	["(unknown)", /./]
];

const regex = new RegExp(lex.map(v => v[1].source).join("|"), "g");


function createTokenOfName(value) {
	const token = Object.create($symbol_table[value] || $symbol_table["(name)"]);
	token.value = "value" in token ? token.value : value;
	return token;
}

export function tokenize(script) {
	/// assert: typeof script === "string";
	
	const tokens = [];
	tokens.index = 0;
	
	script.replace(regex, function(value, ...args) {
		
		/// Parse Type
		const type = lex[args.findIndex(v => v)][0];
		
		/// Create Token
		switch (type) {
			case "(name)": {
				const token = createTokenOfName(value);
				tokens.push(token);
				break;
			}
			
			case "(number)": {
				const token = Object.create($symbol_table["(literal)"]);
				token.value = +value;
				tokens.push(token);
				break;
			}
			
			case "(string)": {
				const token = Object.create($symbol_table["(literal)"]);
				token.value = value.slice(1, -1);
				tokens.push(token);
				break;
			}
			
			case "(operator)": {
				const token = Object.create($symbol_table[value] || null);
				token.value = value;
				tokens.push(token);
				break;
			}
			
			case "(unknown)":
				throw SyntaxError("Unexpected token: " + value);
		}
		
		return value;
	});
	
	
	/// Make Parse Tree
	$tokens = tokens;
	$script = script;
	next();
	
	const root = expression();
	root.tokens = tokens;
	
	return root;
}