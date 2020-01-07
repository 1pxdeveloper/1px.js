import {$module} from "../compiler/module.js";

$module.factory("http", function(Observable) {
	
	function Callable(f) {
		return Object.setPrototypeOf(f, new.target.prototype);
	}
	
	Callable.prototype = Function.prototype;
	
	
	let timerId = 0;
	
	class HttpService extends Callable {
		constructor(init = {}, http) {
			super(body => {
				const _body = body;
				
				const url = this.init.url;
				let init = this.init;
				
				if (body) {
					body = init.body ? init.body(body) : body;
					init = {...this.init, body};
				}
				
				/// @FIXME:
				if (init.method === "GET" || init.method === "DELETE" || init.method === "HEAD") {
					init = {...this.init};
					delete init.body;
				}
				
				// if (typeof init.preScript === "function") {
				// 	init = {...init, ...init.preScript(init)};
				// }
				
				const response = init.response || ((v) => v);
				
				return new Observable(observer => {
					console.group(init.method, url);
					console.log("Request", _body);
					console.time("Time" + (++timerId));
					console.groupEnd();
					
					return Observable.castAsync(fetch(url, init).then(...response))
						.tap(res => console.group("Response", init.method, url))
						.tap(_.log("Response"))
						.tap(() => console.timeEnd("Time" + (timerId--)))
						.finalize(() => {
							console.groupEnd();
						})
						.subscribe(observer);
				});
			});
			
			this.init = http ? {...http.init, ...init} : {...init};
		}
		
		/// Request
		resource(data) { return new HttpService(data, this) }
		
		/// Request
		url(url) { return this.resource({url}) }
		
		headers(headers) { return this.resource({headers}) }
		
		method(method, ...url) { return this.resource({method, url: url.join("/")}) }
		
		body(body) { return this.resource({body}) }
		
		GET(...url) { return this.method("GET", ...url) }
		
		POST(...url) { return this.method("POST", ...url) }
		
		PUT(...url) { return this.method("PUT", ...url) }
		
		DELETE(...url) { return this.method("DELETE", ...url) }
		
		PATCH(...url) { return this.method("PATCH", ...url) }
		
		HEAD(...url) { return this.method("HEAD", ...url) }
		
		OPTION(...url) { return this.method("OPTION", ...url) }
		
		
		/// Request
		preScript(preScript) {
			return this.resource({preScript});
		}
		
		body(body) {
			return this.resource({body});
		}
		
		/// Response
		response(...response) {
			return this.resource({response});
		}
	}
	
	return new HttpService();
});