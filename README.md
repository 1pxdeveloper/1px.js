# 1px.js javascript framework

## Working Drafts



### Template Syntax

```html
<!-- text interpolation -->
<h1>{{ title }}</h1>

<h1>{{ x + y / 10 * 2 }}</h1>


<!-- class -->
<button [class.hello]="bool">

<!-- attr -->
<button [attr.id]="id">

<!-- style -->
<button [style.width.px]="img.width" [style.background-image.url]="'abc.jpg'">


<!-- property -->
<div [hidden]="isShow">{{ todo.title }}</div>

<!-- two-way -->
<input [(value)]="title">

<!-- ref -->
<div $div>{{ $div.tagName }}</div>

<!-- call -->
<input .focus()="condition" .blur()="bool" />


<!-- event -->
<button (click)="hello()">
```



### Template expressions

javascript expressions

No 
- typeof, instanceof
- no statements (ex if, for)
- no +=, -=, ++, --
- no bitwise & >> << >>>
- no arrow function with curly brace 
- (a,b) => { ... } (X) it means (a,b) => { {obj} }
- (a,b) => ... (O)
- (a,b) => ...; ...; ... (O)


differences

- ; expressions: 30; foo(); // 30
- pipe: | ex) array | filter: x => x < 10
- if expressions: foo() if y > 10
- null or undefined dot chain no error: a.b.c.d // if a.b === undefined ? undefined;





### Template Syntax - Repeat(*foreach)

```html

<!-- maniplation -->
<ul>
    <li *foreach="todos as todo, index">#{{index}} - {{todo.title}}</div>
</ul>
```



### Template Syntax - Condition(*if, *else)

```html
<!-- if -->
<div *if="condition"></div>

<div *else-if="condition2"></div>

<div *else></div>
```



### Template Syntax - Event with Pipe

```html
<-- addEventListener -->
<button (click)="foo(bar)"></button>

<-- with Pipe -->
<button (click|prevent)="foo(bar)"></button>
<button (click|prevent|capture)="foo(bar)"></button>
<button (click|once)="foo(bar)"></button>

(click|prevent) // event.preventDefault();
(click|stop) // event.stopPropagation();
(click|capture) // addEventListener(..., ..., true)
(click|self) // event.target === event.currentTarget
(click|once) // .take(1)

(keydown|escape) => e.target.key === "Escape"
(keydown|alt|escape) => e.target.alt && e.target.key === "Escape"

```



### Event Handler with Promise (or Obserable)
```html
    click() {
    	/// do stuff...
        
        /// pending... 	
    	return fetch("....").then( ... );
    }
    
    or ...

    click() {
    	/// do stuff...
        
        /// pending... 	
    	return new Observable(observer => {
    		
    		....
    		
    		observer.complete();
    	})
    }
```





### Pipe
```html
<div>{{ today | date: 'yyyy-mm-dd' }}</div>

<script>
$module.pipe("date", (value, format) => Date.format(value, format))
</script>
```




### Smart Watch

```javascript
class TodoApp {
    init($) {
        this.todos = [];
        $ `this.num_completed = todos.filter(todo => todo.completed).length`
    }
}
```


### Module

```javascript
$module.value("count", 0);

$module.require(function(http, element) { ... });

$module.factory("mylib", function(http, element) { ... });



///
$module.component();

$module.pipe();
```



### WebComponent

```html
<todo-apps></todo-apps>

<script>

$module.component("todo-apps", function(WebComponent) {
    
	//language=HTML
	this.templateHTML = `
        <!-- Service -->
        <http url="/api/users/:id" #http></http>
        
        <!-- Template -->
        <template>
            <div *foreach="todos as todo">{{ todo.title }}</div>   
        </template>
    
        <!-- Sub Template (for Route or Condition) -->
        <template *if="multiple" *route="/users/:id">
            <div *foreach="todos as todo">{{ todo.title }}</div>   
        </template>
	`;
	
	return class extends WebComponent {
        init() {
            
        },
        
        addTodos(title) {
            
        }
    }
})
</script>
```



### WebComponent - content & slot

```html
<template>
    <button><content></content></button>   
</template>

<my-btn>hello world</my-btn>
```




### Observable
```javascript
let o = Observable.of(1, 2, 3).subscribe(v => v);
```



### Expression

```html
$parse(script).watch$(global, local);

let scope = new Scope(global, local);

scope.watch$(script)

```



### Form

