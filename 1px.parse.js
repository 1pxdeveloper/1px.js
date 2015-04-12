$module("1px").define(["foreach", "$cache", "noop", function(foreach, $cache, noop) {

	var regex_string = /"[^"]*"|'[^']*'/g;

	function parse_expr(string, fn) {
		fn = fn || noop;
		while(string) {
			var index = string.indexOf("{");
			if (index === -1) {
				string && fn(string, false);
				return;
			}
			fn(string.substring(0, index), false);
			string = string.substring(index);

			var striped = string.replace(regex_string, function(a) {
				var str = "";
				var i = a.length;
				while(i--) str+= " ";
				return str;
			});

			var num_brace = index = 0;
			do {
				var ch = striped.charAt(index++);
				if (ch === "{") num_brace++;
				else if (ch === "}") num_brace--;
			} while(ch && num_brace > 0);

			fn(string.substring(1, index-1), true)
			string = string.substring(index);
		}
	}


	function $eval(script, scope) {
		if (!scope || !scope.length) {
			return;
		}

		var cache = $cache("eval"),
			thisObj = scope[scope.length-1],
			length = scope.length,
			hash = length + script,
			code = "",
			fn;

		try {
			if (cache[hash] === undefined) {
				for (var i = 0, len = length + 1; i < len; i++) {
					code += ("with(arguments["+i+"])");
				}
				code += ("{return("+script+");}");
				cache[hash] = new Function(code);
			}

			fn = cache[hash] || noop;
			return fn.apply(thisObj, scope.concat(scope.local || {}));

		} catch(e) {
			console.error(e.stack);
		}
	}

	function $parse(script, scope) {
		var result = "";
		parse_expr(script, function(text, isexpr) {
			result += isexpr ? $eval(text, scope) : text;
		});
		return result;
	}

	return {
		"$eval": $eval,
		"$parse": $parse,

		/// @FIXME...
		"parse_expr": parse_expr
	}
}]);

