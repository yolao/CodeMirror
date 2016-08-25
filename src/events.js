import { indexOf } from "./utils";
import { e_defaultPrevented } from "./utils_events";

// EVENT HANDLING

// Lightweight event framework. on/off also work on DOM nodes,
// registering native DOM handlers.

export var on = function(emitter, type, f) {
  if (emitter.addEventListener)
    emitter.addEventListener(type, f, false);
  else if (emitter.attachEvent)
    emitter.attachEvent("on" + type, f);
  else {
    var map = emitter._handlers || (emitter._handlers = {});
    var arr = map[type] || (map[type] = []);
    arr.push(f);
  }
};

var noHandlers = []
export function getHandlers(emitter, type, copy) {
  var arr = emitter._handlers && emitter._handlers[type]
  if (copy) return arr && arr.length > 0 ? arr.slice() : noHandlers
  else return arr || noHandlers
}

export function off(emitter, type, f) {
  if (emitter.removeEventListener)
    emitter.removeEventListener(type, f, false);
  else if (emitter.detachEvent)
    emitter.detachEvent("on" + type, f);
  else {
    var handlers = getHandlers(emitter, type, false)
    for (var i = 0; i < handlers.length; ++i)
      if (handlers[i] == f) { handlers.splice(i, 1); break; }
  }
}

export function signal(emitter, type /*, values...*/) {
  var handlers = getHandlers(emitter, type, true)
  if (!handlers.length) return;
  var args = Array.prototype.slice.call(arguments, 2);
  for (var i = 0; i < handlers.length; ++i) handlers[i].apply(null, args);
}

// The DOM events that CodeMirror handles can be overridden by
// registering a (non-DOM) handler on the editor for the event name,
// and preventDefault-ing the event in that handler.
export function signalDOMEvent(cm, e, override) {
  if (typeof e == "string")
    e = {type: e, preventDefault: function() { this.defaultPrevented = true; }};
  signal(cm, override || e.type, cm, e);
  return e_defaultPrevented(e) || e.codemirrorIgnore;
}

export function signalCursorActivity(cm) {
  var arr = cm._handlers && cm._handlers.cursorActivity;
  if (!arr) return;
  var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
  for (var i = 0; i < arr.length; ++i) if (indexOf(set, arr[i]) == -1)
    set.push(arr[i]);
}

export function hasHandler(emitter, type) {
  return getHandlers(emitter, type).length > 0
}

// Add on and off methods to a constructor's prototype, to make
// registering events on such objects more convenient.
export function eventMixin(ctor) {
  ctor.prototype.on = function(type, f) {on(this, type, f);};
  ctor.prototype.off = function(type, f) {off(this, type, f);};
}

