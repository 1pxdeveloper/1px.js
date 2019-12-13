import {$module} from "../module.js";
import {$compile} from "../compile";


/// Directive: "*if"
$module.directive("*if", function() {
	return function(context, el, script) {
		el.removeAttribute("*if");
		$compile(el, context);
		
		let placeholder = document.createComment("if: " + script);
		el._ifScript = placeholder._ifScript = script;
		
		context(script)
			.subscribe((bool) => {
				if (bool) {
					placeholder.replaceWith(el);
				}
				else {
					el.replaceWith(placeholder);
				}
			});
	}
});


/// @TODO: 사실은 *if watch에서 모든것을 처리하고 placeholder는 1개만 가져가는게 더 좋을텐데...
/// @TODO: *if 부터 false일때 => 전달 => 전달 하는 식으로...


/// Directive: "*else"
$module.directive("*else", function() {
	return function(context, el, script) {
		el.removeAttribute("*else");
		let placeholder = document.createComment("else: " + script);
		
		/// prev가 ifScript가 있거나...
		
		let prev = el.previousSibling;
		for (let i = 0; i < 5; i++) {
			prev = prev.previousSibling;
			if (prev._ifScript) {
				script = prev._ifScript;
				// console.log("#############", prev, prev.ifScript);
				break;
			}
		}
		
		script = "!(" + script + ")";
		
		// console.log(script);
		
		
		context(script).subscribe((bool) => {
			
			if (bool) {
				if (placeholder.parentNode) {
					placeholder.replaceWith(el);
				}
			}
			else {
				el.replaceWith(placeholder);
			}
			
			// console.log("if", script, bool);
		});
	}
});