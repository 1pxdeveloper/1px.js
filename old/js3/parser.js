var Parser = (function() {

	function noop() {}

	function foreach(collection, fn) {
		for (var i = 0; i < collection.length; i++) {
			fn(collection[i], i);
		}
	}

	function createLex() {
		var types = [];
		var re = [];

		for (var i = 0; i < arguments.length; i += 2) {
			types.push(arguments[i]);
			re.push(arguments[i + 1].source);
		}

		re = new RegExp("(" + re.join(")|(") + ")", "g");
		re.types = types;
		return re;
	}

//
	var lex = createLex(
		"(nl)", /\n/,
		"(ws)", /\s/,
		"(name)", /[_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*/,
		"(comment)", /\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//,
		"(comment)", /\/\/[^\n]*\n/,
		"(number)", /0[bB][01]+|0[oO][0-8]+|0[xX][0-9a-fA-F]+/,
		"(number)", /(?:(?:\d*\.\d+)|\d+)(?:[eE][-+]?\d+)?/,
		"(string)", /''|'(?:\\'|[^'])*'/,
		"(string)", /""|"(?:\\"|[^"])*"/,
		"(operator)", />>>=|>>>|\*\*=|\.\.\.|>>=|<<=|===|!==|&=|\*\*|=>|\^=|<=|>=|==|!=|\|=|\/=|%=|\*=|‐=|\+=|\+\+|--|<<|>>|\|\||&&|\+|\||!|~|&|\}|\?|:|=|%|\*|-|\^|>|<|\,|;|\.|\]|\[|\)|\(|\/|\{|\\/,
		"(unknown)", /./
	);


	function tokenize(script) {
		var tokens = [];
		var lineNo = 0;
		var a;

		lex.lastIndex = 0;
		while ((a = lex.exec(script))) {
			var value = a[0];
			var args = Array.prototype.slice.call(a, 1);
			var type = lex.types[args.indexOf(value)];
			var index = a.index;
			var token;

			switch (type) {
				case "(nl)":
					lineNo++;

				case "(ws)":
				case "(comment)":
					continue;

				case "(name)":
					token = $symbol_table.hasOwnProperty(value) ? $symbol_table[value] : $symbol_table["(name)"];
					break;

				case "(operator)":
					token = symbol(value);
					break;

				case "(number)":
				case "(string)":
				case "(regexp)":
					token = $symbol_table["(literal)"];
					break;
			}

			if (!token) {
				console.log(tokens);
				throw new SyntaxError("not defined. " + value + " " + type);
			}

			token = Object.create(token);
			token.type = type;
			token.value = value;
			token.info = {
				script: script,
				lineNo: lineNo,
				index: index
			}

			tokens.push(token);
		}

		tokens.index = 0;
		return tokens;
	}

///
	var $tokens;
	var $token;

	function next(id) {
		if ($token) {
			if (id && $token.id !== id) {
				console.log($token, id);
				$token.error("Unexpected token: " + $token.id + " expected: " + id);
				return;
			}
		}

		var t = $token;
		$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
		return t;
	}

	function omit(id) {
		if (id && $token && $token.id === id) {
			next();
		}
	}

	function expression(rbp) {
		rbp = rbp || 0;

		var t = $token;
		next();

		var left = t.nud();
		left = left !== undefined ? left : t;

		while (rbp < $token.lbp) {
			t = $token;
			next();
			left = t.led(left);
			left = left !== undefined ? left : t;
		}

		return left;
	}

	function block() {
		return next("{").std();
	}

	function statement() {
		var n = $token, v;

		if (n.std) {
			next();
			v = n.std();
			v = v !== undefined ? v : n;
		}
		else {
			v = expression(0);
		}

		return v;
	}

	function statements() {
		var ret = [], s;

		while ($token.id !== "(end)") {
			if ($token.id === "}" || $token.id === "case" || $token.id === "default") {
				break;
			}

			s = statement();
			if (s) {
				ret.push(s);
			}
		}

		return ret;
	}


	/// Symbol
	var $symbol_prototype = {
		lbp: 0,
		nbp: 0,
		length: 0,

		nud: function() {
			this.error("Undefined. " + this.value);
		},

		led: function() {
			this.error("Missing Operator. " + this.id);
		},

		push: function(token) {
			this[this.length++] = token;
//			token.parent = this;
			return token;
		},

		error: function(e) {
			var script = this.info.script;
			var index = this.info.index;
			var value = this.value;
			var lineNo = this.info.lineNo;

			var line = script.slice(script.lastIndexOf("\n", index) + 1, script.indexOf("\n", index));
			var offset = script.slice(script.lastIndexOf("\n", index) + 1, index);
			var r = offset.replace(/\S/g, " ");
			for (i = 0; i < value.length; i++) {
				r += "^";
			}

			console.error(line + " # at :" + lineNo + "\n" + r);
			throw new SyntaxError(e);
		}
	};

	var $symbol_table = {};

	function symbol(id) {
		var s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
		s.id = id;
		return s;
	}

	function constant_nud() {
		this.id = "(literal)";
	}

	function prefix_nud() {
		this.push(expression(this.nbp));
	}

	function infix_led(left) {
		this.push(left);
		this.push(expression(this.lbp));
	}

	function infixr_led(left) {
		this.push(left);
		this.push(expression(this.lbp - 0.1));
	}

	function assginment_led(left) {
		if (left.id !== "(name)" && left.id !== "." && left.id !== "[") {
			left.error("Invalid left-hand side in assignment.");
		}

		infixr_led.call(this, left);
		this.assignment = true;
	}

	function constant(id, value) {
		value = arguments.length === 1 ? id : value;
		var s = symbol(id);
		s.value = value;
		s.nud = constant_nud;
	}

	function prefix(bp, id, nud) {
		id = Array.isArray(id) ? id : [id];
		foreach(id, function(id) {
			var s = symbol(id);
			s.nbp = bp;
			s.nud = nud || prefix_nud;
		});
	}

	function infix(bp, id, led) {
		id = Array.isArray(id) ? id : [id];
		foreach(id, function(id) {
			var s = symbol(id);
			s.lbp = bp;
			s.led = led || infix_led;
		});
	}

	function infixr(bp, id, led) {
		id = Array.isArray(id) ? id : [id];
		foreach(id, function(id) {
			var s = symbol(id);
			s.lbp = bp;
			s.led = led || infixr_led;
		});
	}

	function assginment(bp, id) {
		infixr(bp, id, assginment_led);
	}

	function stmt(s, f) {
		var x = symbol(s);
		x.std = f || noop;
		return x;
	}

	return {
		defineLex: function() {
			lex = createLex.apply(this, arguments);
		},

		define: function(fn) {
			return fn(symbol, constant, prefix, infix, infixr, assginment, next, $token, expression, tokenize);
		}
	}

});

