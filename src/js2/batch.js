(function() {
	"use strict";
	
	
	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..
	
	
	const {Observable} = require("./observable");
	const {$module} = require("./module");
	const {WebComponent} = require("./component");
	
	window.Observable = Observable;
	window.$module = $module;
	

	$module.value("WebComponent", WebComponent);
	
	$module.component = function(name, block) {
		if (!name) {
			throw TypeError("name is String..")
		}
		
		name = name.toLowerCase();
		WebComponent.template.tagName = name;
		
		$module.require(block, component => {
			window.customElements.define(name, component);
		});
	}
	

	/// 이건 너무 별론데...
	
	const {JSContext} = require("./parse");
	$module.value("JSContext", JSContext);
	
	
})();