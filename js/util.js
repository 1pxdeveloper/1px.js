module.directive("focus()", function() {
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