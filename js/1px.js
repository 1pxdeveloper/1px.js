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
		"util.js"
	].forEach(src => {
		document.write(`<script type="module" src="${pref}${src}"></script>`);
	});


	document.querySelectorAll("link[type=module]").forEach(link => {

		let queue = [];

		function commit() {

			console.log(queue);


			if (exports.customElementsDefine) {
				while (queue.length) {
					exports.customElementsDefine.call(queue.shift());
				}
			}
		}

		fetch(link.href).then(res => res.text()).then(html => {

			let el = document.createElement("body");
			el.innerHTML = html;
			el.querySelectorAll("web-component").forEach(def => queue.push(def));

			commit();
			document.addEventListener("DOMContentLoaded", commit);
			window.addEventListener("load", commit);
		});
	})
})();

