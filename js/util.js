/// event Pipe ... 과연 Observable 의존도를 높이는게 맞을까??
Event.pipes = {

	prevent($) {
		return $.do(e => e.preventDefault())
	},

	stop($) {
		return $.do(e => e.stopPropagation())
	},

	capture($) {
		return this
	},

	self($) {
		return $.filter(e => e.target === $.element)
	},

	once($) {
		return $.take(1)
	},

	shift($) {
		return $.filter(e => e.shiftKey)
	},

	alt($) {
		return $.filter(e => e.altKey)
	},

	ctrl($) {
		return $.filter(e => e.ctrlKey)
	},

	meta($) {
		return $.filter(e => e.metaKey)
	},

	esc($) {
		return $.filter(e => e.keyCode === 27)
	}
};

KeyboardEvent.pipes = {
	esc($) {
		return $.filter(e => e.keyCode === 27)
	}
};


///
module.directive(".focus()", function($) {
	return function(context, el, script) {
		context.watch$(script, function(bool) {


			console.log(script, bool);


			if (bool) {
				window.requestAnimationFrame(function() {
					el.focus();
				});
			}
		});
	}
});


/// default Pipes
module.pipe("html", function($) {
	return function(value) {
		if (value === undefined) value = "";
		let h = document.createElement("div");
		h.innerHTML = String(value);
		return DocumentFragment.from(h.childNodes);
	}
});


/// $localStorage
module.factory("$localStorage", function() {

	function $localStorage(key) {
		let store = JSON.parse(localStorage.getItem(key)) || Object.create(null);

		let prototype = {
			clear() {
				Object.keys(store).forEach(key => delete store[key]);
				localStorage.removeItem(key);
			},

			save() {
				localStorage.setItem(key, JSON.stringify(store));
			}
		};

		Object.setPrototypeOf(prototype, null);
		Object.setPrototypeOf(store, prototype);

		let flag = false;
		return new Proxy(store, {
			set: function(o, prop, value) {
				o[prop] = value;

				if (!flag) {
					flag = true;
					Promise.resolve().then(() => {
						flag = false;
						localStorage.setItem(key, JSON.stringify(o));
					});
				}
			}
		})
	}

	return $localStorage;
});


/// @FIXME: 이거 쓰게 될까??
function $clone(obj, weakMap) {
	if (Object(obj) !== obj) {
		return obj;
	}

	if (obj === window || obj === document) {
		return obj;
	}

	weakMap = weakMap || new WeakMap();
	let o = weakMap.get(obj);
	if (o) {
		return o;
	}

	o = Object.create(Object.getPrototypeOf(obj));
	weakMap.set(obj, o);

	Object.keys(obj).forEach(prop => {
		o[prop] = $clone(obj[prop], weakMap);
	});

	return o;
}