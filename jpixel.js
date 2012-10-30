/*!
 * jPixel JavaScript Library v0.2.3 beta
 * http://1px.kr/
 *
 * Copyright 2012 1pxgardening
 * Released under the MIT license
 *
 * Date: 2012. 10. 26
 */ 

//"use strict";

/// --- ES5 Shim
(function() {
	Object.create = Object.create || function() {
	
	    function F(){};
	
		return function (o) {
		    if (arguments.length > 1) {
		        throw new Error('Object.create implementation only accepts the first parameter.');
		    }
	
		    F.prototype = o;
		    return new F();
		}
	}();
	

	Array.isArray = Array.isArray || function(a) {
		return Object.prototype.toString.call(a) === "[object Array]";
	};
	

	Array.prototype.indexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */ ) {
	    "use strict";
	
	    if (this == null) {
	        throw new TypeError();
	    }
	    var t = Object(this);
	    var len = t.length >>> 0;
	    if (len === 0) {
	        return -1;
	    }
	    var n = 0;
	    if (arguments.length > 1) {
	        n = Number(arguments[1]);
	        if (n != n) { // shortcut for verifying if it's NaN
	            n = 0;
	        } else if (n != 0 && n != Infinity && n != -Infinity) {
	            n = (n > 0 || -1) * Math.floor(Math.abs(n));
	        }
	    }
	    if (n >= len) {
	        return -1;
	    }
	    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	    for (; k < len; k++) {
	        if (k in t && t[k] === searchElement) {
	            return k;
	        }
	    }
	    return -1;
	}
	

	Function.prototype.bind = Function.prototype.bind || function (oThis) {
		if (typeof this !== "function") {
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}
		
		var aArgs = Array.prototype.slice.call(arguments, 1), 
		    fToBind = this, 
		    fNOP = function () {},
		    fBound = function () {
		      return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
		    };
		
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		
		return fBound;
	};
	

	Date.now = Date.now || function() { return +(new Date); };
	

	String.prototype.trim = String.prototype.trim || function () {
		return this.replace(/^\s+|\s+$/g,'');
	};
})();



/// --- sugar Array.prototype
(function() {

	this.has = function(obj) {
		return this.indexOf(obj) >= 0;
	}

	this.last = function() {
		return this.length == 0 ? undefined : this[this.length-1];
	}

	this.pluck = function(name) {
		var r = [];
		for (var i = 0; i < this.length; ++i) {
		    if (this[i] && this[i][name]) {
			    r.push(this[i][name]);
		    }
		}	
	
		return r;
	}

	this.search = function(func, thisObj) {
		thisObj = thisObj || this;

		for (var i = 0; i < this.length; ++i) {
		    if (func.call(thisObj, this[i], i) === true) {
		    	return this[i];
		    }
		}
	}
	
	this.removeObject = function(o) {
		var index = this.indexOf(o);
		if (index === -1) {
			return -1;
		}

		this.splice(index, 1);
		return index;
	}

	this.shuffle = function() {
		this.sort(function() {
			return parseInt(Math.random()*2) ? -1 : 1;
		});
	
		return this;
	},
	
	this.toggle = function(obj) {
		this.has(obj) ? this.removeObject(obj) : this.push(obj);
		return this;
	},
	
	this.unique = function(name) {
	    if (this.length <= 1) {
	    	return this.concat();
	    }
	    
	    var o = {}, i, l = this.length, r = [];
	    
	    if (name) {
		    for(i=0; i<l; i++) { o[this[i][name]] = this[i]; } 
		} else {
		    for(i=0; i<l; i++) { o[this[i]] = this[i]; } 	
		}
	    for(i in o) { r.push(o[i]); }
	
	    return r;
	}	
}).call(Array.prototype);



