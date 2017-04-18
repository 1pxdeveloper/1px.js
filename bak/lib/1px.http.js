$module("1px").factory("$http", ["Promise", function(Promise) {
	"use strict";

	function $http(method, url, args) {
		return new Promise(function(resolve, reject) {
			var http = new XMLHttpRequest();
			var uri = url;
			var params;

			if (method !== "GET" && method !== "POST") {
				http.setRequestHeader("X-HTTP-Method-Override", method);
			}

			if (method !== "GET") {
				http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
				params = JSON.stringify(args);
			} else {
				params = null;
			}

			http.open(method, url);

			http.onload = function() {
				if (this.status === 200) {
					resolve(this.response);
				}
				else {
					reject(Error(this.statusText));
				}
			};

			http.onerror = function () {
				reject(Error(this.statusText));
			};

			http.send(params);
		})
	}

	$http.get = function(url, params) {
		return $http("GET", url, params);
	};

	$http.post = function(url, params) {
		return $http("POST", url, params);
	};

	$http.put = function(url, params) {
		return $http("PUT", url, params);
	};

	$http["delete"] = function(url, params) {
		return $http("DELETE", url, params);
	};

	$http.head = function(url, params) {
		return $http("HEAD", params);
	};

	return $http;
}]);