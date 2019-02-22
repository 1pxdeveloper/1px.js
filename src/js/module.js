(function() {

	function Subject(value) {
		this.queue = Object.create(null);
		this.value = value || Object.create(null);
	}

	Subject.prototype = {
		subscribe(name, callback) {
			if (name in this.value) {
				return callback(this.value[name]);
			}

			this.queue[name] = this.queue[name] || [];
			this.queue[name].push(callback);
		},

		publish(name, value) {
			this.value[name] = value;

			if (this.queue[name]) {
				let q = this.queue[name].slice();
				delete this.queue[name];
				q.forEach(callback => callback(value));
			}
		}
	};


	let $value = Object.create(null);
	let $factory = Object.create(null);
	let $subject_value = new Subject($value);
	let $subject_factory = new Subject($factory);


	function value(name, value) {
		$subject_value.publish(name, value);
	}

	function factory(name, factoryFn) {
		if (!factoryFn.$inject) {
			let str = String(factoryFn);
			str = str.slice(str.indexOf("(") + 1, str.indexOf(")")).trim();
			factoryFn.$inject = str ? str.split(/\s*,\s*/) : [];
		}
		$subject_factory.publish(name, factoryFn);
	}


	function require(names, callback) {
		if (!Array.isArray(names)) {
			names = [names];
		}

		if (names.length === 0) {
			return callback();
		}


		let args = [];
		let count = 0;

		let ret = [];

		names.forEach((name, index) => {

			invokeFactory(name);
			$subject_value.subscribe(name, function(value) {
				args[index] = value;
				count++;

				console.log("!!!!!!!!!", value, count);

				if (count === names.length) {
					ret = args;
					callback.apply(null, args);
				}
			});
		});

		return ret;
	}


	function invokeFactory(name) {
		let exist = false;
		$subject_value.subscribe(name, () => exist = true);
		if (exist) return;

		$subject_factory.subscribe(name, factory => {

			require(factory.$inject, function() {

				/// test용
				factory.invokeCount = factory.invokeCount || 0;
				factory.invokeCount++;

				$subject_value.publish(name, factory.apply(null, arguments));
			});
		});
	}


	function createPrefixModule(prefix) {

		let ret = function(name, value) {
			return factory(prefix + name, value);
		};

		ret.value = function(name, value) {
			return value(prefix + name, value);
		};

		ret.require = function(names, callback) {
			if (!Array.isArray(names)) names = [names];
			names = names.map(name => prefix + name);
			return require(names, callback);
		};

		return ret;
	}


	let $module = {value, factory, require};
	$module.directive = createPrefixModule("directive.");
	$module.component = createPrefixModule("component.");
	$module.service = createPrefixModule("server.");
	$module.pipe = createPrefixModule("pipe.");

	$module.$value = $value;
	$module.$factory = $factory;

	window.$module = $module;


})();


