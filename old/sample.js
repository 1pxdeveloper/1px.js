var Foo = (function() {
	function Foo(bar) {
		this.bar = 'baz';
	}
	Foo.prototype = {};
	Foo.annotations = [
		//new Component({ selector: app }),
		//new Template({ url: 'todos.html' })
	];
}());


console.log(Foo);