Object.isEqual = function(a, b) {
	/// String, Number, Boolean, null, undefined
	if (a === b) {
		return true;
	}

	/// null, false, undefined, 0
	if (!a && !b) {
		return a === b;
	}

	if (typeof a !== typeof b) {
		return false;
	}

	if (a.length !== b.length) {
		return false;
	}	

	/// Array
	if (Array.isArray(a)) {
		for(var i = 0; i < a.length; i++) {
			if (!Object.isEqual(a[i], b[i])) {
				return false;
			}
		}
		
		return true;
	}

	/// Function
	if (typeof a === "function") {
		if (a.name !== b.name) return false;
		return true;
	}


	/// Date
	if (!isNaN(+a) && !isNaN(+b)) {
		return +a === +b;
	}


	/// Object
	for (var i in a) {
		if (!Object.isEqual(a[i], b[i])) {
			return false;
		}
	}

	/// FIXME: ... 위에서 검사핬던 property는 중복 체크 하므로 비효율적!!
	for (var i in b) {
		if (!Object.isEqual(a[i], b[i])) {
			return false;
		}
	}

	return true;
}





/// @FIXME: .. --- Function
Function.noop = function(){};


/// @FIXME: .. --- Function
Function.prototype.$new = function() {

	var reg_args = /\((.*?)\)/g;
	var reg_split = /\s?,\s?/;
	
	var createController = function(func, self) {
		self = self || {};
		var args = [self];
		var source = Function.prototype.toString.call(func);	

		reg_args.lastIndex = 0;
		var controllers = reg_args.exec(source)[1].split(reg_split).slice(1);		
		
		$.each(controllers, function(index, controller) {
			var c = window[controller]; /// @FIXME ...
	
			if (!c) { throw new Error(controller + " is not defined."); }
			if (typeof c !== "function") { throw new Error(controller + " is not function!"); }

			args.push(createController(c, self).func);
		});
		
		return {func: func.apply(self, args), args: args};
	};


	return function(self /*, args... */ ) {
		self = self || {};
		var f = createController(this, self);
		
		$.extend.apply(window, f.args);
		$.extend(self, f.func);

		self.init && self.init.apply(self, Array.prototype.slice.call(arguments, 1));		
		return self;
	};
}();


/// @FIXME: 왜 콜이 되는 거지? 호출을 하는 사람도 없는데??
Function.curry = function(fn /* ... */) {
	if (typeof fn !== "function") {
		return;
	}
	
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
		return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
    }
};





/// @FIXME!!! module 
(function() {
	
	var modules = {};
	var sources = {};
	
	var require = function(name) {
		return modules[name] || (modules[name] = sources[name] && sources[name]());
	}
	
	var define = function(name, func) {
		sources[name] = func;
	}	
	
	window.__require = require;
	window.__define = define;

}());





/// --- DOM-READY: COMPILE
(function() {

	var style = document.createElement("style");
	var cssText = "html,body{visibility: hidden !important;}";
	style.styleSheet ? (style.styleSheet.cssText = cssText) : style.innerHTML = cssText;
	document.getElementsByTagName("head")[0].appendChild(style);
	
	$(function() {
	
		// IE HTML5 - @TODO: 모듈화 하자!!
		(function() {
			var div = document.createElement("div");
			div.innerHTML = "<xyz></xyz>";
	
			var supportsUnknownElements = (div.childNodes.length === 1);	
			if (supportsUnknownElements) {
				return;
			}
			
			var c = document.getElementsByTagName("*");
			for(var i = 0; i < c.length; i++) {
				var el = c.item(i);
				if (el.nodeName.charAt(0) == "/") {
					document.createElement(el.nodeName.slice(1));
				}
			}
	
			document.body.innerHTML = document.body.innerHTML;
		}());
	
	
		var $compile = __require("compile");
		document.$scope = window.ViewController ? window.ViewController.$new() : {};
		document.update = $compile(document);
		document.update();
	
		style.parentNode.removeChild(style);
	});

}());








