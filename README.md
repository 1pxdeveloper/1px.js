#jpx javascript framework
*Data-bind Template Javascript Framework* (inspired by angularjs)

##NOTICE!
- This is not release version.
- it can be changed API or Syntax when next version.

##Key Concept

- Very Easy to use!!
- HTML like template syntax
- Controller write just plain javascript
- jQuery Compatible (jQuery mini)
- minimalize IE support


##Features

- Data-binding
- HTML like Template
- Simple Controller (Plain javascript code)
- Automaitc UI Update
- HTML Component (Working Draft)



#Getting started

### Tutorial #1
```html
<script src="/js/jpx.js"></script>

<div><input type="text" name="first"></div>
<div><input type="text" name="last"></div>
<div>Hello, {first} {last}</div>
```


### Tutorial #2

```html
<script src="/js/jpx.js"></script>

<form submit="addTodo()">
    <div><input type="text" name="todoName" placeholder="todo title here"/></div>
</form>

<ul>
    <li repeat="todos as todo, index" class="todo {todo.is_done ? 'todo-is-done' : ''}">
        <input type="checkbox" with="todo" name="is_done"/>
	#{index} - {todo.name} <a click="removeTodo(index)">del</a>
    </li>
</ul>


<script>
function ViewController(self) {
return {
    init: function() {
        self.todos = [{name: "sample #1", is_done: true}];
    },

    addTodo: function() {
        self.todos.push({name: self.todoName, is_done: false});
        self.todoName = "";
    },

	removeTodo: function(index) {
		self.todos.splice(index, 1);
	}
}}
</script>
```









##Controller

### Declare Controller

```javascript
function ViewController(self) {
return {
	init: function() {
		self.x = 100;
		self.y = 200;
	},

	foo: function() {
		return self.x + self.y;
	},

	bar: function() {
		// @TODO:
	}
}}
```


### Re-use Controller (inherit, minix, whatever)
```javascript
function BaseController(self) {
return {
	init: function() {
		self.name = "SomeController";
	},

	foo: function() {
		alert("foo");
	},

	bar: function() {
		alert("bar");
	}
}}


function ViewController(self, BaseController /*, ...others */) { 
return {
	init: function() {
		BaseController.init() // super call
		alert(self.name) // "SomeController"

		self.bar(); // inherit (or mixin)
	},

	// override
	foo: function() { 
		alert("foo2");
		// BaseController.foo(); # you can also call super
	}
}}

```



##Bindings

###repeat = “{expr} as {none}, {none}”

```html
<ul>
	<li repeat="rows as row, index">#{index} {row.id} - {row.name}</li>
</ul>
```


###template = “{string}”

```html
<div template="popup"><!-- template content is injected here!! --></div>


<template id="popup">
<h1>{title}</h1>
<h2>{slug}</h2>
</template>
```

###with = “{expr}”

```html
<div>
	<div>{foo.name}</div>
	<div>{foo.age}</div>
</div>

equals

<div with="foo">
	<div>{name}</div>
	<div>{age}</div>
</div>
```


###name = “{string}”
```html
<input type="text" name="name"/> <!-- self.name = {input.value} -->
<input type="checkbox" name="yn"/> <!-- self.yn = {checked ? true : false} -->

<form>
	<input type="checkbox" name="sport" value="baseball" checked />
	<input type="checkbox" name="sport" value="soccer" checked /> 
	<input type="checkbox" name="sport" value="basketball" /> <!-- self.sport = ['baseball', 'soccer'] -->
</form>

<form>
	<input type="radio" name="sex" value="male" checked /> <!-- self.sport = baseball -->
	<input type="radio" name="sex" value="female" checked /> <!-- self.sport = baseball -->
</form>

<select name="foo">
	<option>A</option>
	<option>B</option>
	<option>C</option>
</select>


<!-- Working with 'with' attr -->

<input type="text" with="user" name="name"/> <!-- self.row.name = {input.value} -->
<input type="password" with="user.account" name="pwd"/> <!-- self.user.account.pwd = {input.value} -->

```


###img-src = “{string}”

```html
<img src="{path}"/> <!-- occur loading error! "{path}" is not URL -->
<img img-src="{path}"/> <!-- ok, if image finished loading replace to src attribute -->
```


###html = “{string}”

```html
<div html="hi~ hello my name is <strong>{name}</strong>"></div> <!-- if self.name = 'jpixel'; -->

to 

<div>hi~ hello my name is <strong>jpixel</strong></div>
```


###visible = “{expr}”

###hidden = “{expr}”

###enabled = “{expr}”

###fn = “{string}”

###css = “{string}”

###outlet = "{expr}"

###~event = “{expr}”
- click, mousedown, mouseover, ...

###~boolean = “{expr}”
- checked, selected, disabled, readonly, …




