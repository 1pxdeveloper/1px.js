import {_} from "../../fp";
import {$module} from "../module.js";
import {$compile} from "../compile";


/// Default Template Directive
$module.directive("*foreach", function() {

	const {NOT_CHANGED, DELETE, INSERT} = _.diff;
	const {is} = Object;

	const parseForeachScript = _.pipe(
		_.rpartition(" as "),
		_.spread((script, sep, rest) => [script, ...rest.split(",", 2)]),
		_.map(_.trim)
	);

	const createLocals = (array, ROW, INDEX) => array.map((value, index) => {
		const local = Object.create(null);
		ROW && (local[ROW] = value);
		INDEX && (local[INDEX] = index);
		return local;
	});


	const createRepeatNode = (node, context, local, value) => {
		node = node.cloneNode(true);
		context = $compile(node, context.fork(local));
		return {node, context, local, value};
	};


	/// @FIXME: impure!
	function updateRepeatNode(newRow, willRemoves, newRows, cursor, value, index, local) {
		if (!is(newRow.value, value)) {
			newRow.value = value;
			newRow.context.locals$.next(local);
		}

		if (cursor) {
			cursor.before(newRow.node);
		}

		newRows[index] = newRow;

		delete newRow.willRemoved;
		return willRemoves.filter(o => o !== newRow);
	}

	return function(context, el, script) {

		/// Parse [script] as [ROW], [INDEX]
		const [_script, ROW, INDEX] = parseForeachScript(script);

		/// Prepare Placeholder
		const repeatNode = el.cloneNode(true);
		repeatNode.removeAttribute("*foreach");

		const placeholder = document.createComment("foreach: " + script);
		el.before(placeholder);

		const placeholderEnd = document.createComment("endforeach");
		el.replaceWith(placeholderEnd);


		////
		context(_script)
			.map(value => _.isArrayLike(value) ? Array.from(value) : [])
			.scan((prevRows, array) => {

				/// Create Locals
				const locals = createLocals(array, ROW, INDEX);

				/// Diff Prev Array with Current Array
				let diffs = _.diff(prevRows, array, (a, b) => is(a.value, b));


				/// Collect willRemoves
				let willRemoves = [];
				let newRows = [];

				diffs = diffs.filter(([type, value, prev_index, index]) => {
					const prevRow = prevRows[prev_index];

					/// NOT_CHANGED
					if (type === NOT_CHANGED) {
						console.log("NOT_CHANGED!!", value);
						newRows[index] = prevRow;
						return false;
					}

					/// DELETE
					if (type === DELETE) {
						prevRow.willRemoved = true;
						willRemoves.push(prevRow);
						return false;
					}

					return true;
				});


				/// Patch Rows: INSERT => PATCH / REPLACE / REUSE / INSERT
				for (const [type, value, prev_index, index] of diffs) {

					const prevRow = prevRows[prev_index];
					const local = locals[index];


					/// PATCH
					if (prevRow && prevRow.willRemoved) {
						// console.log("PATCH!!!", value);
						willRemoves = updateRepeatNode(prevRow, willRemoves, newRows, null, value, index, local);
						continue;
					}


					/// REPLACE
					let cursor = (prevRow && prevRow.node) || placeholderEnd;
					let newRow;

					newRow = willRemoves.find(row => row.value === value);
					if (newRow) {
						// console.log("REPLACE!!!", value);
						willRemoves = updateRepeatNode(newRow, willRemoves, newRows, cursor, value, index, local);
						continue;
					}


					/// REUSE
					newRow = willRemoves[0];
					if (newRow) {
						// console.log("REUSE!!!", value);
						willRemoves = updateRepeatNode(newRow, willRemoves, newRows, cursor, value, index, local);
						continue;
					}


					/// INSERT
					// console.log("INSERT!!!", value);
					newRow = createRepeatNode(repeatNode, context, local, value);
					willRemoves = updateRepeatNode(newRow, willRemoves, newRows, cursor, value, index, local);


					/// @FIXME: css-transition
					if (newRow.node.hasAttribute("css-transition")) {
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								const enter = newRow.node.getAttribute("css-transition") || "transition";
								newRow.node.classList.add(enter + "-enter");
							});
						})
					}
				}


				/// DELETE reminds
				willRemoves.forEach(row => {
					row.node.remove();
					row.context.disconnect();
				});

				return newRows;

			}, [])
			.subscribe();

		return false;
	}
});