/// -- Start Framework!!!!
__define("eval", function() {

	var func = {};

	return function(script, scope, thisObj) {
		switch(script) {
			case "true": return true;
			case "false": return false;
			case "null": return null;
			case "undefined": return undefined;
			case "0": return 0;
			case "": return "";
		}
		
		if (!Array.isArray(scope)) {
			return;
		}
		
		thisObj = thisObj || scope.thisObj;
		var length = scope.length;
		var hash = length + script;

		try {
			if (!(hash in func)) {
				var code = "";
				for (var i = 0; i < length; i++) {
					code += ("with(arguments["+i+"])");
				}
				code += ("{return("+script+");}");
				func[hash] = new Function(code);		
			}

			return func[hash].apply(thisObj, scope);

		} catch(error) {
//			error.$stack = error.stack.split(/\n/);
			console.log(error, error.message, script);
			return undefined;
		}
	}
});




__define("parse", function() {

	var $parse = function(string, scope, thisObj) {
		if (typeof string !== "string" || string.length === 0) {
			return "";
		}
		
		thisObj = thisObj || scope.thisObj;
		
		var result = $parse.expr(string, function(isExpr, text) {
			if (!isExpr) {
				return text;
			}
			
			var $eval = __require("eval");
			var script = text.substring(1, text.length-1);
			var result = $eval(script, scope, thisObj);
	
			return (result === undefined || result === null) ? "" : result;
		});
		
		return result.length ? result.join("") : string;
	};
	
	$parse.REGEXP_EXPRESSION = /{[^{}]+}/g;
	
	$parse.expr = function(script, func) {
	
		func = func || Function.noop;
		var lastIndex = 0;
		var result = [];
		
		script.replace($parse.REGEXP_EXPRESSION, function(expr, index) {
	
			var str = script.substring(lastIndex, index);
			lastIndex = index + expr.length;
		
	//		if (nodeValue.charAt(index-1) == "!") {
	//			console.log(text);
	//			return text;
	//		}
			
			if (str.length !== 0) {
				result.push(func(false, str, index));
			}
	
			result.push(func(true, expr, index));
			
			return expr;
		});
	
	
		if (lastIndex === 0) {		
			return result;
		}
		
		if (lastIndex !== script.length) {
			var str = script.substring(lastIndex);
			result.push(func(false, str, lastIndex));
		}
		
		return result;
	};

	return $parse;
});



