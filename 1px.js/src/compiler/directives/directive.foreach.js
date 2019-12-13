import {_} from "../../fp";
import {$module} from "../module.js";
import {$compile} from "../compile";


/// Default Template Directive
$module.directive("*foreach", function() {
	
	function createRepeatNode(node, context, local) {
		node = node.cloneNode(true);
		context = context.fork(local);
		$compile(node, context);
		
		return {node, context, local};
	}
	
	return function(context, el, _script) {
		
		/// Parse [script] as [ROW], [INDEX]
		const [script, ROW, INDEX] = _.go(
			_script,
			_.rpartition(" as "),
			_.spread((script, sep, rest) => [script, ...rest.split(",", 2)]),
			_.map(_.trim)
		);
		
		/// Prepare Placeholder
		const repeatNode = el.cloneNode(true);
		repeatNode.removeAttribute("*foreach");
		
		const placeholder = document.createComment("foreach: " + _script);
		const placeholderEnd = document.createComment("endforeach");
		el.before(placeholder);
		el.replaceWith(placeholderEnd);
		
		
		////
		let container = [];
		
		context(script)
			.map(value => _.isArrayLike(value) ? value : [])
			.map(array => Array.from(array))
			.scan((prevArray, array) => {
				
				
				/// LCS Diff: LCS를 이용해서 같은건 유지하고, 삭제할 노드와 replace될 노드를 구분하는 로직을 짤것.
				/// @NOTE: d == undeinfed 삭제후보, e === undefined 교체.. e에 없는거 추가...
				const [d, e] = _.LCS(prevArray, array);
				
				let willRemoved = [];
				let noChanged = [];
				
				prevArray.forEach((value, index) => (d[index] === null ? willRemoved : noChanged).push(container[index]));
				noChanged.push({node: placeholderEnd});
				
				
				/// Render Diff
				let cursor = noChanged[0].node;
				
				container = array.map((value, index) => {
					
					/// 변화없음.
					if (e[index] !== null) {
						const r = noChanged.shift();
						cursor = noChanged[0].node;
						return r;
					}
					
					const local = Object.create(null);
					ROW && (local[ROW] = value);
					INDEX && (local[INDEX] = index);
					
					
					/// 추가
					if (!container[index] || willRemoved.length === 0) {
						const r = createRepeatNode(repeatNode, context, local);
						cursor.before(r.node);
						
						
						/// @FIXME: css-transition
						if (r.node.hasAttribute("css-transition")) {
							requestAnimationFrame(() => {
								requestAnimationFrame(() => {
									const enter = r.node.getAttribute("css-transition") || "transition";
									r.node.classList.add(enter + "-enter");
								})
							});
						}
						
						return r;
					}
					
					
					/// 교체
					container[index].context.locals$.next(local);
					willRemoved = willRemoved.filter(x => x !== container[index]);
					return container[index];
				});
				
				
				/// 삭제
				willRemoved.forEach(r => r.node.remove());
				
				return array;
				
			}, [])
			.subscribe();
		
		return false;
	}
});