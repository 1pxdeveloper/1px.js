(function(window, document, undefined) {

	if (document.registerElement) {
		return;
	}

	var def = {};
	document.registerElement = function(tagName, option) {
		def[tagName] = option;
	};
	document.registerElement.polyfill = true;


	function getRegisteredElement(element) {
		var tagName = element.tagName.toLowerCase();
		return def[tagName] || def[element.getAttribute("is")];
	}

	function upgrade(element) {
		if (!element) {
			return;
		}

		if (!element.tagName) {
			return;
		}

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

	var createElement = document.createElement;
	document.createElement = function() {
		var element = createElement.apply(document, arguments);
		upgrade(element);
		return element;
	};

	function attached(element) {
		if (element.isAttached) {
			return;
		}

		upgrade(element);

		if (element && typeof element.attachedCallback === "function") {
			element.isAttached = true;
			element.attachedCallback();
		}
	}

	function detached(element) {
		if (!element.isAttached) {
			return;
		}

		if (element && typeof element.detachedCallback === "function") {
			element.isAttached = false;
			element.detachedCallback();
		}
	}

	function subTreeUpgrade(node) {
		$traversal(node, [], function(element) {
			upgrade(element);
		});
	}

	function subTreeAttached(node) {
		$traversal(node, [], function(element) {
			attached(element);
		});
	}

	function subTreeDetached(node) {
		$traversal(node, [], function(element) {
			detached(element);
		});
	}

	///
	var appendChild = Element.prototype.appendChild;
	Element.prototype.appendChild = function(node) {

		if (this.lastChild === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traversal(node, null, function(el) {
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

	var insertBefore = Element.prototype.insertBefore;
	Element.prototype.insertBefore = function(node, refNode) {

		if (refNode.previousSibling === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traversal(node, null, function(el) {
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


	var replaceChild = Element.prototype.replaceChild;
	Element.prototype.replaceChild = function(node, refNode) {

		if (refNode === node) {
			return node;
		}

		var subNodes = [];
		if (document.documentElement.contains(this)) {
			$traversal(node, null, function(el) {
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


	var removeChild = Element.prototype.removeChild;
	Element.prototype.removeChild = function(node) {

		var ret = removeChild.apply(this, arguments);
		detached(node);

		return ret;
	};

	/// @NOTE: safari의 경우 cloneNode를 할 경우 template이 복사되지 않는 버그(?)가 있다.
	function cloneNode(node) {
		var result = node.cloneNode(node, false);
		result.innerHTML = node.innerHTML;
		return result;
	}

	function cloneFragment(node) {
		var result = document.createDocumentFragment();
		foreach(node.childNodes, function(node) {
			result.appendChild(cloneNode(node));
		});
		return result;
	}

	var importNode = document.importNode;
	document.importNode = function(externalNode, deep) {

		var node = importNode.call(this, externalNode, false);

		if (deep === true) {
			if (node.nodeType === 1 || node.nodeType === 9) {
				node.innerHTML = externalNode.innerHTML;
			}
			else if (node.nodeType === 11) {
				node.appendChild(cloneFragment(externalNode));
			}
		}

		subTreeUpgrade(node);
		return node;
	};

	document.addEventListener("DOMContentLoaded", function() {
		Promise.all(document.importNode.promise || []).then(function() {
			subTreeAttached(document.body);
		});
	});

})(window, document);

