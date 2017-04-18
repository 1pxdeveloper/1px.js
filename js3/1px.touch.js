module.factory("touch", function() {

	var TOUCH_START = "touchstart";
	var TOUCH_MOVE = "touchmove";
	var TOUCH_END = "touchend";
	var TOUCH_CANCEL = "touchcancel";

	if (!("ontouchstart" in document)) {
		TOUCH_START = "mousedown";
		TOUCH_MOVE = "mousemove";
		TOUCH_END = "mouseup";
		TOUCH_CANCEL = "contextmenu";
	}

	function Pointer(pointer, event) {
		this.type = event.type;
		this.target = event.target;
		this.currentTarget = event.currentTarget;
		this.timeStamp = event.timeStamp;

		this.pageX = pointer.pageX;
		this.pageY = pointer.pageY;
		this.clientX = pointer.clientX;
		this.clientY = pointer.clientY;
		this.screenX = pointer.screenX;
		this.screenY = pointer.screenY;

		var rect = this.currentTarget.getBoundingClientRect();
		this.offsetX = this.clientX - rect.left;
		this.offsetY = this.clientY - rect.top;


		this.start = {
			pageX: this.pageX,
			pageY: this.pageY,
			clientX: this.clientX,
			clientY: this.clientY,
			screenX: this.screenX,
			screenY: this.screenY
		};

		this.deltaX = 0;
		this.deltaY = 0;
		this.distanceX = 0;
		this.distanceY = 0;
		this.displacementX = 0;
		this.displacementY = 0;
		this.displacementXTimeStamp = event.timeStamp;
		this.displacementYTimeStamp = event.timeStamp;
		this.velocityX = 0;
		this.velocityY = 0;

		this.scale = 1;
		this.d = 0;

		this.isPanStart = false;
		this.isPanning = false;
		this.isPanEnd = false;
	}

	Pointer.map = {};

	Pointer.prototype = {
		update: function(pointer, event) {
			var prevTimeStamp = this.timeStamp;
			this.timeStamp = event.timeStamp;

			this.deltaX = pointer.screenX - this.screenX;
			this.deltaY = pointer.screenY - this.screenY;
			this.distanceX = pointer.screenX - this.start.screenX;
			this.distanceY = pointer.screenY - this.start.screenY;

			if (this.velocityY * this.deltaY < 0) {
				this.displacementY = 0;
				this.displacementYTimeStamp = prevTimeStamp;
				this.velocityY = 0;
			}

			if (this.velocityX * this.deltaX < 0) {
				this.displacementX = 0;
				this.displacementXTimeStamp = prevTimeStamp;
				this.velocityX = 0;
			}

			this.displacementX += this.deltaX;
			this.displacementY += this.deltaY;

			this.velocityX = this.displacementX / (this.timeStamp - this.displacementXTimeStamp);
			this.velocityY = this.displacementY / (this.timeStamp - this.displacementYTimeStamp);
			this.velocityX = this.velocityX === this.velocityX ? this.velocityX : 0; // NaN 처리
			this.velocityY = this.velocityY === this.velocityY ? this.velocityY : 0; // NaN 처리

			this.isPanStart = this.type === TOUCH_START && event.type === TOUCH_MOVE;
			this.isPanning = this.type === TOUCH_MOVE && event.type === TOUCH_MOVE;
			this.isPanEnd = this.type === TOUCH_MOVE && event.type === TOUCH_END;

			this.type = event.type;
			this.pageX = pointer.pageX;
			this.pageY = pointer.pageY;
			this.clientX = pointer.clientX;
			this.clientY = pointer.clientY;
			this.screenX = pointer.screenX;
			this.screenY = pointer.screenY;

			var rect = this.currentTarget.getBoundingClientRect();
			this.offsetX = this.clientX - rect.left;
			this.offsetY = this.clientY - rect.top;
		},

		contains: function(element) {
			var rect = element.getBoundingClientRect();
			var x = this.clientX;
			var y = this.clientY;

			return (rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right);
		}
	};


	function getElementPointersFromTouches(element, touches) {
		var pointers = [];

		foreach(touchElements, function(touchElement) {
			if (touchElement.element !== element) {
				return;
			}

			var pointer = Pointer.map[touchElement.identifier];
			if (pointer) {
				pointers.push(pointer);
			}
		});

		return pointers;
	}

	function PointerEvent(element, event) {

		// 변경된 터치 계산 값 추출
		var pointers = getElementPointersFromTouches(element, event.changedTouches);

		//if (pointers.length >= 2) {
		//	var p1 = pointers[0];
		//	var p2 = pointers[1];
		//
		//	var d = Math.sqrt(Math.pow(p1.screenX - p2.screenX, 2) + Math.pow(p1.screenY - p2.screenY, 2));
		//	var scale = d / p1.d;
		//	scale = scale === scale ? scale : 1;
		//	p1.scale = p2.scale = scale;
		//	p1.d = p2.d = d;
		//}

		if (pointers[0]) {
			Object.assign(this, pointers[0]);
		}

		this.type = event.type;
		this.target = event.target;
		this.currentTarget = element;
		this.originalEvent = event;
		this.pointers = getElementPointersFromTouches(element, event.touches);

		switch(this.type) {
			case TOUCH_START:
				this.action = "START";
			break;

			case TOUCH_MOVE:
				this.action = "MOVE";
			break;

			case TOUCH_END:
				this.action = "END";
			break;
		}
	}


	function touchDelegate(event) {
		foreach(event.changedTouches, function(touch) {
			var pointer = Pointer.map[touch.identifier];
			if (pointer) {
				pointer.update(touch, event);
			}
		});

		foreach(touchElements, function(touchElement) {
			var pointerEvent = new PointerEvent(touchElement.element, event);
			touchElement.handler(pointerEvent);
		});
	}

	function ontouchmove(event) {

	}

	function ontouchend(event) {

	}

	window.addEventListener(TOUCH_MOVE, function(event) {
		if (!touchElements.length || event.buttons === 0) return;

		event.identifier = 0;
		event.changedTouches = event.changedTouches || [event];
		event.touches = event.touches || [event];
		touchDelegate(event);
	}, true);

	window.addEventListener(TOUCH_END, function(event) {
		if (!touchElements.length) return;

		event.identifier = 0;
		event.changedTouches = event.changedTouches || [event];
		event.touches = event.touches || [event];
		touchDelegate(event);

		foreach(event.changedTouches, function(touch) {
			delete Pointer.map[touch.identifier];
			touchElements = touchElements.filter(function(touchElement) {
				return touchElement.identifier !== touch.identifier;
			})
		});

	}, true);

	var touchElements = [];

	function addTouchElement(value) {
		if (touchElements.some(function(t) { return t.element === value.elemenet })) {
			return;
		}
		touchElements.push(value);
	}

	return {
		bind: function(element, handler) {
			element.addEventListener(TOUCH_START, function(event) {
				event.preventDefault();

				event.changedTouches = event.changedTouches || [event];
				event.touches = event.touches || [event];

				foreach(event.changedTouches, function(touch) {
					touch.identifier = touch.identifier || 0;

					var touchElement = {
						element: element,
						event: event,
						identifier: touch.identifier,
						handler: handler
					};

					addTouchElement(touchElement);
					Pointer.map[touch.identifier] = new Pointer(touch, event);
				});

				touchDelegate(event);
			});
		}
	}
});

