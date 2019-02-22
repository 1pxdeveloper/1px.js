document.querySelectorAll("link[type=module]").forEach(link => {
	window.customElements.whenDefined("web-component").then(() => {
		fetch(link.href).then(res => res.text()).then(html => {
			let el = document.createElement("body");
			el.innerHTML = html;

			el.querySelectorAll("script").forEach(script => {
				Function(script.innerText)();
			})
		});
	});
});