/// $compile
__define("compile", function() {

	var ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = 2;
	var TEXT_NODE = 3;
	
	/// @TODO: Config에서 추가 할수 있도록 수정할 것!
	var booleanAttrs = {"checked":1, "disabled":1, "autoplay":1, "async":1, "autofocus":1, "controls":1, "default":1, "defer":1, "formnovalidate":1, "hidden":1, "ismap":1, "itemscope":1, "loop":1, "multiple":1, "novalidate":1, "open":1, "pubdate":1, "readonly":1, "required":1, "reversed":1, "scoped":1, "seamless":1, "selected":1};


	var Observer = {
		init: function() {
			this.first = {};
			this.last = this.first;

			return this;
		},
		
		create: function() {
			var o = {};
			o.args = Array.prototype.slice.call(arguments);
			o.func = o.args.pop();

			this.last = this.last.next = o;
			return o;
		},
		
		update: function() {
			var prev = this.first;

			for(var it = this.first.next; it; it = it.next) {
				if (it.func.apply(it, it.args) === false) {
					prev.next = it.next;
				}
				
				prev = it;
			}
		}
	}


	/// node.attributes CROSS-BROWSE for IE
	var attributesOf = function() {
		if (document.createElement("div").attributes.length === 0) {
			return function(el) { return Array.prototype.slice.call(el.attributes); }
		}
	
		var REGEXP_STRING = /"(?:[^"]|\\.)*"|'(?:[^']|\\.)*'/g

		return function(el) {
			var div = document.createElement("div");
			div.appendChild(el.cloneNode(false));
			
			var attrs = div.innerHTML.replace(REGEXP_STRING, "");
			attrs = attrs.split(/\s+/g).slice(1);
			
			var result = [];
			$.each(attrs, function(index, attr) {
				var attrNode = el.getAttributeNode(attr.split("=", 1)[0]);
				attrNode && result.push(attrNode);
			});
			
			return result;
		}
	}();


	/// --- $compile
	var $compile = function(el) {
		var stack = [el];
		var $observer = Object.create(Observer).init();

		while(stack.length) {
			var i = 0;
			var el = stack.pop();
			var func = $compile[el.nodeType] || Function.noop;

			if (func(el, $observer) === false) {
				continue;
			}

			i = el.childNodes && el.childNodes.length || 0;
			while(i--) {
				stack.push(el.childNodes.item(i));
			}
		}

		return function() { $observer.update(); }
	}


	// ELEMENT NODE
	$compile[ELEMENT_NODE] = function(node, $observer) {
		if (node.nodeName === "SCRIPT" || node.nodeName === "HEAD" || node.nodeName === "STYLE") {
			return false;
		}
		
		if (node.nodeName === "TEMPLATE") {
			Binding.templates[node.id] = node;
			node.parentNode.removeChild(node);			
			return false;
		}
		
		if (node.hasTemplate) {
			return;
		}
		
		var attributes = attributesOf(node);
		
		var result = true;
		for (var i = 0; i < attributes.length; i++) {
			if ($compile[2](attributes[i], $observer) === false) {
				result = false;
			}
		}
		
		return result;
	}
	

	// ATTR NODE
	$compile[ATTRIBUTE_NODE] = function(node, $observer) {
		var $parse = __require("parse");
		var el = node.ownerElement;
		var nodeName = node.nodeName;
		var value = node.nodeValue || "";
		var hasExpression = value.search($parse.REGEXP_EXPRESSION) >= 0;
		
	
		// Handler - Custom
		var handler = __require("@"+nodeName);

		// Handler - Event
		if (!handler && ("on"+nodeName) in document) {
			handler = __require("#event");
		}

		// Handler - Boolean Attrs
		if (!handler && nodeName in booleanAttrs) {
			handler = __require("#boolean");
		}
		
		// Handler - {expression}
		if (!handler) {
			hasExpression && $observer.create(node, value, el, Binding.nodeValue);
			return;
		}
		
	
		// prepare Binding
		var binding = {};
		binding.$observer = $observer;
		binding.el = el;
		binding.$el = $(el);
		binding.attr = nodeName;
		binding.script = value;
		binding.hasExpression = hasExpression;
		
	
		// @TODO: 바인딩 중복 제거 기능 추가 할것!
	//			el.$bindings = el.$bindings || {};
	//			el.$bindings[attr] = binding;
		
		
		// init
		if (handler.init) {
			if (handler.init.call(binding, binding, nodeName, binding.script) === false) {
				return false;
			}
		}
		
		// update
		if (handler.update) {
			$observer.create(binding, nodeName, binding.script, handler, Binding.execute);
		}

		// next : @FIXME: 이름을 분명히 할것!
		if (handler.next) {
			$observer.create(binding, nodeName, binding.script, handler.next);
		}
	}
	

	// TEXT NODE
	$compile[3] = function(node, $observer) {
		var $parse = __require("parse");

		var nodeValue = String(node.nodeValue);
	
		var result = $parse.expr(nodeValue, function(isExpr, text, index) {
			var textNode = document.createTextNode(text);
			node.parentNode.insertBefore(textNode, node);
			isExpr && $observer.create(textNode, text, node.parentNode, Binding.nodeValue);	
		});
		
		if (result.length) {		
			node.parentNode.removeChild(node);
		}
		
		return false;
	}


	return $compile;
});





///

/// --- @FIXME: Binding 
var Binding = {};

Binding.findScope = function(el) {
	var scope = [];
	var el = el;

	for(;;) {
		el.$local && scope.unshift(el.$local);
		el.$scope && scope.unshift(el.$scope);
		scope.thisObj = scope.thisObj || el.$scope;

		if (!el || !el.parentNode) {
			break;
		}

		el = el.parentNode;
	}

	return el === document ? scope : null;
}


Binding.nodeValue = function(node, script, el) {
	var self = this;

	var scope = Binding.findScope(el);
	if (!scope) {
		return false;
	}

	var $parse = __require("parse");
	var data = $parse(script, scope);
	if (data === null || data === undefined) {
		data = "";			
	}

	data = data + "";
	
	if (self.value !== data) {
		self.value = node.nodeValue = data;
	}
}