module.directive("(touch)", function(touch) {

	return function(element, scope, script) {

		var handler = function(event) {
			var _scope = scope.fork();
			_scope.value("event", event);
			_scope.eval(script);
		};

		touch.bind(element, handler);
	}
});


module.directive("(click)", function(touch) {

	return function(element, scope, script) {


		var handler = function(event) {
			if (event.action !== "END" || !event.pointers[0].contains(event.currentTarget)) {
				return;
			}

			var _scope = scope.fork();
			_scope.value("event", event);
			_scope.eval(script);
		};

		touch.bind(element, handler);
	}
});



//(function(window, document, undefined) {
//
//	function $matches(elm, selector) {
//		var matches = (elm.document || elm.ownerDocument).querySelectorAll(selector),
//			i = matches.length;
//		while (--i >= 0 && matches.item(i) !== elm) {}
//		return i > -1;
//	}
//
//	function matchesSelector(el, selector) {
//		if (!el || el.nodeType !== 1) return false;
//		var matches = el.matches || el.matchesSelector || el.webkitMatchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.oMatchesSelector;
//		if (!matches) {
//			return $matches(el, selector);
//		}
//		return matches.call(el, selector);
//	}
//
//	function $$closest(element, selector) {
//
//		while (element) {
//			if (matchesSelector(element, selector)) {
//				return element;
//			}
//			element = element.parentNode;
//		}
//
//		return null;
//	}
//
//	function $isDisabled(element) {
//		return $$closest(element, "[disabled]");
//	}
//
//	var LONG_PRESS_DELAY = 750;
//	var SCROLL_CHECK_DELAY = 100;
//
//
//
/////
//	var activeTouchElements = [];
//
//	function hasAttribute(el, attr) {
//		return el && el.hasAttribute && el.hasAttribute(attr);
//	}
//
//	function arrayPushOnce(array, obj) {
//		if (array.indexOf(obj) === -1) {
//			array.push(obj);
//		}
//	}
//
//	function isTouchFreeze(el) {
//		el = $(el)[0];
//		var freeze = $$closest(el, "[wux-touch-freeze]");
//		return freeze && freeze !== el;
//	}
//
//
//	function removeActiveTouchElement(element) {
//		var index = activeTouchElements.indexOf(element);
//		if (index !== -1) {
//			element.$isFinished = true;
//			element.$$touch.$touchIds = [];
//			scrollCheckRelease(element);
//			activeTouchElements.splice(index, 1);
//		}
//	}
//
//	function scrollCheck(element, fn) {
//		scrollCheckRelease(element);
//
//		var handler = function(e) {
//			if (hasAttribute(e.target, "wux-touch-scroll-allow")) {
//				return;
//			}
//
//			// 스크롤된 element에 포함되어 있는지?
//			if (!e.target.contains(element)) {
//				return;
//			}
//
//			window.removeEventListener("scroll", handler, true);
//			fn(e);
//		};
//		window.addEventListener("scroll", handler, true);
//		element.$$touch.$scrollCheckHandler = handler;
//	}
//
//	function scrollCheckRelease(element) {
//		window.removeEventListener("scroll", element.$$touch.$scrollCheckHandler, true);
//		element.$$touch.$scrollCheckHandler = null;
//		element.$$touch.$isScrolled = false;
//	}
//
//
//	function Pointer(pointer, event) {
//		this.type = event.type;
//		this.target = event.target;
//		this.timeStamp = event.timeStamp;
//
//		this.pageX = pointer.pageX;
//		this.pageY = pointer.pageY;
//		this.clientX = pointer.clientX;
//		this.clientY = pointer.clientY;
//		this.screenX = pointer.screenX;
//		this.screenY = pointer.screenY;
//
//		this.start = {
//			pageX: this.pageX,
//			pageY: this.pageY,
//			clientX: this.clientX,
//			clientY: this.clientY,
//			screenX: this.screenX,
//			screenY: this.screenY
//		};
//
//		this.deltaX = 0;
//		this.deltaY = 0;
//		this.distanceX = 0;
//		this.distanceY = 0;
//		this.displacementX = 0;
//		this.displacementY = 0;
//		this.displacementXTimeStamp = event.timeStamp;
//		this.displacementYTimeStamp = event.timeStamp;
//		this.velocityX = 0;
//		this.velocityY = 0;
//
//		this.scale = 1;
//		this.d = 0;
//
//		this.isPanStart = false;
//		this.isPanning = false;
//		this.isPanEnd = false;
//	}
//
//	Pointer.map = {};
//
//	Pointer.prototype = {
//		update: function(pointer, event) {
//			var prevTimeStamp = this.timeStamp;
//			this.timeStamp = event.timeStamp;
//
//			this.deltaX = pointer.screenX - this.screenX;
//			this.deltaY = pointer.screenY - this.screenY;
//			this.distanceX = pointer.screenX - this.start.screenX;
//			this.distanceY = pointer.screenY - this.start.screenY;
//
//			if (this.velocityY * this.deltaY < 0) {
//				this.displacementY = 0;
//				this.displacementYTimeStamp = prevTimeStamp;
//				this.velocityY = 0;
//			}
//
//			if (this.velocityX * this.deltaX < 0) {
//				this.displacementX = 0;
//				this.displacementXTimeStamp = prevTimeStamp;
//				this.velocityX = 0;
//			}
//
//			this.displacementX += this.deltaX;
//			this.displacementY += this.deltaY;
//
//			this.velocityX = this.displacementX / (this.timeStamp - this.displacementXTimeStamp);
//			this.velocityY = this.displacementY / (this.timeStamp - this.displacementYTimeStamp);
//			this.velocityX = this.velocityX === this.velocityX ? this.velocityX : 0; // NaN 처리
//			this.velocityY = this.velocityY === this.velocityY ? this.velocityY : 0; // NaN 처리
//
//			this.isPanStart = this.type === TOUCH_START && event.type === TOUCH_MOVE;
//			this.isPanning = this.type === TOUCH_MOVE && event.type === TOUCH_MOVE;
//			this.isPanEnd = this.type === TOUCH_MOVE && event.type === TOUCH_END;
//
//			this.type = event.type;
//			this.pageX = pointer.pageX;
//			this.pageY = pointer.pageY;
//			this.clientX = pointer.clientX;
//			this.clientY = pointer.clientY;
//			this.screenX = pointer.screenX;
//			this.screenY = pointer.screenY;
//		},
//
//		contains: function(element) {
//			var rect = element.getBoundingClientRect();
//			var x = this.clientX;
//			var y = this.clientY;
//
//			return (rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right);
//		}
//	};
//
//
//	function dispatchPointerEvent(element, pointerEvent) {
//		if ($isDisabled(element)) {
//			return;
//		}
//
//		if (isTouchFreeze(element)) {
//			return;
//		}
//
//		if (element.$$touch.$isFinished) {
//			return;
//		}
//
//		var handlers = element.$$touch.$handlers;
//
//		var types = ["press", "down", "panstart", "pan", "pan-x", "pan-y", "panend", "tap", "up", "release", "longpress"];
//
//		for (var i = 0; i < types.length; i++) {
//
//			var type = types[i];
//
//			if (!handlers.hasOwnProperty(type)) {
//				continue;
//			}
//
//			if (typeof dispatchPointerEvent.delegate[type] !== "function") {
//				continue;
//			}
//
//			if (type === "panstart" && (handlers["pan"] || handlers["pan-x"] || handlers["pan-y"])) {
//				continue;
//			}
//
//			var handler = handlers[type];
//
//			if (dispatchPointerEvent.delegate[type].call(handlers, element, pointerEvent, handler) === false) {
//				element.$$touch.$isFinished = true;
//			}
//
//			if (element.$$touch.$isFinished) {
//				removeActiveTouchElement(element);
//				break;
//			}
//		}
//
//		/// 남아있는 터치가 없으면 터치 프로세스 종료
//		if (pointerEvent.pointers.length === 0) {
//			element.$$touch.$isFinished = true;
//			removeActiveTouchElement(element);
//		}
//	}
//
//	dispatchPointerEvent.delegate = {
//
//		"press": function(el, event, handler) {
//			if (event.type === TOUCH_START && event.pointers.length === 1) {
//				return handler(event);
//			}
//		},
//
//		"down": function(el, event, handler) {
//			if (event.type === TOUCH_START) {
//				return handler(event);
//			}
//		},
//
//		"panstart": function(el, event, handler) {
//			if (event.type === TOUCH_MOVE && event.isPanStart) {
//				return handler(event);
//			}
//		},
//
//		"pan": function(el, event, handler) {
//			if (event.type === TOUCH_MOVE && event.isPanStart) {
//				event.originalEvent.preventDefault();
//
//				var handlers = el.$$touch.$handlers;
//				if (typeof handlers["panstart"] === "function") {
//					if (dispatchPointerEvent.delegate["panstart"].call(handlers, el, event, handlers["panstart"]) === false) {
//						return false;
//					}
//				}
//
//				return handler(event);
//			}
//
//			if (event.type === TOUCH_MOVE && event.isPanning) {
//				event.originalEvent.preventDefault();
//				return handler(event);
//			}
//		},
//
//		"pan-x": function(el, event, handler) {
//			if (event.type === TOUCH_START) {
//				scrollCheck(el, function() {
//					el.$$touch.$isScrolled = true;
//				});
//				return;
//			}
//
//			if (event.type === TOUCH_MOVE && event.isPanStart) {
//				setTimeout(function() {
//					if (el.$$touch.$isScrolled) {
//						return;
//					}
//
//					var handlers = el.$$touch.$handlers;
//					if (typeof handlers["panstart"] === "function") {
//						if (dispatchPointerEvent.delegate["panstart"].call(handlers, el, event, handlers["panstart"]) === false) {
//							el.$$touch.$isFinished = true;
//							return false;
//						}
//					}
//				}, SCROLL_CHECK_DELAY);
//			}
//
//			if (event.type === TOUCH_MOVE && event.isPanning) {
//				if (el.$$touch.$isScrolled) {
//					return;
//				}
//
//				event.originalEvent.preventDefault();
//				return handler(event);
//			}
//		},
//
//		"pan-y": function(el, event, handler) {
//
//			if (event.type === TOUCH_MOVE && event.isPanStart) {
//				event.originalEvent.preventDefault();
//
//				var handlers = el.$$touch.$handlers;
//				if (typeof handlers["panstart"] === "function") {
//					if (dispatchPointerEvent.delegate["panstart"].call(handlers, el, event, handlers["panstart"]) === false) {
//						return false;
//					}
//				}
//
//				return handler(event);
//			}
//
//			if (event.type === TOUCH_MOVE && event.isPanning) {
//				event.originalEvent.preventDefault();
//				return handler(event);
//			}
//		},
//
//		"panend": function(el, event, handler) {
//			if (event.type === TOUCH_END && event.isPanEnd) {
//				if (el.$$touch.$isScrolled) {
//					return;
//				}
//
//				return handler(event);
//			}
//		},
//
//		"tap": function(el, event, handler) {
//			if (event.type === TOUCH_START) {
//				scrollCheck(el, function() {
//					el.$$touch.$isScrolled = true;
//				});
//				return;
//			}
//
//			if (event.type === TOUCH_END && !event.isPanEnd && event.pointers.length === 0) {
//				if (el.$$touch.$isScrolled) {
//					return;
//				}
//
//				return handler(event);
//			}
//		},
//
//		"up": function(el, event, handler) {
//			if (event.type === TOUCH_END) {
//				return handler(event);
//			}
//		},
//
//		"release": function(el, event, handler) {
//			if (event.type === TOUCH_END && event.pointers.length === 0) {
//				return handler(event);
//			}
//		},
//
//		"cancel": function(el, event, handler) {
//			if (event.type === TOUCH_CANCEL) {
//				el.$$touch.$isFinished = true;
//				return handler(event);
//			}
//		},
//
//		"longpress": function(el, event, handler) {
//
////			if (event.type === TOUCH_START && event.pointers.length === 1) {
////				scrollCheck(el, function() {
////					el.$$touch.$isScrolled = true;
////				});
////
////				if (el.$$touch.$longPressTimer) {
////					$timeout.cancel(el.$$touch.$longPressTimer);
////					el.$$touch.$longPressTimer = null;
////				}
////
////				el.$$touch.$longPressTimer = $timeout(function() {
////					if (el.$$touch.$isScrolled) {
////						return;
////					}
////
////					el.$$touch.$isFinished = true;
////					var ret = handler(event);
////					$timeout(noop);
////					return ret;
////
////				}, LONG_PRESS_DELAY);
////
////				return;
////			}
////
////			if (event.type === TOUCH_MOVE || event.type === TOUCH_END) {
////				if (el.$$touch.$longPressTimer) {
////					$timeout.cancel(el.$$touch.$longPressTimer);
////					el.$$touch.$longPressTimer = null;
////				}
////			}
//		}
//	};
//
//
//	function touchEventDelegate(event) {
//		// convert changedTouches to Pointer & update
//		foreach(event.changedTouches, function(touch) {
//			var pointer = Pointer.map[touch.identifier] = Pointer.map[touch.identifier] || new Pointer(touch, event);
//			pointer.update(touch, event);
//		});
//
//
//		/// Dispatch PointerEvent to ActiveTouchElements
//		foreach(activeTouchElements.slice(), function(element) {
//			if (!element.$$touch || !element.$$touch.$touchIds || !element.$$touch.$handlers) {
//				removeActiveTouchElement(element);
//				return;
//			}
//
//			dispatchPointerEvent(element, new PointerEvent(element, event));
//		});
//
//
//		/// 남아있는 터치로 포인터 맵 최신화
//		var _map = Pointer.map;
//		Pointer.map = {};
//		foreach(event.touches, function(touch) {
//			Pointer.map[touch.identifier] = _map[touch.identifier];
//		});
//
//
//		foreach(activeTouchElements.slice(), function(element) {
//			var pointerEvent = new PointerEvent(element, event);
//
//			// 터치가 없을 경우,
//			if (pointerEvent.pointers.length === 0) {
//
//				// 그 전에 완료처리가 되지 않았다면,
//				if (!element.$$touch.$isFinished) {
//
//					// cancel이벤트를 호출해준다.
//					if (typeof element.$$touch.$handlers["cancel"] === "function") {
//						element.$$touch.$handlers["cancel"](pointerEvent);
//					}
//				}
//
//				// 터치엘리먼트 목록에서 제외한다
//				removeActiveTouchElement(element);
//			}
//		});
//	}
//
//
//	/// bind Touch Event
//	if (TOUCH_START === "touchstart") {
//		window.addEventListener("touchstart", function(event) {
//			setTimeout(function() {
//				touchEventDelegate(event);
//			}, 0);
//		}, true);
//
//		window.addEventListener("touchmove", touchEventDelegate, true);
//		window.addEventListener("touchend", touchEventDelegate, true);
//		window.addEventListener("touchcancel", touchEventDelegate, true);
//	}
//
//	// mouseEvent Emulator
//	else {
//		window.addEventListener("mousedown", function(e) {
//			setTimeout(function() {
//				e.identifier = 0;
//				e.changedTouches = [e];
//				e.touches = [e];
//				touchEventDelegate(e);
//			}, 0);
//		}, true);
//
//		window.addEventListener("mousemove", function(e) {
//			if (e.buttons === 0) {
//				return;
//			}
//
//			e.identifier = 0;
//			e.changedTouches = [e];
//			e.touches = [e];
//			touchEventDelegate(e);
//		}, true);
//
//		window.addEventListener("mouseup", function(e) {
//			e.identifier = 0;
//			e.changedTouches = [e];
//			e.touches = [];
//			touchEventDelegate(e);
//		}, true);
//
//		window.addEventListener("contextmenu", function() {
//			$touch.cancel();
//		}, true);
//
//		window.addEventListener("blur", function(e) {
//			if (e.target !== window) {
//				return;
//			}
//
//			$touch.cancel();
//		}, false);
//
//		// 마우스 버전은 스크롤 체크 기능 해제
//		scrollCheck = noop;
//		scrollCheckRelease = noop;
//	}
//
//
//	/// export $touch
//	var $touch = {
//
//		bind: function(element, handlers) {
//
//			// pre-process arguments
//			element = $(element)[0];
//			handlers = typeof handlers === "function" ? handlers(element) : handlers;
//
//
//			// 터치 이벤트 핸들러 등록
//			element.$$touch = element.$$touch || {};
//			element.$$touch.$touchIds = element.$$touch.$touchIds || [];
//			element.$$touch.$handlers = element.$$touch.$handlers || {};
//			element.$$touch.$isScrolled = element.$$touch.$isScrolled || false;
//			element.$$touch.$scrollCheckHandler = element.$$touch.$scrollCheckHandler || null;
//			extend(element.$$touch.$handlers, handlers);
//
//
//			// 터치 시작 시, active Touch Element로 등록한다
//			element.addEventListener(TOUCH_START, function(event) {
//
////				if ($isDisabled(element)) {
////					return;
////				}
//
//				if (isTouchFreeze(element)) {
//					return;
//				}
//
//				// @NOTE: 대개 터치 이벤트는 bubbling을 하지 않는다. 편의를 위해 stopPropagation()을 기본으로 지정함.
//				if (hasAttribute(element, "wux-touch-propagation")) {
//					event.stopPropagation();
//				}
//
//				element.$$touch.$isFinished = false;
//
//				foreach(event.changedTouches || [{identifier: 0}], function(touch) {
//					arrayPushOnce(element.$$touch.$touchIds, touch.identifier);
//				});
//
//				arrayPushOnce(activeTouchElements, element);
//			});
//		},
//
//		unbind: function(element) {
//			element.$$touch = {};
//			element.$$touch.$touchIds = element.$$touch.$touchIds || [];
//			element.$$touch.$handlers = element.$$touch.$handlers || {};
//			element.$$touch.$isScrolled = element.$$touch.$isScrolled || false;
//			element.$$touch.$scrollCheckHandler = element.$$touch.$scrollCheckHandler || null;
//		},
//
//		cancel: function() {
//			foreach(activeTouchElements, function(element) {
//				element.$$touch.$touchIds = [];
//				element.$$touch.$isFinished = true;
//				scrollCheckRelease(element);
//
//				var pointerEvent = new PointerEvent(element, {
//					type: TOUCH_CANCEL,
//					changedTouches: [],
//					touches: []
//				});
//
//				if (typeof element.$$touch.$handlers["cancel"] === "function") {
//					element.$$touch.$handlers["cancel"](pointerEvent);
//				}
//			});
//
//			activeTouchElements = [];
//		},
//
//		freeze: function(element, type) {
//			element = $(element);
//			element.attr("wux-touch-freeze", type || true);
//		},
//
//		seal: function(element) {
//			element = $(element);
//			element.removeAttr("wux-touch-freeze");
//		}
//	};
//
//	module.value("touch", $touch);
//
//	module.directive("(touch)", function() {
//		return function(el, $scope, to) {
//			var value = el.getAttribute("(touch)");
//			var handler = $parse(value, $scope.$$)($scope);
//
//			return $touch.bind(to, handler);
//		}
//	});
//
//	window.$touch = $touch;
//
//})(window, document);
//
