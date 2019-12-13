import {$module} from "../1px.js";


$module.component("app-test", function(WebComponent) {
	
	console.log("@@@@@@@@@@");
	
	
	//language=HTML
	this.templateHTML = `
		<template>
			<h1>{{ title }}</h1>
		</template>
	`;
	
	return class extends WebComponent {
		init($) {
			this.title = "title";
		}
	}
});