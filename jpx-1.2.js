/*!
 * jpx JavaScript Library v1.2.0
 * http://1px.kr/
 *
 * Copyright 2013 1pxgardening
 * Released under the MIT license
 */ 


"use strict";

/// IE CONSOLE ERROR
if (typeof console == "undefined") { this.console = {log: function() {}}; }


/// --- sugar Array.prototype
;(function() {

	this.empty = function() {
		this.splice(0, this.length);
		this.length = 0;
		return this;
	}
	
	this.isEmpty = function() {
		for (var i = 0; i < this.length; ++i) {
		    if (this[i] != null && this[i] != undefined) {
				return false;
		    }
		}
	
		return true;
	}

	this.has = function(obj) {
		if (this.length === 0) return false;
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
	
	this.max = function(prop) {
		var result = Number.NEGATIVE_INFINITY;

		for (var i = 0; i < this.length; ++i) {		  	
			var value = this[i];
			if (prop && value.hasOwnProperty(prop)) {
				value = value[prop];
			} else {
				continue;
			}
			
			value = +value;
			if (isNaN(value)) {
				continue;
			}

			result = Math.max(result, value);
		}	
		
		return result;
	}

	this.min = function(prop) {
		var result = Number.POSITIVE_INFINITY;

		for (var i = 0; i < this.length; ++i) {		  	
			var value = this[i];
			if (prop && value.hasOwnProperty(prop)) {
				value = value[prop];
			} else {
				continue;
			}
			
			value = +value;
			if (isNaN(value)) {
				continue;
			}
			
			result = Math.min(result, value);
		}	
		
		return result;
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



/// extends base API
;(function() {
	
	String.trim = function(str) {
		return str.replace(/^\s+|\s+$/g, "");
	}
	
	String.makeNumber = function(str) {
		return (str == +str && /^[1-9]/.test(str)) ? +str : str;
	}


	Object.clear = function(obj, value) {
		for (var key in obj) {
			obj[key] = value;
		}
		
		return obj;
	}

	Object.clone = function(a) {
		if (!a || typeof a !== "object") {
			return a;
		}
		
		var o = Array.isArray(a) ? [] : {};
		for (var key in a) {
			if (a.hasOwnProperty(key)) {
				o[key] = Object.clone(a[key]);
			}
		}
		
		return o;
	}
	
	Object.isEqual = function(a, b) {
		var type, prop, props;

		if (a === b) {
			return true;
		}
		
		type = typeof a;
		if (type !== typeof b) {
			return false;
		}
		
		/// null, Boolean, String, Number, Date, Function
		if (type !== "object" || a === null || b === null || !isNaN(+a)) {
			return a === b;
		}

		/// Wrapping Object of Boolean, Number, String
		if (a.valueOf() === b.valueOf()) {
			return true;
		}


		/// Object, Array
		if (a.length !== b.length) {
			return false;
		}
		
		props = {};
		for (prop in a) {
			if (!a.hasOwnProperty(prop)) {
				continue;
			}
			
			type = typeof a[prop];
			if (type !== typeof b[prop]) {
				return false;
			}
			
			props[prop] = false;

			if (type !== "object") {
				if (!Object.isEqual(a[prop], b[prop])) {
					return false;
				}
				
				props[prop] = true;
			}
		}
	
		for (prop in b) {
			if (!b.hasOwnProperty(prop) || props[prop]) {
				delete props[prop];
				continue;
			}

			type = typeof a[prop];
			if (type !== typeof b[prop]) {
				return false;
			}
			
			props[prop] = false;

			if (type !== "object") {
				if (!Object.isEqual(a[prop], b[prop])) {
					return false;
				}

				delete props[prop];
			}
		}

		for (prop in props) {
			if (!Object.isEqual(a[prop], b[prop])) {
				return false;
			}
		}
	
		return true;
	}
	
	Function.noop = function(){};
	
	/// @FIXME: .. --- Function
	Function.prototype.$new = function() {
	
		var reg_args = /\((.*?)\)/g;
		var reg_split = /\s?,\s?/;
		
		var createController = function(func, self) {
			self = self || {};
			var args = [self];

			/// function(self, Controller1, Controller2, ...) 으로 부터 컨트롤을 가져옴.
			var source = Function.prototype.toString.call(func);	
			reg_args.lastIndex = 0;
			var controllers = reg_args.exec(source)[1].split(reg_split).slice(1);		
			

			$.each(controllers, function(index, controller) {
				var c = window[controller]; /// @FIXME ...
		
				if (!c) { throw new Error(controller + " is not defined."); }
				if (typeof c !== "function") { throw new Error(controller + " is not function."); }
	
				args.push(createController(c, self).func);
			});
			
			return {func: func.apply(self, args), args: args};
		};
	
	
		return function() {
			var self = {};
			var f = createController(this, self);
			
			$.extend.apply(window, f.args);
			$.extend(self, f.func);
	
			self.init && self.init.apply(self, Array.prototype.slice.call(arguments));		
			return self;
		};
	}();

}());




/// module 
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



/// EVAL
__define("eval", function() {

	var func = {};

	return function(script, scope) {
		switch(script) {
			case "true": return true;
			case "false": return false;
			case "null": return null;
			case "undefined": return undefined;
			case "0": return 0;
			case "1": return 1;
			case "": return "";
		}
		

		var el;
		if (scope.nodeName) {
			el = scope;
			scope = el.$scope;
		}
		
		if (!Array.isArray(scope)) {
			scope = [scope];
		}
		
		var thisObj = scope.thisObj || scope[scope.length-1];
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
			
			if (el) {
				var a = el.outerHTML;
				console.log(a, error, error.message, script);
			} else {
				console.log(error, error.message, script);
			}
			
			return undefined;
		}
	}
});



/// PARSE
__define("parse", function() {

	var evalfunc = function(isExpr, text, scope) {
		if (!isExpr) {
			return text;
		}
		
		var $eval = __require("eval");
		var script = text.substring(1, text.length-1);
		var result = $eval(script, scope);
			
		return (result === undefined || result === null) ? "" : result;
	}

	var parse = function(script, scope, func) {
		if (typeof script !== "string") {
			return "";
		}
		
		if (script == false) {
			return script;
		}
	
		var lastIndex = 0;
		var result = [];
		func = func || evalfunc;
		
		script.replace(parse.REGEXP_EXPRESSION, function(expr, index) {
			var str = script.substring(lastIndex, index);
			str.length > 0 && result.push(func(false, str, scope, index));
			result.push(func(true, expr, scope, index));
			
			lastIndex = index + expr.length;

			return expr;
		});


		if (lastIndex === 0) {		
			return script;
		}
		
		if (lastIndex !== script.length) {
			result.push(func(false, script.substring(lastIndex), lastIndex));
		}

		return result.length ? result.join("") : script;
	}
	
	parse.REGEXP_EXPRESSION = /{[^{}]+}/g;
	
	return parse;	
});



__define("travel", function() {

	return function(el, func) {
		func = func || Function.noop;
		var stack = [];
		var next = el;
		
		while(next) {
			var result = func(next);
			next.nextSibling && stack.push(next.nextSibling);
			next = next.childNodes && next.childNodes.item(0);
			(!next || result === false) && (next = stack.pop());
		}
	}
});


__define("compile", function() {

	var $parse = __require("parse");

	var ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = 2;
	var TEXT_NODE = 3;

	/// @TODO: Config에서 추가 할수 있도록 수정할 것!
	var booleanAttrs = {"checked":1, "disabled":1, "autoplay":1, "async":1, "autofocus":1, "controls":1, "default":1, "defer":1, "formnovalidate":1, "hidden":1, "ismap":1, "itemscope":1, "loop":1, "multiple":1, "novalidate":1, "open":1, "pubdate":1, "readonly":1, "required":1, "reversed":1, "scoped":1, "seamless":1, "selected":1, "unabled": 1};


	var $compile = function(el) {
	
		$(el).find("template").each(function(index, node) {
			Binding.templates[node.id] = node;
			node.parentNode.removeChild(node);			
		});
		
		var travel = __require("travel");		
		travel(el, function(el) {
			var func = $compile[el.nodeType] || Function.noop;
			return func(el); 		
		});

		return function() { Observer.update(); }
	}
	
	
	/// node.attributes CROSS-BROWSE for IE
	var attributesOf = function() {
		if (document.createElement("div").attributes.length === 0) {
			return function(el) { 
				return $.makeArray(el.attributes);
			}
		}
	
		var REGEXP_STRING = /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g
	
		return function(el) {
			var div = document.createElement("div");
			div.appendChild(el.cloneNode(false));
			
			var attrs = div.innerHTML.replace(REGEXP_STRING, "");
			attrs = attrs.split(/>/);
			attrs.pop();
			attrs = attrs.join("");
			attrs = attrs.split(/\s+/g).slice(1);
			
			var result = [];
			$.each(attrs, function(index, attr) {
				var a = attr.split("=");
				var attrNode = {};
				attrNode.nodeName = a.shift();
				attrNode.value = a.join("=");
				attrNode && result.push(attrNode);
			});
			
			return result;
		}
	}();
	
	
	/// ELEMENT NODE
	$compile[ELEMENT_NODE] = function(node) {
		if (node.nodeName === "SCRIPT" || node.nodeName === "HEAD" || node.nodeName === "STYLE") {
			return false;
		}
	
		if (node.getAttribute("nobind")) {
			return false;
		}

		if (node.hasTemplate) {
			return;
		}
	
		var result = true;
		var attributes = attributesOf(node);

		for (var i = 0; i < attributes.length; i++) {
			if ($compile[ATTRIBUTE_NODE](attributes[i], node) === false) {
				result = false;
			}
		}
	
		return result;
	}
	
		

	// ATTR NODE
	$compile[ATTRIBUTE_NODE] = function(node, el) {
		var nodeName = node.nodeName;
		var value = String(node.nodeValue || "");
		var hasExpression = value.search($parse.REGEXP_EXPRESSION) >= 0;
		
		// Handler - Custom
		var handler = __require("@"+nodeName);
	
		// Handler - Event
		if (!handler && ("on"+nodeName) in document) {		
			handler = __require("~event");
		}
	
		if (!handler && ("on"+nodeName) in el) {
			handler = __require("~event");
		}
	
		// Handler - Boolean Attrs
		if (!handler && nodeName in booleanAttrs) {
			handler = __require("~boolean");
		}
	
		// Handler - Boolean Attrs
		if (!handler && nodeName.replace(/^data-/, "") in booleanAttrs) {
			handler = __require("~boolean");
		}
		
		// Handler - {expression}
		if (!handler && hasExpression) {
			Observer.create(el, node, value, Binding.nodeValue);
			return;
		}
		
		if (!handler) {
			return;
		}
		
		
	
		// prepare Binding
		var binding = {};
		binding.el = el;
		binding.$el = $(el);
		binding.attr = nodeName;
		binding.script = value;
		binding.hasExpression = hasExpression;

		/// init
		if (handler.init) {
			if (handler.init.call(binding, binding, nodeName, binding.script) === false) {
				return false;
			}
		}

		// update
		if (handler.update) {
			Observer.create(el, binding, nodeName, binding.script, handler, Binding.execute);
		}
	}
	
	
	
	$compile[TEXT_NODE] = function(node) {
	
		var nodeValue = String(node.nodeValue);
		var hasExpr = false;
		
		$parse(nodeValue, [], function(isExpr, text, scope, index) {
			hasExpr = hasExpr || isExpr;
			var textNode = document.createTextNode(text);
			node.parentNode.insertBefore(textNode, node);
			isExpr && Observer.create(node.parentNode, textNode, text, Binding.nodeValue);	
		});
	
		if (hasExpr) {		
			node.nodeValue = "";
		}
	
		return false;
	}
	
	return $compile;
});






/////////////////////////////////// Observer /////////////////////////////////////
var Observer = {

	create: function(el) {
	
		var o = {};
		o.el = el;
		o.args = Array.prototype.slice.call(arguments);
		o.func = o.args.pop();
		o.update = function(){ return o.func.apply(o, o.args); }
		
		el._observers = el._observers || [];
		el._observers.push(o);

		return o;
	},
	
	update: function() {

		var travel = __require("travel");

		travel(document, function(el) {
			if (el.parentNode) {
				el.$scope = Array.prototype.slice.call(el.parentNode.$scope);
				el.$scope.thisObj = el.parentNode.$scope.thisObj;
			}

			el._observers && $.each(Array.prototype.slice.call(el._observers), function(index, o) {
				if (o.update() === false) {
					el._observers.removeObject(o);
				}
			});
		});

		/// @FIXME: input value가 초기값을 가질때 한번더 리프레쉬 하는 기능 - 임시구현
		if (document.update.again) {
			delete document.update.again;
			Observer.update();
		}
	}
}
	
	
	




/////////////////////////////////// Binding /////////////////////////////////////
var Binding = {};

Binding.nodeValue = function(el, node, script) {

	var $parse = __require("parse");

	var self = this;
	var data = $parse(script, el);

	if (self.value !== data) {
		self.value = node.nodeValue = data;
	}
}



Binding.execute = function(el, self, attr, value, handler) {
	var $scope = self.el.$scope;

	handler.value = handler.value || Binding.values[handler.valueType];
	var $value = handler.value ? handler.value.call(self, self, self.script, $scope) : value;

	// 값이 변화가 없으면 SKIP
	if (self.hasOwnProperty("value") && Object.isEqual(self.value, $value)) {
		return;
	}	

	// Call Update
	self.value = $value;
	var result = handler.update.call(self, self, $value, $scope);

	return result;	
}




Binding.values = {};

Binding.values.none = function(self, script, $scope) {
	return script;
}

Binding.values.expr = function(self, script, $scope) {
	var $eval = __require("eval");
	return $eval(script, self.el);
}

Binding.values["expr-nocache"] = function(self, script, $scope) {
	var $eval = __require("eval");
	var r = $eval(script, self.el);
	delete self.value;
	return r;
}

Binding.values.string = function(self, script, $scope) {
	var $parse = __require("parse");
	return $parse(script, self.el) || "";
}



Binding.templates = {};






///////////////////////////// ATTR NODE HANDLERS ////////////////////////////////////


/// ~event
__define("~event", function() {

// @TODO: 터치 기반 이벤트 추가 할것!!!
//window.isTouchSupport = window.isTouchSupport || ("ontouchstart" in document);
//var touchTarget;

var $eval = __require("eval");

return {
	init: function(self, attr, value) {

		self.$el.bind(attr, function(e) {

			if (self.$el.closest(".disabled, [disabled]").length) {
				e.preventDefault();
				return false;
			}

			window.$event = e;
			
			if ($eval(value, self.el) === false) {
				e.preventDefault();
			}

			if (!e.cancelUpdate) {
				document.update();
			}

			window.$event = $.Event();
		});
	}		
}});




/// ~boolean attribute
__define("~boolean", function() {
	return {
		valueType: "expr",

		update: function(self, value, $scope) {
			var attr = self.attr.replace(/^data-/, "");
			var bool = !!value;

			switch(value) {
				case "undefined":
				case "null":
				case "false":
				case "0":
					bool = false;
					break;
				
				case "":
					bool = true;
			}

			bool ? self.$el.attr(attr, attr) : self.$el.removeAttr(attr);
			bool ? self.$el.addClass(attr) : self.$el.removeClass(attr);
		}
	}
});






/// repeat
__define("@repeat", function() {

	var $eval = __require("eval");
	var $compile = __require("compile");

	var REGEXP_REPEAT = /(\S+)\sas\s([^,\s]+)(?:\s?,\s?(\S+))?/;
	
	return {
		init: function(self) {

			var attr = self.attr;
			var value = self.script;
			var parse = value.match(REGEXP_REPEAT) || [];
			self.script = $.trim(parse[1]);
			self.row = $.trim(parse[2]);
			self.index = $.trim(parse[3]);

			/// @TODO: Syntax Error 처리~
			
			self.container = [];			
			self.repeatNode = self.el.cloneNode(true);
			self.repeatNode.removeAttribute(attr);

			var startNode = document.createTextNode("");
			var endNode = document.createTextNode("");
			self.el.parentNode.insertBefore(startNode, self.el);
			self.el.parentNode.insertBefore(endNode, self.el);
			self.el.parentNode.removeChild(self.el);

			self.el = startNode;
			self.$el = $(self.el);

			/// @FIXME: 
			self.el._observers = [{
				update: function() {
					var repeat = __require("@repeat");
					repeat.update(self);
				}
			}];
		},

		update: function(self) {
			
			// 동일한 값이면 update SKIP
			var collection = $eval(self.script, self.el) || [];
			var value = Array.prototype.slice.call(collection);
			if (Object.isEqual(self.value, value)) {
				return;
			}
			self.value = Array.prototype.slice.call(value);
			

			// 동일한 컨텐츠 Element 재사용
			var pool = [];
			var reorders = [];
			var src = Array.prototype.slice.call(value);

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


			// render!
			self.container = [];
			var here = self.el.nextSibling;

			for (var index = 0; index < value.length; index++) {
				var row = value[index];

				var repeatNode = reorders[index] || pool.shift() || self.repeatNode.cloneNode(true);
				repeatNode.$scope = Array.prototype.slice(self.el.$scope);
				repeatNode.$scope.thisObj = self.el.$scope.thisObj;

				repeatNode.collection = collection;
				repeatNode.data = row;
				repeatNode.local = {};
				self.row && (repeatNode.local[self.row] = row);
				self.index && (repeatNode.local[self.index] = index);				
				
				repeatNode != here && here.parentNode.insertBefore(repeatNode, here);
				here = repeatNode.nextSibling;
				
				if (!repeatNode._observers) {
					Observer.create(repeatNode, function(el) {
						el.$scope = el.$scope || [];
						el.$scope.push(el.local);
					});
					$compile(repeatNode);
				}

				self.container.push(repeatNode);
			}
			
			
			// 사용안하는 Node 제거			
			while(pool.length) {
				var removed = pool.pop();
				
				// 노드, 삭제 변경등으로 인한 radio, checkbox 업데이트
				$(removed).find("input:checked")
					.attr("checked", false)
					.css("display", "none")
					.appendTo("body")
					.trigger("change");
				setTimeout(function() { $(removed).remove(); });

				removed.parentNode.removeChild(removed);
				removed = null;
			}
			
			// 노드, 삭제 변경등으로 인한 radio, checkbox 업데이트
			$(self.el.parentNode).find("input:checked").trigger("change");
		}		
	}
});



/// template
__define("@template", function() {
	var $compile = __require("compile");

	return {
		init: function(self, attr, value) {
			self.el.innerHTML = "";
			self.el.hasTemplate = true;
		},

		valueType: "string",
		
		update: function(self, value) {
		
			var template = Binding.templates[value];
			var html = (template && template.innerHTML) || "";


			// 노드, 삭제 변경등으로 인한 radio, checkbox 업데이트
			$(self.el).find("input:checked")
				.attr("checked", false)
				.css("display", "none")
				.appendTo("body")
				.trigger("change");

			self.el.innerHTML = html;
			html.length && $compile(self.el);
		}		
	}
});



/// with
__define("@with", function() {
	return {
		valueType: "expr-nocache",

		update: function(self, value, $scope) {
			value = value || {};
						
			self.el.$scope = self.el.$scope || [];
			self.el.$scope.push(value);
			self.el.$scope.thisObj = value;
		}
	}
});

/// local
__define("@local", function() {
	return {
		valueType: "expr-nocache",

		update: function(self, value, $scope) {
			self.el.$scope = self.el.$scope || [];
			self.el.$scope.push(value);
		}
	}
});



/// name
__define("@name", function() {

	var $parse = __require("parse");

	/// FORM의 value값을 가져오는 함수
	function getFormValueOf(el) {
		var $scope = el.$scope;
		var name = el.name;
		var type = (el.type || "text").toLowerCase();

		/// TEXT, TEXTAREA, ETC...
		if (type !== "checkbox" && type !== "radio") {
			return String.makeNumber(el.value);
		}

		// @TODO: CONTENTEDITABLE
		if (el.contentEditable == "contentEditable") {
			return el.innerHTML;
		}
				

		/// CHECKBOX, RADIO
		var val = [];
		var form = $(el).closest("form").get(0);
		var elements = form ? form.elements[name] : document.getElementsByName(name);
		elements = elements.length ? elements : [elements];

		$.each(elements, function(index, elem) {
			if (elem.type.toLowerCase() != type) {
				return;
			}
		
			if (type === "radio") {
				elem.checked && (val = [elem.value]);
				return;
			}
			
			if (type === "checkbox") {
				if (elem.checked) {
					val.push(elem.getAttribute("value") || true);
				}
				else if (elem.hasAttribute("false-value")) {
					val.push(elem.getAttribute("false-value"));				
				}
				
				return;
			}
		});

		
		/// Radio Default값이 없는 경우 첫번째 엘리먼트를 checked로 변경하고 해당 값 리턴
		if (type === "radio" && val.length === 0) {
			elements[0].checked = true;
			return elements[0].value;
		}

		return val.length > 1 ? val : val[0];
	}


	/// INPUT에서 변경한 내용이 자기자신을 변경해서 발생하는 재귀 데드락을 방지한다.
	var $emitter = null;
	
	return {
		init: function(self) {

			/// 값이 변경되면 업데이트!
			self.$el.bind("keydown input paste cut change", function(e) {
				setTimeout(function() {
					var $scope = self.el.$scope;
					var name = $parse(self.script, self.el);
					var value = getFormValueOf(self.el);

					if ($scope.thisObj[name] === value) {
						return false;
					}
					
					self.value = $scope.thisObj[name] = value;

					$emitter = self.el;
					document.update();				
					$emitter = null;
				});
			});
		},
		
		value: function(self, value, $scope) {
			self.hasExpression && (self.el.name = $parse(self.script, self.el))	;
 			return $scope.thisObj[self.el.name];
		},
		
		update: function(self, value, $scope) {
		
			if (self.el == $emitter) {
				return;
			}

			var name = self.el.name;

			if (!self.hasOwnProperty("prepare")) {
				self.prepare = true;
				self.needs_init = !$scope.thisObj.hasOwnProperty(name);
				
				if (self.needs_init) {
					$scope.thisObj[name] = undefined;
				}
				
				delete self.value;
				document.update.again = true;
				return;
			}


			var val = getFormValueOf(self.el);

			// 표현식이 없고 값이 세팅이 안된경우 초기 입력값으로 설정한다.
			if (!self.hasExpression && !$scope.thisObj.hasOwnProperty(name)) {
				self.el.initValue = self.el.initValue || val;
				$scope.thisObj[name] = self.el.initValue;
				document.update.again = true;
			}


			/// SELECT
			if (self.el.nodeName === "SELECT") {
				setTimeout(function() {
					value !== val && self.$el.val(value);			
				});
				return;
			}



			var type = (self.el.type || "text").toLowerCase();

			/// INPUT - CHECKBOX
			if (self.el.nodeName === "INPUT" && type === "checkbox" && Array.isArray(value)) {
				val = self.el.getAttribute("value") || true;
				self.el.checked = value.has(val);
				return;
			}

			/// INPUT - CHECKBOX or RADIO
			if (self.el.nodeName === "INPUT" && (type === "checkbox" || type === "radio")) {	
				val = self.el.getAttribute("value") || true;
				self.el.checked = (value == val);
				return;
			}

			/// INPUT - TEXT, TEXTAREA
			if (self.el.nodeName === "INPUT" || self.el.nodeName === "TEXTAREA") {
				value = (value === undefined || value === null) ? "" : value;			
				value !== val && self.$el.val(value);
				return;
			}

		}
	}
});



/// value
__define("@value", function() {
	return {
		valueType: "string",

		update: function(self, value, $scope) {
			self.el.initValue = value;
			self.el.value = $scope.thisObj[self.el.name] || value;
			self.$el.trigger("change");
			
			return !self.hasExpression;
		}
	}
});


/// visible
__define("@visible", function() {
	return {
		valueType: "expr",

		update: function(self, value) {
			!!value ? self.$el.show() : self.$el.css("display", "none");
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
		update: function(self, value, $scope) {
			document.update();
			var $eval = __require("eval");
			$eval(value, [self.$el].concat($scope));

			return false;
		}
	}
});



/// @html
__define("@html", function() {
	return {
		init: function(self) {
			self.el.innerHTML = "";
			return false;
		},
		
		valueType: "string",

		update: function(self, value) {
			self.el.innerHTML = value;
		}
	}
});


/// @img-src
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


/// @css -- IE에서 style 속성 안 먹음
__define("@css", function() {
	return {
		valueType: "string",
		
		update: function(self, value) {
			self.el.style.cssText += (";" + value);
		}
	}
});



/// @outlet
__define("@outlet", function() {
	return {
		update: function(self, value, $scope) {
			$scope.thisObj[value] = self.el;
			return false;
		}
	}
});



/// @placeholder
/// @TODO: template등으로 활용될 경우에도 적용가능하도록 수정할것!!!
__define("@placeholder", function() {

	function inputPlaceholder (input, color) {
	
		if (!input) return null;
	
		// Do nothing if placeholder supported by the browser (Webkit, Firefox 3.7)
		if (input.placeholder && 'placeholder' in document.createElement(input.tagName)) {
			return input;
		}
	
		color = color || '#AAA';
		var default_color = input.style.color;
		var placeholder = input.getAttribute('placeholder');
	
		if (input.value === '' || input.value == placeholder) {
			input.value = placeholder;
			input.style.color = color;
			input.setAttribute('data-placeholder-visible', 'true');
		}
	
		var add_event = /*@cc_on'attachEvent'||@*/'addEventListener';
	
		input[add_event](/*@cc_on'on'+@*/'focus', function() {
			input.style.color = default_color;
			if (input.getAttribute('data-placeholder-visible')) {
				input.setAttribute('data-placeholder-visible', '');
				input.value = '';
			}
		}, false);
	
		input[add_event](/*@cc_on'on'+@*/'blur', function(){
			if (input.value === '') {
				input.setAttribute('data-placeholder-visible', 'true');
				input.value = placeholder;
				input.style.color = color;
			} else {
				input.style.color = default_color;
				input.setAttribute('data-placeholder-visible', '');
			}
		}, false);
	
		input.form && input.form[add_event](/*@cc_on'on'+@*/'submit', function(){
			if (input.getAttribute('data-placeholder-visible')) {
				input.value = '';
			}
		}, false);
	
		return input;
	}


	return {
		valueType: "string",
		
		init: function(self) {
			setTimeout(function() {
				inputPlaceholder(self.el);	
			});
		}
	}
});







/// @css -- IE에서 style 속성 안 먹음
__define("@width", function() {
	return {
		valueType: "string",
		
		update: function(self, value) {
			if (self.el.nodeName === "IMG") {
				return false;
			}

			value = value == +value ? value + "px" : value;
			self.el.style.cssText += ("; width:" + value);
		}
	}
});




/// @css -- IE에서 style 속성 안 먹음
__define("@height", function() {
	return {
		valueType: "string",
		
		update: function(self, value) {
			if (self.el.nodeName === "IMG") {
				return false;
			}
			
			value = value == +value ? value + "px" : value;
			self.el.style.cssText += ("; height:" + value);
		}
	}
});












/////////////////////////////////////////////////////////////////////////////////////////


/// --- DOM-READY: COMPILE
$(".disabled, *[disabled]").on("click", function(e) {
	e.preventDefault();
});

/// --- FORM에서 ENTER키 입력시 자동 submit
$(document).on("submit", "form", function(e) {
	e.preventDefault();
});

$(document).on("keydown", "form input", function(e) {
	var self = $(this);

	if (e.keyCode == 13) {
		e.preventDefault();
		e.stopPropagation();

		setTimeout(function() {
			self.closest("form").triggerHandler("submit");
		});
	}
});



(function() {
	var style = document.createElement("style");
	var cssText = "html,body{visibility: hidden !important;}";
	style.setAttribute("type", "text/css");
	style.styleSheet ? (style.styleSheet.cssText = cssText) : (style.innerHTML = cssText);

	document.getElementsByTagName("head")[0].appendChild(style);

	/// DOM READY!
	$(function() {
	
		// Support HTML5 UnknownElements for IE 8-
		(function() {
			var div = document.createElement("div");
			div.innerHTML = "<xyz></xyz>";
	
			var supportsUnknownElements = (div.childNodes.length === 1);	
			if (supportsUnknownElements) {
				return;
			}
			
			var c = document.getElementsByTagName("*");
			for (var i = 0; i < c.length; i++) {
				var el = c.item(i);
				if (el.nodeName.charAt(0) == "/") {
					document.createElement(el.nodeName.slice(1));
				}
			}
	
			document.body.innerHTML = document.body.innerHTML;
		}());
	
	
		var $compile = __require("compile");
		document.$scope = [document.$scope || window.ViewController ? window.ViewController.$new() : {}];
		document.$scope.thisObj = document.$scope[0];
		document.viewcontroller = document.$scope;
		
		
		/// @FIXME: willupdate, didupdate 미묘....
		var update = $compile(document);
		document.update = function() {
			document.$scope._willupdate && document.$scope._willupdate();
			update();
			document.$scope._didupdate && document.$scope._didupdate();
		};
		document.update();
//		document.update(); // @NOTE: INPUT 및 init 초기화값 재설정 루틴을 위해 초기에 2번 업데이트 한다!.
	
		style.parentNode.removeChild(style);
	});

}());





////////////////////////////////////////////////////////////////////////////////////////////

/* Number format */
Number.format = function(number, decimals, dec_point, thousands_sep) {
	if (!number) {
		return 0;
	}
		
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

Number.signedFormat = function(number, decimals, dec_point, thousands_sep) {
	if (!number) {
		return "0";
	}

	var prefix = number > 0 ? "+" : "";	
	return prefix + window.number_format(number, decimals, dec_point, thousands_sep);
}












/* DATE FORMAT */
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMisTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),

			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				i:    M,
				ii:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For convenience...
Date.prototype.format = function(mask, utc) {
	return dateFormat(this, mask, utc);
}

Date.format = function(date, mask, utc) {
	return (new Date(date)).format(mask, utc);
}
