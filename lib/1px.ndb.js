$module("ndb", ["1px"]).factory("ndb", [function() {
	"use strict";

	var queue = [[]];
	var memcache = {};

	function readLocalStorage(key) {
		return window.localStorage && window.localStorage.getItem(key);
	}

	function writeLocalStorage(key, value) {
		return window.localStorage && window.localStorage.setItem(key, value)
	}

	function clearLocalStorage(key, value) {
		return window.localStorage && window.localStorage.clear();
	}

	function defaults(source, extend) {
		var key;
		var _defaults = ndb.defaults() || {};
		for (key in _defaults) {
			if (source[key] == null && _defaults.hasOwnProperty(key)) {
				source[key] = _defaults[key]
			}
		}

		if (!extend) return;
		for (key in extend) {
			if (source[key] == null && extend.hasOwnProperty(key)) {
				source[key] = extend[key]
			}
		}
	}

	function makeArray(obj) {
		return Array.prototype.slice.call(obj);
	}

	function request(type, url, params, callback) {
		var http = new XMLHttpRequest();
		var async = typeof callback === "function";
		var result;

		http.open(type, url, async);

		if (type === "PUT" || type === "DELETE") {
			http.setRequestHeader("X-HTTP-Method-Override", type);
		}

		if (type === "PUT" || type === "POST") {
			http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
			params = JSON.stringify(params);
		} else {
			params = null;
		}


		http.onreadystatechange = function(e) {
			var etag, key, flag;

			if (http.readyState !== 4) {
				return;
			}

			if (type === "GET" && this.status === 200) {
				etag = this.getResponseHeader("etag");
				key = url + " " + etag;

				if (memcache[key] === undefined) {
					memcache[key] = readLocalStorage(key) || "";
				}

				try {
					result = JSON.parse(memcache[key])
				} catch(e) {
					clearLocalStorage();
				}
			}


			try {
				result = JSON.parse(this.responseText);
			} catch(e) {
				console.log(e);
				return {error:"invalid json", response: this.responseText};
			}

			if (type === "GET" && this.status === 200) {
				writeLocalStorage(key, (memcache[key] = this.responseText))
			}

			callback && callback(result, 200);
		};

		http.send(params);
		return result;
	}

	function build_query(params) {
		var result = [];
		for(var key in params) {
			if (params.hasOwnProperty(key)) {
				result.push(encodeURIComponent(key)+"="+encodeURIComponent(params[key]));
			}
		}

		if (result.length === 0) {
			return "";
		}

		return "?"+result.join("&");
	}

	function build_arguments(args) {
		var paths = [];
		var params = {};
		var callback = null;

		args = makeArray(args);
		for (var i = 0, len = args.length; i < len; i++) {
			var val = args[i];
			switch(typeof val) {
				case "number":
				case "string":
					paths.push(val);
					break;

				case "function":
					callback = val;
					break;

				default:
					params = val;
			}
		}

		if (callback === ndb.async) {
			callback = ndb.async(queue[0], queue[0].count);
		}

		return {
			path: paths.length > 0 ? "/" + paths.join("/") : "",
			params: params,
			callback: callback
		}
	}


	var ndb = function() {
		function ndb(){}

		ndb.prototype = {
			init: function(url, defaults) {
				this.url = url;
				this.defaults = defaults;
				return this;
			},

			query: function(params) {
				var params = build_arguments(arguments);
				defaults(params.params, this.defaults);

				var path = this.url + params.path + build_query(params.params);
				var cache = memcache[path];

				if (params.callback && cache) {
					params.callback(cache.data, 304);
				}
				return request("GET", path, null, params.callback);
			},

			post: function() {
				var params = build_arguments(arguments);
				defaults(params.params, this.defaults);
				return request("POST", this.url + params.path, params.params, params.callback);
			},

			create: function() {
				var params = build_arguments(arguments);
				defaults(params.params, this.defaults);
				return request("POST", this.url + params.path, params.params, params.callback);
			},

			update: function() {
				var params = build_arguments(arguments);
				defaults(params.params, this.defaults);
				return request("PUT", this.url + params.path, params.params, params.callback);
			},

			remove: function() {
				var params = build_arguments(arguments);
				return request("DELETE", this.url + params.path, null, params.callback);
			},

			save: function() {
				var params = build_arguments(arguments);
				defaults(params.params, this.defaults);

				if (!params.params.id) {
					return request("POST", this.url + params.path, params.params, params.callback);
				}
				params.path = params.path + "/" + params.params.id;
				return request("PUT", this.url + params.path, params.params, params.callback);
			}
		};

		return function() {
			return ndb.prototype.init.apply(new ndb(), arguments);
		}
	}();


	ndb.async = function(result, count) {
		count = count || 0;
		result.count = count + 1;

		return function(data) {
			result.complete = result.complete || 0;
			result.complete++;
			result[count] = data;

			if (result.complete === result.count) {
				result.fn.apply(window, result);
			}
		}
	};

	ndb.done = function(fn) {
		var store = queue.shift();
		store.fn = fn;
		queue.push([]);
	};

	ndb.defaults = function() {};

	return ndb;
}]);