(function(window, document, undefined) {

	if ("import" in document.createElement("link")) {
		return;
	}


	var promise = [];
	var complete = false;
	document.addEventListener("readystatechange", function(e) {
		if (complete) {
			return;
		}
		complete = true;

		var links = document.querySelectorAll("link[rel='import']");
		foreach(links, function(link) {

			var p = fetch(link.href).then(function(res) {
				return res.text()
			}).then(function(text) {

				var frag = document.createDocumentFragment();
				var html = document.createElement("html");
				html.innerHTML = text;

				var scripts = html.querySelectorAll("script");
				foreach(scripts, function(script) {
					var s = document.createElement("script");
					s.innerHTML = script.innerHTML;
					frag.appendChild(s);
				});

				var s = document.getElementsByTagName("script");
				s = s[s.length-1];
				s.parentNode.insertBefore(frag, s);

				document.importNode(html, true);
			});

			promise.push(p);
		});

		document.importNode.promise = promise;
	});

})(window, document);
