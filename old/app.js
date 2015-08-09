/*
 @TODO: 기존에 만들었던 것을 전부 참조해서 모듈로 만들자.
 ex)
 1. 팝업, 배너, 슬라이드쇼, 달력UI(예단연), selectable(관리자), 탭 기능
 2. UI 드래그 & 드롭! (미모사)
 3. UI 에니메이션(window.requestFrame?), CSS 에니메이션(angular)
 4. 그래서 관리자 & 미모사 부터 만들어보자. 미모사 에디터
 5. keyboard shortcut
 6. http(ajax), ndb(REST API), Storage(localStorage, cookie, etc)
 7. Promise, Promise Chain
 8. Formatting, Filter
 9. FileUploader, ImageUploader
 10. Facebook 등 소셜 로그인
 11. Image-Ratio-Box (가제..), @background-image
 12. Calaner Input, 기타 Input UI Wrapper
 */


var app = $module("app", ["1px", "ui"]);

$module("ui", []).factory("$popup", ["$rootScope", function($rootScope) {

	function popup(template, scope) {
		popup.template = template;
		popup.scope = scope;
	}

	popup.close = function() {
		popup("")
	};

	$rootScope.$popup = popup;

	return popup;
}]);


app.controller("ViewController", function(self, $rootScope, $popup, $timeout) {
	return {
		init: function() {
			$rootScope.hello2 = "HELLO2";

			self.tabs = ["tab1", "tab2", "tab3"];
			self.hello = "HELLO, WORLD";
			self.color = "blue";

			$popup("popup-test");

			$timeout(function() {
				$popup.close();
			}, 1000)
		},

		click: function(msg) {
			alert(msg);
			self.color = "red";
		}
	}
});


app.controller("ViewController", function($scope, $rootScope, $popup, $timeout) {
	var self = $scope;
	return {
		init: function() {
			$rootScope.hello2 = "HELLO2";

			self.tabs = ["tab1", "tab2", "tab3"];
			self.hello = "HELLO, WORLD";
			self.color = "blue";

			$popup("popup-test");

			$timeout(function() {
				$popup.close();
			}, 1000)
		},

		click: function(msg) {
			alert(msg);
			self.color = "red";
		}
	}
});