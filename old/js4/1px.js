(function() {
	let script = Array.from(document.querySelectorAll("script")).pop();
	let src = script.getAttribute("src");
	let pref = src.slice(0, -"1px.js4".length);

	let exports = Object.create(null);
	window.exports = exports;
	window.require = (path) => exports;

	[
		"observable.js4",
		"module.js4",
		"parse.js4",
		"compile.js4",
		"component.js4",
		"util.js4",
		"import.js4"
	].forEach(src => {
		document.write(`<script type="module" src="${pref}${src}"></script>`);
	});
})();

