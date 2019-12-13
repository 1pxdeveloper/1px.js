import {_} from "./fp.js";

/// String
_.capitalize = (string) => string.slice(0, 1).toUpperCase() + string.slice(1);
_.trim = (string) => _.isStringLike(string) ? String(string).trim() : "";
_.split = (...args) => (string) => string.split(...args);
_.splitAt = (index) => (string) => [string.slice(0, index), string.slice(index)];
_.startsWith = (searchString, position) => (string) => String(string).startsWith(searchString, position);

_.rpartition = (sep) => (string) => {
	const lastIndex = string.lastIndexOf(sep);
	if (lastIndex === -1) return [string, "", ""];
	return [string.slice(0, lastIndex), string.slice(lastIndex, lastIndex + sep.length), string.slice(lastIndex + sep.length)];
};