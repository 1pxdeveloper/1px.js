app.factory("FileUploader", function(http) {

	var self = {};

	return {
		upload: function(option) {
			option = option || {};

			if (self.input) {
				document.createDocumentFragment().appendChild(self.input);
			}

			var input = document.createElement("input");
			input.style.position = "absolute";
			input.style.opacity = 0;
			input.type = "file";

			if (option.multiple) {
				input.multiple = true;
			}

			self.input = input;

			return new Promise(function(resolve) {
				input.onchange = function() {
					resolve(input.files);
				};

				document.body.onfocus = function() {
					document.body.onfocus = null;
				};

				document.body.appendChild(input);
				input.click();

			}).then(function(files) {
					var promise = [];

					foreach(files, function(file) {

						console.log(file);

						promise.push(new Promise(function(resolve) {
							var reader = new FileReader();

							var res = new http.Image;
							res.name = file.name;
							res.type = file.type;

							reader.onload = function(readerEvt) {
								res.src = readerEvt.target.result;
								resolve(res);
							};

							reader.readAsDataURL(file);
						}));
					});

					return Promise.all(promise);

				}).then(function(res) {
					document.body.removeChild(input);
					return option.multiple ? res : res[0];
				});
		}
	}
});