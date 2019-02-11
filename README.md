#1px.js javascript framework

## Working Drafts

### Template Binding

```html
<!-- property, event, text -->
<div [hidden]="isShow" (click)="removeTodo(todo)">{{ todo.title }}</div>

<!-- two-way -->
<input [(value)]="title">

<!-- maniplation -->
<div *foreach="todos as todo, index"></div>

<!-- map, filter -->
<div *foreach="todos as todo, index => todo.title if todo.complete"></div>

<!-- if -->
<div *if="condition"></div>

<div *else-if="condition2"></div>

<div *else></div>
```


### Compile(Smart Watch)

```javascript

$ `this.num_completed = todos.filter(todo => todo.completed).length`

```


### Module
```javascript

```

### WebComponent

```html
<web-component name="todo-apps">
    <template>
        <div *repeat="todos as todo">{{ todo.title }}</div>   
    </template>
</web-component>

<script>module.component("todo-apps", function() {
	
	return {
		init() {
			
		},
		
		addTodos(title) {
			
		}
	}
})

</script>
```

### Observable

### Expression

```html
$parse(script).watch$(global, local);

let scope = new Scope(global, local);

scope.watch$(script)

```

### Pipe
```html
<div>{{ today | date: 'yyyy-mm-dd' }}</div>
```

### Form
 
### Router

### Virtual DOM

### SSR

### UI Library

### on ServerSide