```html
<form>
    <input type="text" [(value)]="title">

    <input type="text" [(value.change)]="title">

    <input type="checkbox" [(checked)]="bool">

    <input name="m" type="checkbox" value="A" [(checked.multiple)]="array">
    <input name="m" type="checkbox" value="B" [(checked.multiple)]="array">
    <input name="m" type="checkbox" value="C" [(checked.multiple)]="array">
</form>
``` 



### Form & Input - Validate (Draft)

```html
.clean
.untouched
.touched
.dirty
.valid
.invalid
.pending
``` 



 
 
### Animation (DOM Transition)
 
 
### Router
```html
- PageJs
https://github.com/visionmedia/page.js

page('/user/:id', this.prepare, this.userId, ... )
page('*', notFound)

userId(ctx, next) {
    ctx.params.id;
    fetch(...).then(res => {
        ...
        next()
    ));
]
```



### Virtual DOM
```html
개인적으로 Virtual DOM 은 좋아하지 않는다. 성능이 별로다. 
SSR을 고려했을때 처음 딱 1번만 Virtual DOM으로 업데이트 하는 방법을 생각해보자.
```



### SSR & Universal on ServerSide
```html
express와 Node.js 를 이용해서 Universal을 만들 방법을 생각해보자.

- Server에서 사용되는 Component와 Client에서 사용하는 컴포넌트 분리

- Server Data가 연동되는 것 ex) blogs, boards 등은 그냥 html을 통째로 받아서 Virtual DOM 하자.

- URL Request 할떄마다 새로 페이지를 만드는게 아니라 DB 등이 변경되면 Store에 HTML을 보관하고 즉시 뿌려주는 방식

- Account등과 같이 개인적인 페이지는 Client Component를 이용하자.

- **Point: 모든 페이지는 동일한 정적 구조를 항시 유지한다. 
=> account의 정보와 같이 접근하는 사람마다 다른 페이지일 경우에만 client 사용
```




### UI Library



### more Things

```html

내가 작업하면서 힘들었던 것들.. ==> 개발 필요!!!

- cart등에서 qty 등이 바뀌었을때 새로고침하는거 => 이제는 해결 watch script에 function map filter 추가

- touch, drag & drop 등 motion Event Helper

- url Parsing => page.js 참고해서 잘 만들어 보자.

- iframe Widget

- input text format -> number, date, phone, etc....

- Loading Progress UI with Promise, Observable
=> 이거 번쩍 번쩍 하거나, 2중 로딩이 있거나 이런거 자동으로 예쁘게 처리


- Data Base Framework with (Rest API)

- {{ tags | highlight: currentTags | html }} 이런거~~~ 텍스트 표시자에서 html 출력하는 기능


- account 모듈







```

### localStorage....
```javascript


$module.factory("$localStorage", function() {
	function $localStorage(key) {
		let store = JSON.parse(localStorage.getItem(key)) || Object.create(null);
		Object.setPrototypeOf(store, null);

		return new Proxy(store, {
			set: function(o, prop, value) {
				console.log(o, prop, value);
				o[prop] = value;
				localStorage.setItem(key, JSON.stringify(o));
			}
		})
	}

	return $localStorage;
});


const $store = $localStorage("todomvc-app");

$store.abc = "123"


```


### Touch & Drag & Drop & Motion Event ....




### JSContext

```javascript
let obj = {a: 100, b: 200};

let $ = JSContext.create(obj);

let c = $.evaluate("a + b");

let d = $.assign("d", "a + b");

$.watch$("a + b").subscribe(value => console.log(value));

$`e = a + b`
```




### 원칙과 목표

- 일단 남들이 지원하는건 다 지원하자.
- 덩치를 키우지 않는다. 
- 프레임워크를 쓰기 위해 프레임워크에 맞게 기존 코드를 고치는 것을 최소화 한다.
- => 프레임워크를 사용하기 위한 포맷을 최소화 할것 (그래서 모듈이 고민이다.) 
- 간단하고 직관적이고 쉬워야 한다.






### @TODO

```html

[Module]
- es6 $modules?
- directives, pipes, component 어떻게 등록할건데?
- single $module name??


[Parse]
- array as item, index => item if item.completed /// if filter 구현하기
- parse.js => 상수 cache ex) ['abc','def',2] or 100 + 400 * 2 등등..


[Pipe]
- pipe asyncable!!!


[Note]
- Observable sync, async 구분하되 하나의 로직으로 처리하기 



[WebComponent]
- /// @FIXME: init & template & compile async 하게 만들기

```

