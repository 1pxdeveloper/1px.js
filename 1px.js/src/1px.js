import {_} from "./fp";

import {Observable, Subject, BehaviorSubject, ReplaySubject, AsyncSubject} from "./observable";

import {Action, RequestAction, StreamAction} from "./store/action.js";

import {JSContext} from "./compiler/parser/context.js";
import {WebComponent} from "./component";

import {$module} from "./compiler/module.js";

import "./compiler/directives/directive.foreach.js"
import "./compiler/directives/directive.if.js"
import "./compiler/directives/directive.template.js"

import "./services/http.js"


Object.assign(window, {
	_,
	
	Observable,
	Subject,
	BehaviorSubject,
	ReplaySubject,
	AsyncSubject,
	
	Action,
	RequestAction,
	StreamAction,
	
	JSContext,
	WebComponent,
	
	$module
});


$module.value("_", _);
$module.value("Observable", Observable);
$module.value("Subject", Subject);
$module.value("BehaviorSubject", BehaviorSubject);
$module.value("ReplaySubject", ReplaySubject);
$module.value("AsyncSubject", AsyncSubject);
$module.value("Action", Action);
$module.value("RequestAction", RequestAction);
$module.value("StreamAction", StreamAction);
$module.value("JSContext", JSContext);
$module.value("WebComponent", WebComponent);