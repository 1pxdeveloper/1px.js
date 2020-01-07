const NOT_CHANGED = "NOT_CHANGED"; // =;
const INSERT = "INSERT"; // +;
const DELETE = "DELETE"; // -;
const PATCH = "PATCH"; // -;

export function diff(oldArray, newArray, compareFn = Object.is, newStart = 0, newEnd = newArray.length - 1, oldStart = 0, oldEnd = oldArray.length - 1) {

	let rows = newEnd - newStart + 1;
	let cols = oldEnd - oldStart + 1;
	let dmax = rows + cols;

	let v = [];
	let d, k, r, c, pv, cv, pd;

	outer: for (d = 0; d <= dmax; d++) {
		pd = d - 1;
		pv = d > 0 ? v[d - 1] : [0, 0];
		cv = v[d] = [];

		for (k = -d; k <= d; k += 2) {
			if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
				c = pv[pd + k + 1];
			}
			else {
				c = pv[pd + k - 1] + 1;
			}

			r = c - k;

			while (c < cols && r < rows && compareFn(oldArray[oldStart + c], newArray[newStart + r])) {
				c++;
				r++;
			}

			if (c === cols && r === rows) {
				break outer;
			}

			cv[d + k] = c;
		}
	}

	let diff = Array(d / 2 + dmax / 2);
	let diffIndex = diff.length - 1;

	for (d = v.length - 1; d >= 0; d--) {

		// diagonal edge = equality
		while (c > 0 && r > 0 && compareFn(oldArray[oldStart + c - 1], newArray[newStart + r - 1])) {
			c--;
			r--;
			diff[diffIndex--] = [NOT_CHANGED, oldArray[oldStart + c], oldStart + c, newStart + r];
		}

		if (!d) break;
		pd = d - 1;
		pv = d ? v[d - 1] : [0, 0];
		k = c - r;

		// vertical edge = insertion
		if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
			r--;
			diff[diffIndex--] = [INSERT, newArray[newStart + r], oldStart + c, newStart + r];
		}

		// horizontal edge = deletion
		else {
			c--;
			diff[diffIndex--] = [DELETE, oldArray[oldStart + c], oldStart + c, newStart + r];
		}
	}

	return diff;
}

diff.NOT_CHANGED = NOT_CHANGED;
diff.INSERT = INSERT;
diff.DELETE = DELETE;
diff.PATCH = PATCH;
