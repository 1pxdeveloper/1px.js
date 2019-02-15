let name = document.documentElement.getAttribute("module");
if (name) {
	window[name] = module;
}
