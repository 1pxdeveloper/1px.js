$module("1px", function(module) {

	var foreach = module.require("foreach");
	var makeArray = module.require("makeArray");

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;

	var ua = navigator.userAgent;
	var msie = +(/msie (\d+)/i.exec(ua) || [])[1];
	msie = msie || (/trident/i.test(ua) ? 11 : NaN);

	var ios = +(/iphone|ipad (\d+)/i.exec(ua) || [])[1];

	var regexp_whitespace = /\s+/g;

	function cssValue(type, value) {
		if (typeof value !== "number") return value;
		if (type === "opacity") return value;
		if (type === "z-index") return value;
		if (type === "zIndex") return value;
		if (type === "line-height") return value;
		if (type === "lineHeight") return value;
		return value + "px";
	}

	var uuid = 0;
	function nextid() {
		return ++uuid;
	}

	var _cache = {};
	function expandoStore(el, key, value) {
		var id = el._1pxjs;
		var store = _cache[id];
		if (arguments.length === 2) {
			return store && store[key];
		}

		el._1pxjs = id = id || nextid();
		store = _cache[id] = _cache[id] || {};
		store[key] = value;
	}

	function removeNode(node) {
		return node.parentNode.removeChild(node);
	}

	function show(el) {
		try {
			el.style.display = "";
		} catch(e) {
			el.style.cssText = el.style.cssText.replace(/display\s*:\s*none\s*(!important)?/ig, "");
		}
	}

	function hide(el) {
		try {
			el.style.cssText += ";display:none!important";
		} catch(e) {
			el.setAttribute("style", el.getAttribute("style") + ";display:none!important");
		}
	}


	function querySelectorAll(el, selector) {
		return el.querySelectorAll(selector);
	}

	function matchesSelector(el, selector) {
		if (el.nodeType !== ELEMENT_NODE) return false;
		var matches = el.matchesSelector || el.webkitMatchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.oMatchesSelector;
		return matches.call(el, selector);
	}

	function closest(el, selector) {
		while(el && !matchesSelector(el, selector)) {
			el = el.parentNode;
		}
		return el;
	}

	function DOMContentLoaded(fn) {
		if (document.readyState !== "loading") return fn();
		document.addEventListener("DOMContentLoaded", fn);
	}

	function addClass(el, className) {
		foreach(className.split(regexp_whitespace), function(className) {
			el.classList.add(className);
		});
	}

	function removeClass(el, className) {
		return el.classList.remove(className);
	}

	function hasClass(el, className) {
		return el.classList.contains(className);
	}

	function attributesOf(el) {
		return makeArray(el.attributes);
	}

	function hasAttribute(el, attr) {
		return el.hasAttribute(attr);
	}

	function addEvent(el, type, fn) {
		return el.addEventListener(type, fn);
	}

	function removeEvent(el, type, fn) {
		return el.removeEventListener(type, fn);
	}

	function dispatchEvent(el, type) {
		var event = document.createEvent("HTMLEvents");
		event.initEvent(type, true, true);
		return el.dispatchEvent(event);
	}

	function bind(el) {
		var fn = arguments[arguments.length-1];
		for (var i = 1, len = arguments.length-1; i < len; i++) {
			addEvent(el, arguments[i], fn);
		}
	}

	function unbind(el) {
		var fn = arguments[arguments.length-1];
		for (var i = 1, len = arguments.length-1; i < len; i++) {
			removeEvent(el, arguments[i], fn);
		}
	}


	if (msie <= 10) {
		DOMContentLoaded = function(fn) {
			(function() {
				try { document.documentElement.doScroll('left'); }
				catch(e) { return setTimeout(arguments.callee, 25); }
				fn();
			}())
		}
	}


	if (msie <= 9) {
		addClass = function(el, className) {
			className = el.className + " " + className;

			var check = {};
			var result = [];
			foreach(className.split(regexp_whitespace), function(className) {
				if (check[className] === true) {
					return;
				}

				check[className] = true;
				result.push(className);
			});
			el.className = result.join(" ");
		};

		removeClass = function(el, className) {
			var result = [];
			foreach(el.className.split(regexp_whitespace), function($className) {
				$className !== className && result.push($className);
			});
			el.className = result.join(" ");
		};

		hasClass = function(el, className) {
			return (" " + el.className + " ").indexOf(className) >= 0;
		};
	}


	if (msie <= 8) {

		/// html5shiv
		foreach("abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video".split(" "), function(tagName) {
			document.createElement(tagName);
		});

		Object.create = function(prototype) {
			function object(){}
			object.prototype = prototype;
			var o = new object();
			o.__proto__ = prototype;
			return o;
		};

		Object.getPrototypeOf = function(object) {
			return object.__proto__ || object.constructor.prototype;
		};

		attributesOf = function(el) {
			var result = [];
			foreach(el.attributes, function(attr) {
				attr.specified && result.push(attr);
			});
			return result;
		};

		hasAttribute = function(el, attr) {
			attr = el.getAttributeNode(attr);
			return attr && attr.specified;
		};

		matchesSelector = function(node, selector) {
			var nodeList = querySelectorAll(node.parentNode, selector);
			for (var i = 0, len = nodeList.length; i < len; i++) {
				if (nodeList[i] == node) return true;
			}
			return false;
		};

		function fixEvent(el, fn) {
			return (fn.iefix = function(e) {
				e.target = e.srcElement || document;
				e.currentTarget = el;
				e.defaultPrevented = false;
				e.preventDefault = preventDefault;
				e.stopPropagation = stopPropagation;
				e.timeStamp = +new Date;

				e.metaKey = !!e.metaKey;
				e.relatedTarget = e.fromElement === e.target ? e.toElement : e.fromElement;

				if (e.clientX) {
					e.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					e.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}

				/// @TODO: IE EVENT FIX: which~

//			var button = e.button;
//			if (button) {
//				e.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
//			}
//
//			var charCode = e.charCode != null ? e.charCode : e.keyCode;
//			e.which = charCode;

				var result = fn.call(e.currentTarget, e);
				e.target = null;
				e.relatedTarget = null;
				e.preventDefault = null;
				e.stopPropagation = null;

				return (e.defaultPrevented === true) ? false : result;
			})
		}

		function preventDefault() {
			this.defaultPrevented = true;
			this.returnValue = false;
		}

		function stopPropagation() {
			this.cancelBubble = true;
		}

		addEvent = function(el, type, fn) {
			el.attachEvent("on"+type, fixEvent(el, fn));
		};

		removeEvent = function(el, type, fn) {
			el.detachEvent("on"+type, fn.iefix);
		};

		dispatchEvent = function(el, type) {
			return el.fireEvent("on"+type);
		};
	}

	if (msie <= 7) {
		querySelectorAll = function(context, selectors) {
			var style = document.createElement('style'), elements = [], element;
			document.documentElement.firstChild.appendChild(style);
			document._qsa = [];

			style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
			window.scrollBy(0, 0);
			removeNode(style);

			while(document._qsa.length) {
				element = document._qsa.shift();
				element.style.removeAttribute('x-qsa');
				if (context === document || context.contains(element)) {
					elements.push(element);
				}
			}

			document._qsa = null;
			return elements;
		};

		if (!window.XMLHttpRequest) {
			window.XMLHttpRequest = function () {
				try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e) {}
				try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e) {}
				try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}
				throw new Error("This browser does not support XMLHttpRequest.");
			}
		}
	}

	if (msie <= 6) {
		document.execCommand("BackgroundImageCache", false, true)
	}


	/// TOUCH DEVICE - CrossBrowsing
	if ("ontouchstart" in document) {
		var clickable = false;
		var screenX = 0;
		var screenY = 0;
		var scrollX = 0;
		var scrollY = 0;

		document.addEventListener("touchstart", function(e) {
			clickable = true;

			var touch = e.changedTouches[0];
			screenX = touch.screenX;
			screenY = touch.screenY;

			scrollX = window.pageXOffset;
			scrollY = window.pageYOffset;
		});

		document.addEventListener("touchmove", function(e) {
			if (clickable === false) {
				return;
			}

			if (scrollY !== window.pageYOffset || scrollX !== window.pageXOffset) {
				clickable = false;
				return;
			}

			var touch = e.changedTouches[0];
//		var dist = Math.pow(screenX - touch.screenX, 2) + Math.pow(screenY - touch.screenY, 2);
//		if (dist > 25) {
//			clickable = false;
//			return;
//		}
			if (Math.abs(screenX - touch.screenX) < Math.abs(screenY - touch.screenY)) {
				clickable = false;
				return;
			}
		});

		function touchclickfix(fn) {
			return (fn.touchfix = function(e) {
				if (clickable === false) {
					return;
				}
				fn.call(this, e);
			})
		}

		addEvent = function(el, type, fn) {
			if (type === "click") {
				return el.addEventListener("touchend", touchclickfix(fn), false);
			}

			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }

			return el.addEventListener(type, fn, false);
		};

		var _removeEvent = removeEvent;
		removeEvent = function(el, type, fn) {
			if (type === "click" || (type === "touchend" && fn.touchfix)) {
				_removeEvent(el, "touchend", fn.touchfix);
				delete fn.touchfix;
				return;
			}

			if (type === "mousedown") { type = "touchstart"; }
			else if (type === "mousemove") { type = "touchmove"; }
			else if (type === "mouseup") { type = "touchend"; }

			return el.removeEventListener(type, fn, false);
		};
	}

	module.value({
		"msie": msie,
		"ios": ios,

		"cssValue": cssValue,
		"expandoStore": expandoStore,
		"removeNode": removeNode,
		"show": show,
		"hide": hide,

		"querySelectorAll": querySelectorAll,
		"matchesSelector": matchesSelector,
		"closest": closest,
		"DOMContentLoaded": DOMContentLoaded,

		"addClass": addClass,
		"removeClass": removeClass,
		"hasClass": hasClass,
		"attributesOf": attributesOf,
		"hasAttribute": hasAttribute,
		"addEvent": addEvent,
		"removeEvent": removeEvent,
		"dispatchEvent": dispatchEvent,

		"bind": bind,
		"unbind": unbind,
	});
});