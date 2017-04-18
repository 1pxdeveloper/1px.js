$module("1px").factory("REST", ["$http", function($http) {
	"use strict";

	function REST(url) {
		this.url = url;
	}
	REST.prototype = {
		get: function() {
			return $http.get(this.url);
		},
		post: function() {
			return $http.post(this.url);
		}
	};

	return REST;
}]);