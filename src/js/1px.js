(function() {
	let script = Array.from(document.querySelectorAll("script")).pop();
	let src = script.getAttribute("src");
	let pref = src.slice(0, -"1px.js".length);

	let exports = Object.create(null);
	window.exports = exports;
	window.require = (path) => exports;

	[
		"observable.js",
		"module.js",
		"parse.js",
		"compile.js",
		"component.js",
		"util.js",
		"import.js"
	].forEach(src => {
		document.write(`<script type="module" src="${pref}${src}"></script>`);
	});
})();

