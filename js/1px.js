(function() {
	let script = Array.from(document.querySelectorAll("script")).pop();
	let src = script.getAttribute("src");
	let pref = src.slice(0, -"1px.js".length);

	window.exports = window;
	window.require = () => window;

	[
		"observable.js",
		"module.js",
		"parse.js",
		"compile.js",
		"component.js",
		"util.js"
	].forEach(src => {
		document.write(`<script type="module" src="${pref}${src}"></script>`);
	});
})();

