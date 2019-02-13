module.directive(".focus()", function() {
	return function(scope, el, script) {
		scope.watch$(script, function(bool) {
			if (bool) {
				el.focus();
			}
		});
	}
});


module.pipe("html", function() {
	return function(value) {
		if (value === undefined) value = "";
		let h = document.createElement("div");
		h.innerHTML = String(value);
		return DocumentFragment.from(h.childNodes);
	}
});


/// @FIXME: 이거 쓰게 될까??
function $clone(obj, weakMap) {
	if (Object(obj) !== obj) {
		return obj;
	}

	if (obj === window || obj === document) {
		return obj;
	}

	weakMap = weakMap || new WeakMap();
	let o = weakMap.get(obj);
	if (o) {
		return o;
	}

	o = Object.create(Object.getPrototypeOf(obj));
	weakMap.set(obj, o);

	Object.keys(obj).forEach(prop => {
		o[prop] = $clone(obj[prop], weakMap);
	});

	return o;
}