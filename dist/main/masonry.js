"use strict";

exports.__esModule = true;
exports.Masonry = Masonry;

var _windowSize = /*#__PURE__*/require("@react-hook/window-size");

var React = /*#__PURE__*/_interopRequireWildcard( /*#__PURE__*/require("react"));

var _masonryScroller = /*#__PURE__*/require("./masonry-scroller");

var _useContainerPosition = /*#__PURE__*/require("./use-container-position");

var _usePositioner = /*#__PURE__*/require("./use-positioner");

var _useResizeObserver = /*#__PURE__*/require("./use-resize-observer");

var _useScrollToIndex = /*#__PURE__*/require("./use-scroll-to-index");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const __reactCreateElement__ = React.createElement;

/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 *
 * @param props
 */
function Masonry(props) {
  const containerRef = React.useRef(null);
  const windowSize = (0, _windowSize.useWindowSize)({
    initialWidth: props.ssrWidth,
    initialHeight: props.ssrHeight
  });
  const containerPos = (0, _useContainerPosition.useContainerPosition)(containerRef, windowSize);
  const nextProps = Object.assign({
    offset: containerPos.offset,
    width: containerPos.width || windowSize[0],
    height: windowSize[1],
    containerRef
  }, props);
  nextProps.positioner = (0, _usePositioner.usePositioner)(nextProps);
  nextProps.resizeObserver = (0, _useResizeObserver.useResizeObserver)(nextProps.positioner);
  const scrollToIndex = (0, _useScrollToIndex.useScrollToIndex)(nextProps.positioner, {
    height: nextProps.height,
    offset: containerPos.offset,
    align: typeof props.scrollToIndex === "object" ? props.scrollToIndex.align : void 0
  });
  const index = props.scrollToIndex && (typeof props.scrollToIndex === "number" ? props.scrollToIndex : props.scrollToIndex.index);
  React.useEffect(() => {
    if (index !== void 0) scrollToIndex(index);
  }, [index, scrollToIndex]);
  return __reactCreateElement__(_masonryScroller.MasonryScroller, nextProps);
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  Masonry.displayName = "Masonry";
}