Binding.execute = function(self, attr, value, handler) {
	var $scope = Binding.findScope(self.scopeElement || self.el);
	if (!$scope) {
		return false;
	}

	handler.value = handler.value || Binding.values[handler.valueType];
	var $value = handler.value ? handler.value.call(self, self, self.script, $scope) : value;


	// 값이 변화가 없으면 SKIP
	if (self.hasOwnProperty("value") && Object.isEqual(self.value, $value)) {
		return;
	}		
	
	// Call Update
	self.value = $value;

	var result = handler.update.call(self, self, $value, $scope);

	// 표현식이 없고 값 변화 없으면 상수이므로 Observer 취소!
	if (!self.hasExpression && !handler.value) {
		return false;
	}

	return result;	
}



Binding.values = {};

Binding.values.expr = function(self, script, $scope) {
	var $eval = __require("eval");
	return $eval(script, $scope);
}

Binding.values.string = function(self, script, $scope) {
		var $parse = __require("parse");
	return $parse(script, $scope) || "";
}

Binding.values.parent = function(self, script, $scope) {
	var $eval = __require("eval");
	self.el.$local && $scope.push(self.el.$local);
	return $eval(script, $scope);
}

Binding.templates = {};




	
/// @event
__define("#event", function() {
	return {
		init: function(self, attr, value) {
			
			self.$el.bind(attr, function(e) {
				if (self.$el.hasClass("disabled") || self.$el.attr("disabled")) {
					return;
				}
	
				window.$event = e;
	
				var $scope = Binding.findScope(self.el);
				var $eval = __require("eval");

				if ($eval(value, $scope) === false) {
//					e.stopPropagation();			
					e.preventDefault();			
				}
	
				window.$event = undefined;			
				document.update();
			});
		}		
	}
});




/// @boolean attribute
__define("#boolean", function() {
	return {
		init: function(self, attr, value) {
			if (value === "" || value === "true") {
				self.$el.addClass(attr);
				return false;
			}
		},
		
		valueType: "expr",

		update: function(self, value, $scope) {
			var attr = self.attr;
			var bool = true;
	
			// @TODO: string값이 필요한지 확인 해보고 필요 없으면 지울 것!
			switch(value) {
				case "null":
				case "false":
				case "0":
					bool = false;
					break;

				default:
					if (!value) {
						bool = false;
					}
			}
			
			bool ? self.$el.attr(attr, attr) : self.$el.removeAttr(attr);
			bool ? self.$el.addClass(attr) : self.$el.removeClass(attr);
		}
	}
});



/// repeat
__define("@repeat", function() {

	var REGEXP_REPEAT = /([^\s]+)\sas\s([^,\s]+)(?:\s?,\s?(.+))?/;
	
	return {
		init: function(self, attr, value) {
			var parse = value.match(REGEXP_REPEAT);
			self.script = parse && $.trim(parse[1]);
			self.row = parse && $.trim(parse[2]);
			self.index = parse && $.trim(parse[3]);

			/// @TODO: Syntax Error 처리~
			
			self.el.removeAttribute(attr);
			self.repeatNode = self.el.cloneNode(true);
			self.placeHolder = document.createTextNode("");
			self.el.parentNode.insertBefore(self.placeHolder, self.el);
			self.el.parentNode.removeChild(self.el);

			self.el = self.placeHolder;
			self.$el = $(self.el);
			self.scopeElement = self.el.parentNode;
			self.container = [];			
		},
		
		value: function(self, script, $scope) {
			self.el.$local && $scope.push(self.el.$local);
			var $eval = __require("eval");
			var r = $eval(script, $scope);
			return r && Array.prototype.slice.call(r);
		},

		update: function(self, value, $scope) {
			if (!value) {
				return;
			}
			
			var pool = [];
			var reorders = [];
			var src = Array.prototype.slice.call(value);
			var $compile = __require("compile");

			
			// reorder
			$.each(self.container, function(index, el) {
				var index = src.indexOf(el.data);

				if (index >= 0) {
					reorders[index] = el;
					src[index] = NaN;
				}
				else {
					pool.push(el);
				}
			});			


			// render
			self.container = [];
			
			$.each(value, function(index, row) {
				var repeatNode = reorders[index] || pool.shift() || self.repeatNode.cloneNode(true);
				repeatNode.data = row;
				repeatNode.$local = {};
				self.row && (repeatNode.$local[self.row] = row);
				self.index && (repeatNode.$local[self.index] = index);
				self.placeHolder.parentNode.insertBefore(repeatNode, self.placeHolder);
				self.container.push(repeatNode);

				repeatNode.update = repeatNode.update || $compile(repeatNode);
			});
			
			
			// 사용안하는 Node 제거			
			while(pool.length) {
				var removed = pool.pop();
				removed.parentNode.removeChild(removed);
				removed = null;
			}
		},
		
		next: function(self) {
			var $scope = Binding.findScope(self.scopeElement || self.el);
			if (!$scope) {
				return false;
			}

			$.each(self.container, function(index, el) {
				el.update && el.update();
			});		
		}		
	}
});



