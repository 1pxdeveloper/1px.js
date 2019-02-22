let express = require("express");

let {Observable} = require("./src/js/observable");
let {JSContext} = require("./src/js/parse");


let app = express();

app.get("/", function(req, res) {
	res.send("hello");
});

app.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});
