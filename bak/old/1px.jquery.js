$module("1px").factory("jQuery", ["foreach", "$cache", "noop", function(foreach, $cache, noop) {

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;

	var regexp_whitespace = /\s+/g;

	function isElement(el) {
		return el && el.nodeType > 0;
	}

	function makeFragment() {
		var frag = document.createDocumentFragment();
		foreach(jQuery(arguments), function(node) {
			frag.appendChild(node);
		});
		return frag;
	}


	var jQuery = (function(prototype) {
		function jQuery(){}
		function $(selector, context) { return new jQuery().add(selector, context) }
		$.fn = jQuery.prototype = prototype;
		return $;
	})({
		jquery: "jqmini 1.0",

		length: 0,

		add: function(mixed, context) {

			/// null, undefined
			if (mixed === null || mixed === undefined) {
				return this;
			}

			/// element
			if (isElement(mixed) === true || mixed === window) {
				this[this.length++] = mixed;
				return this;
			}

			/// "body"
			if (mixed === "body") {
				return this.add(document.body);
			}

			var self = this;
			var type = typeof mixed;

			/// elements, array, object, jQuery object
			if (type === "object" && typeof mixed.length === "number") {
				foreach(mixed, function(content) {
					self.add(content);
				});
				return self;
			}

			/// selector
			if (type === "string" && mixed.charAt(0) !== "<") {
				return this.add(querySelectorAll(context || document, mixed));
			}

			/// html
			if (type === "string" && mixed.charAt(0) === "<") {
				var el = document.createElement("body");
				el.innerHTML = mixed;
				return this.add(el.childNodes);
			}

			/// function
			if (type === "function") {
				DOMContentLoaded(mixed);
				return this;
			}

			return this;
		},

		//	addBack: function() {
		//
		//	},

		addClass: function(className) {
			return foreach(this, function(el) {
				addClass(el, className);
			});
		},

		attr: function(attributeName, value) {
			if (arguments.length === 1) {
				return this[0] ? this[0].getAttribute(attributeName) : null;
			}

			if (arguments.length === 2) {
				return foreach(this, function(el) {
					el.setAttribute(attributeName, value);
				});
			}
		},

		after: function(content) {
			var args = arguments;
			return foreach(this, function(el) {
				var frag = makeFragment(args);
				el.nextSibling
					? el.parentNode.insertBefore(frag, el.nextSibling)
					: el.parentNode.appendChild(frag);
			});
		},

		append: function() {
			var args = arguments;
			return foreach(this, function(el) {
				el.appendChild(makeFragment(args));
			});
		},

		appendTo: function(target) {
			jQuery(target).append(this);
			return this;
		},

		before: function() {
			var args = arguments;
			return foreach(this, function(el) {
				el.parentNode.insertBefore(makeFragment(args), el);
			});
		},

		bind: function(eventType, handler) {
			if (arguments.length === 1) {
				var self = this;
				foreach(eventType, function(handler, eventType) {
					self.bind(eventType, handler);
				});
				return this;
			}

			eventType = eventType.split(regexp_whitespace);
			return foreach(this, function(el) {
				foreach(eventType, function(eventType) {
					addEvent(el, eventType, handler);
				});
			});
		},

		blur: function() {
			return foreach(this, function(node) {
				node.blur && node.blur();
			});
		},

		children: function() {
			var result = jQuery();
			foreach(this, function(el) {
				foreach(el.childNodes, function(node) {
					node.nodeType === 1 && result.add(node);
				});
			});
			return result;
		},

		clone: function(/* [withDataAndEvents] */) { /// @TODO:  [withDataAndEvents]
			var result = jQuery();
			foreach(this, function(el) {
				result.add(el.cloneNode(true));
			});
			return result;
		},

		closest: function(selector) {
			var result = jQuery();
			foreach(this, function(el) {
				while(el && !matchesSelector(el, selector)) {
					el = el.parentNode;
				}
				result.add(el);
			});
			return result;
		},

		contents: function() {
			var result = jQuery();
			foreach(this, function(el) {
				result.add(el.childNodes);
			});
			return result;
		},

		css: function(propertyName, value) {
			if (arguments.length === 1) {
				if (typeof propertyName === "string") {
					return this[0] && styleOf(this[0])[propertyName];
				}

				if (typeof propertyName === "object") {
					var properties = propertyName;
					return foreach(this, function(el) {
						foreach(properties, function(value, propertyName) {
							el.style[propertyName] = cssValue(propertyName, value);
						});
					});
				}
			}

			return foreach(this, function(el) {
				el.style[propertyName] = cssValue(propertyName, value);
			});
		},

		click: function(event) {
			return foreach(this, function(el) {
				el.click(event);
			});
		},

		data: function(key, value) {
			/// @TODO:
		},

		each: function(fn) {
			for (var i = 0, len = this.length; i < len; i++) {
				if (fn.call(this[i], i, this[i]) === false) break;
			}
			return this;
		},

		empty: function() {
			return foreach(this, function(el) {
				el.innerHTML = "";
			});
		},

		eq: function(index) {
			return jQuery(this[index < 0 ? this.length + index : index]);
		},

		filter: function(fn) {
			var ret = jQuery();
			foreach(this, function(node, index) {
				fn(index, node) && ret.add(node);
			});
			return ret;
		},

		find: function(sel) {
			var ret = jQuery();
			foreach(this, function(node) {
				ret.add(querySelectorAll(node, sel));
			});
			return ret;
		},

		first: function() {
			return this.eq(0);
		},

		focus: function() {
			return foreach(this, function(node) {
				node.focus && node.focus();
			})
		},

		get: function(index) {
			return this[index];
		},

		has: function() {
			/// @TODO:
		},

		hasClass: function(className) {
			return !!search(this, function(el) {
				return hasClass(el, className);
			});
		},

		height: function() {
			/// @TODO:
		},

		hide: function() {
			return foreach(this, function(el) {
				hide(el);
			});
		},

		html: function(htmlString) {
			if (arguments.length === 0) {
				return this[0] ? this[0].innerHTML || "" : "";
			}

			return foreach(this, function(el) {
				el.innerHTML = htmlString;
			});
		},

		index: function(target) {
			target = jQuery(target)[0];
			return indexOf(this, target);
		},

		innerHeight: function() {
			/// @TODO:
		},

		innerWidth: function() {
			/// @TODO:
		},

		insertAfter: function(target) {
			jQuery(target).after(this);
			return this;
		},

		insertBefore: function(target) {
			jQuery(target).before(this);
			return this;
		},

		is: function() {
			/// @TODO:
		},

		last: function() {
			return this.eq(-1);
		},

		map: function() {
			/// @TODO:
		},

		next: function() {
			var result = jQuery();
			foreach(this, function(el) {
				do {
					el = el.nextSibling;
				} while(el && el.nodeType !== ELEMENT_NODE);
				el && result.add(el);
			});
			return result;
		},

		nextAll: function() {
			/// @TODO:
		},

		nextUntil: function() {
			/// @TODO:
		},

		not: function() {
			/// @TODO:
		},

		off: function() {
			/// @TODO:
		},

		offset: function() {
			/// @TODO:
		},

		offsetParent: function() {
			/// @TODO:
		},

		on: function(eventType, handler) {
			if (arguments.length === 1) {
				var self = this;
				foreach(eventType, function(handler, eventType) {
					self.bind(eventType, handler);
				});
				return this;
			}

			eventType = eventType.split(regexp_whitespace);
			return foreach(this, function(el) {
				foreach(eventType, function(eventType) {
					addEvent(el, eventType, handler);
				});
			});
		},

		one: function(eventType, handler) {
			if (arguments.length === 1) {
				var self = this;
				foreach(eventType, function(handler, eventType) {
					self.one(eventType, handler);
				});
				return this;
			}

			eventType = eventType.split(regexp_whitespace);
			return foreach(this, function(el) {
				foreach(eventType, function(eventType) {
					var fn = function() {
						handler.apply(el, arguments);
						removeEvent(el, eventType, fn);
					};
					addEvent(el, eventType, fn);
				});
			});
		},

		outerHeight: function() {
			/// @TODO:
		},

		outerWidth: function() {
			/// @TODO:
		},

		parent: function() {
			var result = jQuery();
			foreach(this, function(el) {
				result.add(el.parentNode);
			});
			return result;
		},

		parents: function() {
			var result = jQuery();
			foreach(this, function(el) {
				while(el.parentNode && el.parentNode.nodeType !== 9) {
					result.add(el.parentNode);
					el = el.parentNode;
				}
			});
			return result;
		},

		parentsUntil: function() {
			/// @TODO:
		},

		position: function() {
			if (this[0] === undefined) return {top:0, left:0};
			return {top: this[0].offsetTop, left: this[0].offsetLeft};
		},

		prepend: function() {
			var args = arguments;
			return foreach(this, function(el) {
				var frag = makeFragment(args);
				el.firstChild ? el.insertBefore(frag, el.firstChild) : el.appendChild(frag);
			});
		},

		prependTo: function(target) {
			jQuery(target).prepend(this);
			return this;
		},

		/// @TODO: previousElementSibling
		prev: function() {
			var result = jQuery();
			foreach(this, function(el) {
				do { el = el.previousSibling; }
				while(el && el.nodeType !== ELEMENT_NODE);
				el && result.add(el);
			});
			return result;
		},

		prop: function(propertyName, value) {
			if (arguments.length === 1) {
				return this[0] ? this[0][propertyName] : undefined;
			}

			if (arguments.length === 2) {
				return foreach(this, function(el) {
					el[propertyName] = value;
				});
			}
		},

		remove: function() {
			return foreach(this, function(el) {
				removeNode(el);
			});
		},

		removeAttr: function(attributeName) {
			return foreach(this, function(el) {
				el.removeAttribute(attributeName);
			});
		},

		removeClass: function(className) {
			return foreach(this, function(el) {
				removeClass(el, className);
			});
		},

		removeData: function() {
			/// @TODO:
		},

		replaceAll: function(target) {
			jQuery(target).replaceWith(this);
			return this;
		},

		replaceWith: function() {
			var args = arguments;
			return foreach(this, function(el) {
				el.parentNode && el.parentNode.replaceChild(makeFragment(args), el);
			});
		},

		removeProp: function(propertyName) {
			return foreach(this, function(el) {
				try { delete el[propertyName] }
				catch(e) { el[propertyName] = undefined; }
			});
		},

		scrollLeft: function(value) {
			if (arguments.length === 0) return this.prop("scrollLeft");
			if (arguments.length === 1) return this.prop("scrollLeft", value);
		},

		scrollTop: function(value) {
			if (arguments.length === 0) return this.prop("scrollTop");
			if (arguments.length === 1) return this.prop("scrollTop", value);
		},

		scrollParent: function() {
			var ret = $();
			if (this.length === 0) return ret;

			var el = this[0];
			while(el = el.parentNode) {
				if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
					return ret.add(el);
				}
			}
			return ret;
		},

		show: function() {
			return foreach(this, function(el) {
				show(el);
			});
		},

		siblings: function() {
			var result = jQuery();
			foreach(this, function(el) {
				foreach(el.parentNode.childNodes, function(node) {
					node.nodeType === ELEMENT_NODE && result.add(node);
				});
			});
			return result;
		},

		slice: function() {
			return jQuery(Array.prototype.slice.apply(this, arguments));
		},

		text: function(value) {
			if (arguments.length === 0) {
				var el = this[0];
				return el[el.nodeType === 1 ? "innerText" : "nodeValue"];
			}

			return foreach(this, function(el) {
				el[el.nodeType === 1 ? "innerText" : "nodeValue"] = value;
			});
		},

		toggle: function() {
			/// @TODO:
		},

		toggleClass: function(className) {
			return foreach(this, function(el) {
				hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
			});
		},

		trigger: function(type, props) {
			foreach(this, function(node) {
				dispatchEvent(node, type, props);
			});
			return this;
		},

		triggerHanlder: function() {
			/// @TODO:
		},

		unwrap: function() {
			/// @TODO:
		},

		val: function(value) {
			if (arguments.length === 0) return this.prop("value");
			if (arguments.length === 1) return this.prop("value", value);
		},

		width: function() {
			/// @TODO:
		},

		wrap: function() {
			/// @TODO:
		},

		wrapAll: function() {
			/// @TODO:
		},

		wrapInner: function() {
			/// @TODO:
		}
	});

	return jQuery;
}]);

