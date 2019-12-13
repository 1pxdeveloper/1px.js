import {_, mapCallback, filterCallback} from "./fp.js";

/// Array
_.slice = (start, end) => (a) => a.slice(start, end);

_.map = (callback) => (a) => a.map(mapCallback(callback));
_.filter = (callback) => (a) => a.filter(filterCallback(callback));
_.every = (callback) => (a) => a.every(filterCallback(callback));
_.some = (callback) => (a) => a.some(filterCallback(callback));

_.remove = (callback) => _.filter(_.not(callback));
_.removeItem = (item) => _.remove(_.is(item));
_.append = _.push = (item) => (array) => [...array, item];
_.prepend = _.unshift = (item) => (array) => [item, ...array];
_.patch = (target, object) => _.map(item => item !== target ? item : ({...item, ...object}));
_.patchAll = (object) => _.map(item => ({...item, ...object}));

_.sort = (callback) => (array) => (array => (array.sort(callback), array))(array.slice());

_.replaceIndex = (object, index) => (array) => {
	if (index < 0) index = array.length + index;
	const r = array.slice();
	r[index] = object;
	return r;
};

_.last = (array) => array[array.length - 1];
