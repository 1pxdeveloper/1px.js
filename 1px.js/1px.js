(function() {
	let script = Array.from(document.querySelectorAll("script")).pop();
	let src = script.getAttribute("src");
	let pref = src.slice(0, -"1px.js".length);

	let exports = Object.create(null);
	window.exports = exports;
	window.require = (path) => exports;

	[
		"observable.js",
		"1px.module.js",
		"utils.js",
		"parse.js",
		"compile.js",
		"directives.js",
		"component.js",
		"batch.js",
		"1px.touch.js",
		// "import.js"

	].forEach(src => {
		document.write(`<script src="${pref}${src}"></script>`);
	});
	
})();