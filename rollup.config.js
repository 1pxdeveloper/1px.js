import path from "path";


function localResolver() {
	return {
		name: "localResolver",
		resolveId: function(importee, importer) {
			if (!importer) {
				return null;
			}

			if (importee.indexOf('./') === -1) {
				return null;
			}

			if (importee.endsWith(".js")) {
				return null;
			}

			return path.join(path.dirname(importer), importee, 'index.js');
		}
	};
}


export default {
	input: './1px.js/src/1px.js',

	plugins: [
		localResolver()
	],

	output: {
		file: './1px.js/dist/1px.js',
		format: 'iife',
	}
}