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
	input: './src/1px.js.esm/index.js',
	
	plugins: [
		localResolver()
	],
	
	output: [
		{
			name: "_px",
			file: './dist/1px.js',
			format: 'iife'
		},
		
		{
			file: './dist/1px.esm.js',
			format: 'esm'
		}
	]
}