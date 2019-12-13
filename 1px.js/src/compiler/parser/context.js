import {Observable, Subject, BehaviorSubject} from "../../observable";

import {tokenize} from "./expression.js";
import {watch$$} from "./watch.js";
import {evaluate} from "./evaluate.js";


function makeString(strings) {
	return Object(strings) === strings ? String.raw.apply(String, arguments) : String(strings);
}

const noWatch$$ = (object, prop) => Observable.of(object[prop]);


export class JSContext {

	constructor(thisObj, locals = Object.create(null)) {
		this.thisObj = thisObj;
		this.locals$ = new BehaviorSubject(locals);

		this._disconnect$ = new Subject();

		const f = (...args) => {
			const root = tokenize(makeString(...args));
			for (const token of root.tokens) {
				token.context = this;
				token.watch = watch$$;
			}

			return evaluate(root).takeUntil(this._disconnect$);
		};

		Object.setPrototypeOf(f, this);
		return f;
	}

	evaluate(script) {
		const root = tokenize(script);
		for (const token of root.tokens) {
			token.context = this;
			token.watch = noWatch$$;
		}

		// @FIXME: subscribe를 해야 하나??
		return evaluate(root).takeUntil(this._disconnect$);
	}

	assign(script, value) {
		const root = tokenize(script);
		for (const token of root.tokens) {
			token.context = this;
			token.watch = noWatch$$;
		}

		// @FIXME: subscribe를 해야 하나??
		return evaluate(root).tap(() => root.object[root.prop] = value);
	}

	disconnect() {
		this._disconnect$.complete();
	}

	fork(locals) {
		return new JSContext(this.thisObj, Object.setPrototypeOf(locals, this.locals$.value));
	}

	fromEvent(el, type, useCapture = false) {
		return Observable.fromEvent(el, type, useCapture);
	}
}