Number.isNumber = (number) => +number === number;
DocumentFragment.from = (nodeList) => Array.from(nodeList).reduce((frag, node) => frag.appendChild(node) && frag, document.createDocumentFragment());