/// VisibilityFilter
import {Action, Reducer} from "../../1px.js/src/store";

/// Actions
export const SET_VISIBILITY_FILTER = new Action("SET_VISIBILITY_FILTER");
SET_VISIBILITY_FILTER.SHOW_ALL = "#/";
SET_VISIBILITY_FILTER.SHOW_ACTIVE = "#/active";
SET_VISIBILITY_FILTER.SHOW_COMPLETED = "#/completed";


/// Reducer
const filterAll = (todo) => todo;
const filterActive = (todo) => !todo.completed;
const filterCompleted = (todo) => todo.completed;

export const visibilityFilterType$ = Reducer(
	SET_VISIBILITY_FILTER.SHOW_ALL,
	SET_VISIBILITY_FILTER.distinctUntilChanged()
);


export const visibilityFilter$ = Reducer(
	() => filterAll,
	
	SET_VISIBILITY_FILTER
		.distinctUntilChanged()
		.map(type => {
			switch (type) {
				case SET_VISIBILITY_FILTER.SHOW_ALL:
					return () => filterAll;
				
				case SET_VISIBILITY_FILTER.SHOW_ACTIVE:
					return () => filterActive;
				
				case SET_VISIBILITY_FILTER.SHOW_COMPLETED:
					return () => filterCompleted;
				
				default:
					return () => filterAll;
			}
		})
);