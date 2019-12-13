import {_} from "../fp";
import {Observable, Subject} from "../observable";


let action_index = 0;
let depth = false;

const _action_log_begin = (type, payload) => {
	action_index++;
	depth = true;
	const signature = payload === undefined ? "" : _.toType(payload);
	const msg = `#${action_index} ${type}(${signature})`;
	_.debug.group(msg);
	payload !== undefined && console.log(payload);
};

const _action_log_end = () => {
	_.debug.groupEnd();
	if (depth === true) console.log("\n");
	depth = false;
};


const memo = {};

class Action extends Observable {
	constructor(type, ...pipes) {
		
		// @TODO: memo를 쓰니 override를 할 수가 없다;;
		if (memo[type]) return memo[type];
		
		const subject = new Subject;
		const observable = subject.pipe(...pipes);
		
		let s, s2;
		if (pipes.length) {
			s = observable.subscribe();
		}
		
		super(observer => {
			s2 = observable.subscribe(observer);
			if (s) s.unsubscribe();
			return s2;
		});
		
		this.type = type;
		this.toString = () => type;
		this.pipes = pipes;
		
		const f = payload => {
			_action_log_begin(type, payload);
			subject.next(payload);
			_action_log_end();
			
			return Observable.EMPTY;
		};
		
		Object.setPrototypeOf(f, this);
		
		memo[type] = f;
		return f;
	}
	
	call(...args) {
		return Function.prototype.apply.apply(this, this, args);
	}
	
	apply(args) {
		return Function.prototype.apply.apply(this, this, args);
	}
}

const RequestAction = class extends Action {
	constructor(type, ...pipes) {
		pipes = [...pipes, $ => $.tap(value => f.REQUEST(value)).share()];
		const _f = super(type, ...pipes);
		
		let subscription;
		const f = (payload) => {
			if (subscription) subscription.unsubscribe();
			
			const id = payload && payload.id;
			const ret = Observable.merge(f.SUCCESS, f.FAILURE, f.CANCEL).filter({id}).take(1).shareReplay(1);
			subscription = ret.subscribe();
			_f(payload);
			return ret;
		};
		
		Object.setPrototypeOf(f, this);
		
		f.CANCEL = new Action(type + ".CANCEL");
		f.REQUEST = new Action(type + ".REQUEST");
		f.SUCCESS = new Action(type + ".SUCCESS");
		f.FAILURE = new Action(type + ".FAILURE");
		return f;
	}
};


const StreamAction = class extends Action {
	constructor(type, ...pipes) {
		pipes = [...pipes, $ => $.tap(value => f.START(value)).share()];
		const _f = super(type, ...pipes);
		
		let subscription;
		
		const f = (payload) => {
			if (subscription) subscription.unsubscribe();
			
			const id = payload && payload.id;
			const ret = Observable.merge(f.ERROR, f.COMPLETE, f.CANCEL).filter({id}).take(1).shareReplay(1);
			subscription = ret.subscribe();
			_f(payload);
			return ret;
		};
		
		
		Object.setPrototypeOf(f, this);
		
		f.CANCEL = new Action(type + ".CANCEL");
		f.START = new Action(type + ".START");
		f.NEXT = new Action(type + ".NEXT");
		f.ERROR = new Action(type + ".ERROR");
		f.COMPLETE = new Action(type + ".COMPLETE");
		
		return f;
	}
};

Action.prototype.isolate = function(id) {
	const f = (payload) => {
		if (Object(payload) !== payload) payload = {payload};
		return this({id, ...payload});
	};
	
	Object.assign(f, _.mapValues(_.if(_.instanceof(Action), (action) => action.isolate(id)))(this));
	
	const o = this.pipe($ => $.filter({id: _.is(id)}));
	Object.setPrototypeOf(f, o);
	return f;
};

Action.isolate = (id, object) => {
	return _.memoize1((id) => _.mapValues(_.if(_.instanceof(Action), (action) => action.isolate(id)))(object))(id);
};

export {
	Action,
	RequestAction,
	StreamAction
}