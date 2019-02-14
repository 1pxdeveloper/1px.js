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