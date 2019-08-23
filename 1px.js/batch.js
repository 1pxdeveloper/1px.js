(function() {
	"use strict";

	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..

	const {$module} = require("./1px.module");
	const {Observable, Subject, AsyncSubject} = require("./observable");
	const {WebComponent} = require("./component");

	function DOMReady(callback) {
		if (document.readyState === "complete") return callback();
		document.addEventListener("DOMContentLoaded", callback);
	}

	window.Observable = Observable;
	window.$module = $module;

	$module.value("Observable", Observable);
	$module.value("Subject", Subject);
	$module.value("AsyncSubject", AsyncSubject);

	$module.value("WebComponent", WebComponent);

	$module.component = function(name, block) {
		if (!name) {
			throw TypeError("name must be string.")
		}

		let tagName = name.toLowerCase();
		block = $module._makeInjectable(block);

		function preload() {
			WebComponent.template.tagName = tagName;
			let ret = block.apply(null, arguments);
			delete WebComponent.template.tagName;
			return ret;
		}

		preload.$inject = block.$inject;


		$module.require(preload, component => {
			// console.log(component);
			component = component || class extends WebComponent {};
			DOMReady(() => window.customElements.define(name, component));
		});
	};


	/// 이건 너무 별론데...
	const {JSContext, $compile} = require("./compile");
	$module.value("JSContext", JSContext);
	$module.compile = $compile;

	$module.controller = function(name, block) {
		$module.require(block, controller => {
			DOMReady(() => {
				Array.from(document.querySelectorAll(`*[is="${name}"]`)).forEach(el => {
					Object.assign(el, controller);

					let context = JSContext.connect(el);
					$compile(el, context);
					el.init && el.init(context);
				})
			})
		})
	};


})();