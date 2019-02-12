module.directive("focus()", function() {

	return function(scope, el, script) {
		scope.watch$(script, function(bool) {
			if (bool) {
				el.focus();
			}
		});
	}
});
