(function() {
	const {$module} = require("./1px.module");
	const {$compile} = require("./compile");

	/// Default Template Directive
	$module.directive("*foreach", function() {

		function LCS(s1, s2) {
			s1 = s1 || [];
			s2 = s2 || [];

			let M = [];
			for (let i = 0; i <= s1.length; i++) {
				M.push([]);

				for (let j = 0; j <= s2.length; j++) {
					let currValue = 0;
					if (i === 0 || j === 0) {
						currValue = 0;
					}
					else if (s1[i - 1] === s2[j - 1]) {
						currValue = M[i - 1][j - 1] + 1;
					}
					else {
						currValue = Math.max(M[i][j - 1], M[i - 1][j]);
					}

					M[i].push(currValue);
				}
			}

			let i = s1.length;
			let j = s2.length;

			// let s3 = [];
			let s4 = [];
			let s5 = [];

			while (M[i][j] > 0) {
				if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
					// s3.unshift(s1[i - 1]);

					s4[i - 1] = s1[i - 1];
					s5[j - 1] = s1[i - 1];

					i--;
					j--;
				}
				else if (M[i - 1][j] > M[i][j - 1]) {
					i--;
				}
				else {
					j--;
				}
			}

			return [s4, s5];
		}

		/// @FIXME: 고급스럽게 전환하기
		function createRepeatNode(repeatNode, context, row, index, value, i) {
			let node = repeatNode.cloneNode(true);
			let _context = context.fork();

			row && (_context.local[row] = value);
			index && (_context.local[index] = i);

			$compile(node, _context);

			return {
				index: i,
				value: value,
				node: node,
				context: _context,
			}
		}

		return function(context, el, script) {

			/// Prepare Placeholder
			let placeholder = document.createComment("foreach: " + script);
			let placeholderEnd = document.createComment("endforech");
			let repeatNode = el.cloneNode(true);
			repeatNode.removeAttribute("*foreach");

			el.before(placeholder);
			el.replaceWith(placeholderEnd);


			////
			let container = [];
			let prevArray = [];

			context.watch$(script, array => {


				console.log(array);


				/// @FIXME: 고급스럽게 전환하기
				let [$row, $index] = array["@@keys"];
				array = array.map(v => v["@@entries"][0]);

				/// LCS 알고리즘을 통해 삭제할 노드와 남길 노드를 분리한다.
				let [d, e] = LCS(prevArray, array);

				let fixed_container = [];
				let values_for_reuse = [];

				prevArray.forEach((value, index) => {
					if (d[index] === undefined) {
						values_for_reuse[index] = value;
						container[index].context.disconnect();
						container[index].node.remove();
					}
					else {
						fixed_container.push(container[index]);
					}
				});
				fixed_container.push({node: placeholderEnd});


				/// 변경되지 않는 노드를 중심으로 새로운 노드들을 추가/재배치 한다.
				let placeholder_index = 0;
				let placeholder = fixed_container[placeholder_index].node;

				container = array.map((value, index) => {
					if (e[index] === undefined) {
						let idx = values_for_reuse.indexOf(value);
						let r = container[idx];
						if (r) {
							placeholder.before(r.node);
							delete container[idx];
						}
						else {
							r = createRepeatNode(repeatNode, context, $row, $index, value, index);
							placeholder.before(r.node);

							/// @FIXME...
							if (r.node.hasAttribute("css-transition")) {
								requestAnimationFrame(function() {
									requestAnimationFrame(function() {
										let enter = r.node.getAttribute("css-transition") || "transition";
										r.node.classList.add(enter + "-enter");
									});
								});
							}
						}

						return r;
					}

					let r = fixed_container[placeholder_index];
					placeholder = fixed_container[++placeholder_index].node;
					return r;
				});

				container.forEach((data, index) => {
					let _context = data.context;
					$row && (_context.local[$row] = data.value);
					$index && (_context.local[$index] = index);
				});

				prevArray = array.slice();
			});
		}
	});


	/// Directive: "*if"
	$module.directive("*if", function() {
		return function(context, el, script) {
			el.removeAttribute("*if");
			el.childNodes.forEach(node => $compile(node, context));

			let placeholder = document.createComment("if: " + script);
			el._ifScript = placeholder._ifScript = script;

			context.watch$(script, function(bool) {

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


			context.watch$(script, function(bool) {

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


})();