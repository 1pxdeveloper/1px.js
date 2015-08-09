(function(DOMContentLoaded, $compile) {

	var style = document.createElement("style");
	var cssText = "body * {opacity:0; filter:alpha(opacity=0);}";
	style.setAttribute("type", "text/css");
	style.styleSheet ? (style.styleSheet.cssText = cssText) : (style.innerHTML = cssText);
	document.documentElement.firstChild.appendChild(style);

	DOMContentLoaded(function() {
		try {
			$compile(document);
			document.update();
		} finally {
			style.parentNode.removeChild(style);
		}
	});

})($module("1px").require("DOMContentLoaded"), $module("1px").require("$compile"));