/// template
__define("@template", function() {
	return {
		init: function(self, attr, value) {
			self.el.innerHTML = "";
			self.el.hasTemplate = true;
			self.scopeElement = self.el.parentNode;
		},

		value: function(self, script, $scope) {
			self.el.$local && $scope.push(self.el.$local);
			var $parse = __require("parse");
			return $parse(script, $scope);
		},

		update: function(self, value) {
			var template = Binding.templates[value];
			if (!template) {
				return;
			}
			
			var $compile = __require("compile");
			self.el.innerHTML = template.innerHTML;
			self.update = $compile(self.el);
		},
		
		next: function(self, attr, value) {
			var $scope = Binding.findScope(self.scopeElement || self.el);
			if (!$scope) {
				return false;
			}

			self.update && self.update();
		}		
	}
});



/// with
/// @TODO: app, repeat, with, template 순서 상관없이 렌더링 되도록 수정 필!
__define("@with", function() {
	return {
		init: function(self, attr, value) {
			self.scopeElement = self.el.parentNode;

			/// @TODO: self.el.$scope is not Array or Object or Function -> Type Error
		},

		value: function(self, script, $scope) {
			self.el.$local && $scope.push(self.el.$local);
			var $eval = __require("eval");
			return $eval(script, $scope);
		},
		
		update: function(self, value, $scope) {
			self.el.$scope = value;
		}
	}
});



/// name
__define("@name", function() {

	function getFormValueOf(el) {
		var name = el.name;
		var type = (el.type || "text").toLowerCase();
		var val;
		
		if (type === "checkbox" || type === "radio") {
			var form = $(el).closest("form").get(0);
			var elements = form ? form.elements[name] : document.getElementsByName(name);
			var values = [];
			
			$.each(elements, function(index, element) {
				if (element.type != type) {
					return;
				}
			
				if (type === "radio" && element.checked) {
					values.push(element.value);
				}
				
				else if (type === "checkbox" && element.getAttribute("value")) {
					element.checked && values.push(element.getAttribute("value"));
				}
	
				else if (type === "checkbox" && !element.getAttribute("value")) {
					values.push(element.checked ? true : false);
				}
	
			});
			
			val = values.length <= 1 ? values[0] : values;
		}
		else {
			val = el.value;
		}
		
		return val;
	}



	return {
		init: function(self, attr, value) {
			self.$el.bind("keydown change", function(e) {
				var $scope = Binding.findScope(self.scopeElement || self.el);
				if (!$scope) {
					self.$el.unbind();
					return false;
				}

				setTimeout(function() {
					var $parse = __require("parse");
					var name = $parse(value, $scope);
					var val = getFormValueOf(self.el);

					if ($scope.thisObj[name] === val) {
						return false;
					}
					
					self.value = $scope.thisObj[name] = val;
					document.update();
				},0);
			});
		},
		
		value: function(self, value, $scope) {
			var $parse = __require("parse");
			var value = $parse(value, $scope);
			return $scope.thisObj[value];
		},
		
		update: function(self, value, $scope) {
			if (!self.el.type) {
				return false;
			}

			var $parse = __require("parse");
			var val = $parse(self.$el.val(), $scope);
			var type = (self.el.type || "text").toLowerCase();

			if (type === "checkbox" && Array.isArray(value)) {
				self.el.checked = value.has(val);
				return;
			}
						
			if (type === "checkbox" || type === "radio") {	
				val = self.el.getAttribute("value") || true;
				self.el.checked = (value == val);
				return;
			}

			/// SELECT
			if (self.el.nodeName === "SELECT") {
				setTimeout(function() {
					value !== val && self.$el.val(value);		
				},0);
				
				return;
			}

			/// TEXT
			value !== val && self.$el.val(value);			
		}
	}
});



