module.require(function($traverse) {

	if (document.registerElement) {
		return;
	}

	var def = {};
	document.registerElement = function(tagName, option) {
		def[tagName] = option;
	};
	document.registerElement.polyfill = true;


	function getRegisteredElement(element) {
		if (!element || !element.tagName) {
			return;
		}

		var tagName = element.tagName.toLowerCase();
		return def[tagName] || def[element.getAttribute("is")];
	}

	function created(element) {
		var definition = getRegisteredElement(element);
		if (!definition) {
			return;
		}

		if (element.__proto__ === definition.prototype) {
			return;
		}

		element.__proto__ = definition.prototype;
		if (element && typeof element.createdCallback === "function") {
			element.createdCallback();
		}
	}

	function attached(element) {
		if (element.$isAttached) {
			return;
		}

		created(element);
		element.$isAttached = true;

		if (element && typeof element.attachedCallback === "function") {
			element.attachedCallback();
		}
	}

	function detached(element) {
		if (!element.$isAttached) {
			return;
		}

		element.$isAttached = false;
		if (element && typeof element.detachedCallback === "function") {
			element.detachedCallback();
		}
	}


	/// Override DOM function
	var createElement = document.createElement;
	document.createElement = function() {
		var element = createElement.apply(this, arguments);
		created(element);
		return element;
	};


	var cloneNode = Element.prototype.cloneNode;
	Element.prototype.cloneNode = function() {
		var element = cloneNode.apply(this, arguments);
		created(element);
		return element;
	};

	/// Element.prototype.appendChild;
	var appendChild = Element.prototype.appendChild;
	Element.prototype.appendChild = function(node) {
		if (this.lastChild === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traverse(node, function(el) {
				subNodes.push(el);
			});
		}

		var ret = appendChild.apply(this, arguments);
		foreach(subNodes, function(el) {
			detached(el);
			attached(el);
		});

		return ret;
	};

	/// Element.prototype.insertBefore
	var insertBefore = Element.prototype.insertBefore;
	Element.prototype.insertBefore = function(node, refNode) {
		if (refNode.previousSibling === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traverse(node, function(el) {
				subNodes.push(el);
			});
		}

		var ret = insertBefore.apply(this, arguments);
		foreach(subNodes, function(el) {
			detached(el);
			attached(el);
		});

		return ret;
	};


	/// Element.prototype.replaceChild
	var replaceChild = Element.prototype.replaceChild;
	Element.prototype.replaceChild = function(node, refNode) {
		if (refNode === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traverse(node, function(el) {
				subNodes.push(el);
			});
		}

		var ret = replaceChild.apply(this, arguments);
		foreach(subNodes, function(el) {
			detached(el);
			attached(el);
		});

		detached(refNode);
		return ret;
	};


	/// Element.prototype.removeChild
	var removeChild = Element.prototype.removeChild;
	Element.prototype.removeChild = function(node) {
		var ret = removeChild.apply(this, arguments);
		if (document.documentElement.contains(this)) {
			detached(node);
		}
		return ret;
	};


	/// Element.prototype.innerHTML
	var desc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
	if (desc) {
		var _set = desc.set;
		desc.set = function() {
			var contains = document.documentElement.contains(this);
			if (contains) {
				var self = this;
				$traverse(this, function(node) {
					if (node !== self) {
						detached(node);
					}
				});
			}

			var ret = _set.apply(this, arguments);
			if (contains) {
				$traverse(this, function(node) {
					if (node !== self) {
						detached(node);
						attached(node);
					}
				});
			}
			return ret;
		};
		Object.defineProperty(Element.prototype, "innerHTML", desc);
	}


	/// document.importNode
	// @NOTE: safari의 경우 cloneNode를 할 경우 template이 복사되지 않는 버그(?)가 있다.
	function cloneNodeDeep(node) {
		var result = node.cloneNode(false);
		result.innerHTML = node.innerHTML;
		return result;
	}

	function cloneFragmentDeep(node) {
		var result = document.createDocumentFragment();
		foreach(node.childNodes, function(node) {
			result.appendChild(cloneNodeDeep(node));
		});
		return result;
	}

	/// importNode polyfill
	var test = document.createElement("div");
	test.innerHTML = "<span>123</span>";
	var d = document.importNode(test, true);

	if (test.innerHTML !== d.innerHTML) {
		var importNode = document.importNode;
		document.importNode = function(externalNode, deep) {
			var node = importNode.call(this, externalNode, false);
			if (deep === true) {
				if (node.nodeType === 1 || node.nodeType === 9) {
					node.innerHTML = externalNode.innerHTML;
				}
				else if (node.nodeType === 11) {
					node.appendChild(cloneFragmentDeep(externalNode));
				}
			}
			return node;
		};

		$traverse(result, function(element) {
			created(element);
		});
	}

	// importNode = document.importNode;
	// document.importNode = function(externalNode, deep) {
	// 	var result = importNode.apply(this, arguments);
	// 	$traverse(result, function(element) {
	// 		created(element);
	// 	});
	// 	return result;
	// };

	function HTMLimport() {
		if ("import" in document.createElement("link")) {
			return;
		}

		var promise = document.importNode.promise = [];
		var links = document.querySelectorAll("link[rel='import']");
		foreach(links, function(link) {
			var p = fetch(link.href).then(function(res) {
				return res.text()
			}).then(function(text) {
				var frag = document.createDocumentFragment();
				var template = document.createElement("template");
				template.innerHTML = text;

				var scripts = template.content.querySelectorAll("script");
				foreach(scripts, function(script) {
					var s = document.createElement("script");
					s.innerHTML = script.innerHTML;
					frag.appendChild(s);
				});
				document.getElementsByTagName("head")[0].appendChild(frag);

				$traverse(template.content, function(element) {
					created(element);
				});
			});

			promise.push(p);
		});
	}

	document.addEventListener("DOMContentLoaded", function() {
		HTMLimport();

		Promise.all(document.importNode.promise || []).then(function() {
			$traverse(document.body, function(element) {
				attached(element);
			});
		});
	});
});


(function(window, document, undefined) {

	if ("import" in document.createElement("link")) {
		return;
	}


	var promise = [];
	var complete = false;
	document.addEventListener("readystatechange", function(e) {
		if (complete) {
			return;
		}
		complete = true;

		var links = document.querySelectorAll("link[rel='import']");
		foreach(links, function(link) {

			var p = fetch(link.href).then(function(res) {
				return res.text()
			}).then(function(text) {

				var frag = document.createDocumentFragment();
				var html = document.createElement("html");
				html.innerHTML = text;

				var scripts = html.querySelectorAll("script");
				foreach(scripts, function(script) {
					var s = document.createElement("script");
					s.innerHTML = script.innerHTML;
					frag.appendChild(s);
				});

				var s = document.getElementsByTagName("script");
				s = s[s.length - 1];
				s.parentNode.insertBefore(frag, s);

				document.importNode(html, true);
			});

			promise.push(p);
		});

		document.importNode.promise = promise;
	});

})(window, document);
