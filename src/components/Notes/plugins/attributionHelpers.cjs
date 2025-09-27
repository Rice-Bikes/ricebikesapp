// CommonJS variant of the helpers for node test
const store = new WeakMap();

function attachAttributionHelpers(editor) {
  if (!editor || typeof editor !== "object") {
    throw new TypeError("attachAttributionHelpers: editor must be an object");
  }
  if (store.has(editor)) {
    return () => {};
  }

  const state = {
    dirtyKeys: new Set(),
    user: null,
    subscribers: new Set(),
  };
  store.set(editor, state);

  function notify() {
    for (const cb of state.subscribers) {
      try {
        cb();
      } catch (err) {
        // swallow
      }
    }
  }

  Object.defineProperty(editor, "__getAttributionMeta", {
    configurable: true,
    enumerable: false,
    value: () => ({
      dirtyKeys: Array.from(state.dirtyKeys),
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: state.user,
    }),
  });

  Object.defineProperty(editor, "__setAttributionUser", {
    configurable: true,
    enumerable: false,
    value: (user) => {
      state.user = user;
      notify();
    },
  });

  Object.defineProperty(editor, "__markAttributionDirty", {
    configurable: true,
    enumerable: false,
    value: (keys) => {
      if (!keys) return;
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) {
        try {
          if (typeof k === "string" && k.length > 0) state.dirtyKeys.add(k);
        } catch (err) {
          // ignore
        }
      }
      notify();
    },
  });

  Object.defineProperty(editor, "__clearAttribution", {
    configurable: true,
    enumerable: false,
    value: () => {
      state.dirtyKeys.clear();
      notify();
    },
  });

  Object.defineProperty(editor, "__subscribeAttribution", {
    configurable: true,
    enumerable: false,
    value: (cb) => {
      state.subscribers.add(cb);
      return () => state.subscribers.delete(cb);
    },
  });

  return () => {
    try {
      if (editor.__getAttributionMeta) delete editor.__getAttributionMeta;
      if (editor.__setAttributionUser) delete editor.__setAttributionUser;
      if (editor.__markAttributionDirty) delete editor.__markAttributionDirty;
      if (editor.__clearAttribution) delete editor.__clearAttribution;
      if (editor.__subscribeAttribution) delete editor.__subscribeAttribution;
    } catch (err) {
      // ignore
    }
    store.delete(editor);
  };
}

module.exports = { attachAttributionHelpers };