/// img-src
__define("@img-src", function() {
	return {
		valueType: "string",

		update: function(self, value) {
			self.el.src = "";
			
			var img = new Image();
			img.onload = function() {
				self.el.src = img.src;
			}
			img.src = value;
		}
	}
});


/// visible
__define("@visible", function() {
	return {
		valueType: "expr",

		update: function(self, value) {
			value ? self.$el.show() : self.$el.hide();
		}
	}
});


/// hidden
__define("@hidden", function() {
	return {
		valueType: "expr",

		update: function(self, value) {
			value ? self.$el.hide() : self.$el.show();
		}
	}
});



/// fn -- JQuery Plugin
__define("@fn", function() {
	return {
		update: function(self, value) {
			setTimeout(function() {
				var $eval = __require("eval");
				$eval(value, [self.$el]);
			},0);
			
			return false;
		}
	}
});


/// @css -- IE에서 style 속성 안 먹음
__define("@css", function() {
	return {
		valueType: "string",
		
		update: function(self, value) {
			self.el.cssText += value;
		}
	}
});



/// @outlet
__define("@outlet", function() {
	return {
		update: function(self, value, $scope) {
			$scope.thisObj[value] = self.el;
		}
	}
});







window.$$ = function(url, params, func) {
	var result;
	var params = params || {};
	var func = func || function(){};
	
	$.ajax({
		"async": false,
		"type": "POST",
		"url": "/admin/api/"+url,
		"data": params,
		"success": function(data) {
			result = $.parseJSON(data);
			func(result);
		}
	});
	
	return result;
}


window.$$.background = function(url, params, func) {
	params = params || {};
	func = func || function(){};
	
	$.ajax({
		"async": true,
		"type": "POST",
		"url": "/admin/api/"+url,
		"data": params,
		"success": function(data) {
			func(data);
		}
	});
}


window.$setTimeout = function(func, delay) {
	func = func || function(){};
	delay = delay || 0;
		
	setTimeout.call(this, function() {
		if (func() !== false) {
			document.update && document.update();
		}
	}, delay);
}


window.$benchmark = function() {
	
	var loop = 1;
	var func = Function.noop;
	
	if (arguments.length == 2) {
		loop = arguments[0];
		func = arguments[1];
	}

	if (arguments.length == 1) {
		func = arguments[0];		
	}
	
	func = func || Function.noop;
	var t = new Date();
	while(loop--) {
		func();
	}

	console.log((new Date() - t) / 1000);
}


window.$import = function() {

	var imports = {};
	var head = document.getElementsByTagName("head")[0];
	
	return function(src) {
		if (src in imports) {
			return;
		}
		
		imports[src] = src;
		var script = document.createElement("script");
		script.src = src;
		head.appendChild(script);
	}
}();


window.number_format = function(number, decimals, dec_point, thousands_sep) {
	
	// Strip all characters but numerical ones.
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
	prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
	sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
	dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
	s = '',
	toFixedFix = function (n, prec) {
		var k = Math.pow(10, prec);
		return '' + Math.round(n * k) / k;
	};

	// Fix for IE parseFloat(0.55).toFixed(0) = 0;
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}

	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	
	return s.join(dec);
}










