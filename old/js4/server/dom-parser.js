console.log("dom-parser");


class $Node {
	constructor() {
		this.parentNode = null;
		this.nodeName = null;
		this.nodeValue = null;
		this.nodeType = null;
		this.childNodes = [];
	}

	get firstChild() {
		return this.childNodes[0];
	}

	// @FIXME:
	get nextSibling() {
		try {
			return this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this) + 1];
		} catch (e) {
			return null;
		}
	}

	// @TODO:
	cloneNode() {
		return Object.create(this);
	}

	insertBefore(newNode, referenceNode) {
		this.childNodes.splice(this.childNodes.indexOf(referenceNode) - 1, 0, newNode);
		return newNode;
	}
}

class $Attr extends $Node {

}

class $Element extends $Node {
	constructor() {
		super();
		this.nodeType = 1;
		this.tagName = null;
		this.attrs = [];
		this.outerHTML = "";
	}

	get attributes() {
		return this.attrs;
	}

	hasAttribute(attrName) {
		return attrName in this.attrs;
	}

	getAttribute(attrName) {
		return this.attrs[attrName];
	}

	removeAttribute(attrName) {
		this.attrs.splice()
	}

	appendChild(node) {
		node.parentNode = this;
		this.childNodes.push(node);
	}

	before(newNode) {
		return this.parentNode.insertBefore(newNode, this);
	}

	replaceWith(newNode) {
		this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this)] = newNode;
		return newNode;
	}

	addEventListener() {

	}

	removeEventListener() {

	}
}

class $Text extends $Node {
	constructor(data) {
		super();
		this.nodeType = 3;
		this.nodeValue = data;
	}

	/// @TODO
	splitText(index) {
		let text = new $Text();
		text.nodeValue = this.nodeValue.slice(0, index);
		return text;
	}
}

function createElement(tagName) {
	let e = new $Element();
	e.tagName = tagName.trim();
	return e;
}

let tagName = /(\/?)([^>\s]+)/.source;
let tagAttrs = /((?:\s[^>]*)?)(\/)?/.source;
let comment = /([<]!--(?:.*?)-->)/.source;
let tag_re = new RegExp(`${comment}|(<${tagName}${tagAttrs}>)|[^<]*|.`, "g");
let attrs_re = /\s*([^=\s]+)\s*(?:=\s*(?:'([^']+)'|"([^"]+)"|([^\s]+))\s*)?/g;

function parseDOM(html) {

	let root = new $Element();
	root.tagName = "#root";
	let stack = [root];

	html.replace(tag_re, function(nodeValue, comment, outerHTML, closed, tagName, attrs) {
		if (comment) {
			return nodeValue;
		}

		/// Element Node
		if (tagName) {

			let parent = stack[stack.length - 1];

			if (parent.nodeType === 3) {
				stack.pop();
				parent = stack[stack.length - 1];
			}

			if (parent.tagName === "script" && !(tagName === "script" && closed)) {
				// console.log("script!", args);
				return nodeValue;
			}

			if (parent.tagName === "style" && !(tagName === "style" && closed)) {
				// console.log("style!", args);
				return nodeValue;
			}

			if (closed) {
				// @TODO: 같은 태그 이름이 나올때 까지 닫는게 맞는거...
				stack.pop();
				return nodeValue;
			}


			let el = createElement(tagName);
			el.outerHTML = outerHTML;

			if (attrs) {
				el.attrs = [];
				let index = 0;
				attrs.replace(attrs_re, function(a, name, str1, str2, value) {
					let attr = new $Attr();
					attr.nodeName = name;
					attr.nodeValue = str1 || str2 || value || "";
					el.attrs[index++] = el.attrs[name] = attr;
				});
			}

			parent.appendChild(el);


			// void Elements
			switch (tagName.toLowerCase()) {
				case "meta":
				case "link":
				case "input":
				case "hr":
					return nodeValue;
			}

			// !doctype ...
			if (tagName[0] === "!") {
				el.nodeType = 9;
				return nodeValue;
			}

			stack.push(el);
			return nodeValue;
		}

		/// Text Node
		if (!tagName) {
			let parent = stack[stack.length - 1];

			if (parent instanceof $Text) {
				parent.textContent += nodeValue;
			} else {
				let t = new $Text(nodeValue);
				parent.appendChild(t);
				stack.push(t);
			}
		}

		return nodeValue;
	});

	return root;
}


function render(e, tab) {
	switch (e.nodeType) {
		case 1:
			console.log(tab + e.outerHTML, e.tagName, e.attrs);
			e.childNodes.forEach(c => render(c, tab + "  "));
			console.log(tab + "</" + e.tagName + ">");
			break;

		case 3:
			if (e.nodeValue == true) {
				console.log(tab + e.nodeValue);
			}
			break;
	}
}


exports.Node = $Node;
exports.Element = $Element;
exports.Text = $Text;
exports.parseDOM = parseDOM;
exports.render = render;