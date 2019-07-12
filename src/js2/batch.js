(function() {
	"use strict";
	
	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..
	
	
	const {$module} = require("./1px.module");
	const {Observable} = require("./observable");
	const {WebComponent} = require("./component");
	
	window.Observable = Observable;
	window.$module = $module;
	
	$module.value("Observable", Observable);
	
	$module.value("WebComponent", WebComponent);
	
	$module.component = function(name, block) {
		if (!name) {
			throw TypeError("name is String..")
		}
		
		block.tagName = name.toLowerCase();

		$module.require(block, component => {
			window.customElements.define(name, component);
			delete WebComponent.template.tagName;
		});
	};
	
	
	/// 이건 너무 별론데...
	const {JSContext} = require("./parse");
	$module.value("JSContext", JSContext);
})();