(function(DOMContentLoaded, $compile) {

	DOMContentLoaded(function() {
		$compile(document);
		document.update();
	});

})($module("1px").require("DOMContentLoaded"), $module("1px").require("$compile"));
