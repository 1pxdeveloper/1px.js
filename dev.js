const path = require('path');

const gulp = require('gulp');

const express = require("express");
const app = express();
require("express-ws")(app);


app.use("/dist", express.static(__dirname + '/dist'));
app.use(express.static(__dirname + '/public'));


app.ws('/', function(ws, req) {
	ws.on('message', function(msg) {
		console.log(msg);
	});
});

app.listen(5555, () => {
	console.log("app listen")
});