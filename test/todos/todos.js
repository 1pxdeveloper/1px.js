import {_} from "../../1px.js/src/fp";
import {Action, RequestAction} from "../../1px.js/src/store";
import {Reducer, Computed} from "../../1px.js/src/store";


import {visibilityFilter$} from "./visibilityFilter.js";


/// Actions
export const APP_START = new Action("APP_START");
export const FETCH_TODOS = new RequestAction("FETCH_TODOS");

export const ADD_TODO = new Action("ADD_TODO");
export const REMOVE_TODO = new Action("REMOVE_TODO");
export const TOGGLE_ALL = new Action("TOGGLE_ALL");
export const CLEAR_COMPLETED = new Action("CLEAR_COMPLETED");

export const PATCH_TODO_TITLE = new Action("PATCH_TODO_TITLE");
export const PATCH_TODO_COMPLETED = new Action("PATCH_TODO_COMPLETED");


/// Reducers
const filterAll = (todo) => todo;
const filterActive = (todo) => !todo.completed;
const filterCompleted = (todo) => todo.completed;


export const todos$ = Reducer(
	[],
	
	FETCH_TODOS.SUCCESS,
	
	ADD_TODO
		.filter({title: _.isStringLike})
		.map({title: _.trim})
		.filter({title: _.hasLength})
		.map(({id, title, completed = false}) => _.append({id, title, completed})),
	
	REMOVE_TODO
		.map((todo) => _.remove({id: todo.id})),
	
	CLEAR_COMPLETED
		.map(() => _.remove(filterCompleted)),
	
	TOGGLE_ALL
		.map((completed) => _.patchAll({completed})),
	
	PATCH_TODO_TITLE
		.filter({title: _.isStringLike})
		.map({title: _.trim})
		.filter({title: _.hasLength})
		.map(({todo, title}) => _.patch(todo, {title})),
	
	PATCH_TODO_COMPLETED
		.map(({todo, completed}) => _.patch(todo, {completed}))
);


export const filteredTodos$ = todos$
	.withLatestFrom(visibilityFilter$)
	.map(([todos, visibilityFilter]) => todos.filter(visibilityFilter));

export const num_items_left$ = filteredTodos$
	.map((filteredTodos) => filteredTodos.length - filteredTodos.filter(filterCompleted).length);

export const all_checked$ = filteredTodos$
	.map(_.every(filterCompleted));


/// Effect
FETCH_TODOS.REQUEST
	.exhaustMap(() => localStorage.getItem("todo-mvc"))
	.tap(FETCH_TODOS.SUCCESS, FETCH_TODOS.FAILURE)
	.subscribe();