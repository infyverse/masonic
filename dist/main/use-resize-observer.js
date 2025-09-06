"use strict";

exports.__esModule = true;
exports.createResizeObserver = void 0;
exports.useResizeObserver = useResizeObserver;

var _rafSchd = /*#__PURE__*/_interopRequireDefault( /*#__PURE__*/require("raf-schd"));

var React = /*#__PURE__*/_interopRequireWildcard( /*#__PURE__*/require("react"));

var _trieMemoize = /*#__PURE__*/_interopRequireDefault( /*#__PURE__*/require("trie-memoize"));

var _elementsCache = /*#__PURE__*/require("./elements-cache");

var _useForceUpdate = /*#__PURE__*/require("./use-force-update");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a resize observer that forces updates to the grid cell positions when mutations are
 * made to cells affecting their height.
 *
 * @param positioner - The masonry cell positioner created by the `usePositioner()` hook.
 */
function useResizeObserver(positioner) {
  const forceUpdate = (0, _useForceUpdate.useForceUpdate)();
  const resizeObserver = createResizeObserver(positioner, forceUpdate); // Cleans up the resize observers when they change or the
  // component unmounts

  function _ref() {
    return resizeObserver.disconnect();
  }

  React.useEffect(() => _ref, [resizeObserver]);
  return resizeObserver;
}

const _handlerForType = /*#__PURE__*/(0, _rafSchd.default)(target => {});

function _ref2(handler) {
  handler.cancel();
}

/**
 * Creates a resize observer that fires an `updater` callback whenever the height of
 * one or many cells change. The `useResizeObserver()` hook is using this under the hood.
 *
 * @param positioner - A cell positioner created by the `usePositioner()` hook or the `createPositioner()` utility
 * @param updater - A callback that fires whenever one or many cell heights change.
 */
const createResizeObserver = exports.createResizeObserver = /*#__PURE__*/(0, _trieMemoize.default)([WeakMap], // TODO: figure out a way to test this

/* istanbul ignore next */
(positioner, updater) => {
  const updates = [];
  const update = (0, _rafSchd.default)(() => {
    if (updates.length > 0 && document.fullscreenElement === null) {
      // Updates the size/positions of the cell with the resize
      // observer updates
      positioner.update(updates);
      updater(updates);
    }

    updates.length = 0;
  });

  const commonHandler = target => {
    const height = target.offsetHeight;

    if (height > 0) {
      const index = _elementsCache.elementsCache.get(target);

      if (index !== void 0) {
        const position = positioner.get(index);
        if (position !== void 0 && height !== position.height) updates.push(index, height);
      }
    }

    update();
  };

  const handlers = new Map();

  const handleEntries = entries => {
    let i = 0;

    for (; i < entries.length; i++) {
      const entry = entries[i];

      const index = _elementsCache.elementsCache.get(entry.target);

      if (index === void 0) continue;
      let handler = handlers.get(index);

      if (!handler) {
        handler = (0, _rafSchd.default)(commonHandler);
        handlers.set(index, handler);
      }

      handler(entry.target);
    }
  };

  const ro = new ResizeObserver(handleEntries); // Overrides the original disconnect to include cancelling handling the entries.
  // Ideally this would be its own method but that would result in a breaking
  // change.

  const disconnect = ro.disconnect.bind(ro);

  ro.disconnect = () => {
    disconnect();
    handlers.forEach(_ref2);
  };

  return ro;
});