"use strict";

exports.__esModule = true;
exports.useScrollToIndex = useScrollToIndex;

var _event = /*#__PURE__*/_interopRequireDefault( /*#__PURE__*/require("@react-hook/event"));

var _latest = /*#__PURE__*/_interopRequireDefault( /*#__PURE__*/require("@react-hook/latest"));

var _throttle = /*#__PURE__*/require("@react-hook/throttle");

var React = /*#__PURE__*/_interopRequireWildcard( /*#__PURE__*/require("react"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A hook that creates a callback for scrolling to a specific index in
 * the "items" array.
 *
 * @param positioner - A positioner created by the `usePositioner()` hook
 * @param options - Configuration options
 */
function useScrollToIndex(positioner, options) {
  var _latestOptions$curren;

  const {
    align = "top",
    element = typeof window !== "undefined" && window,
    offset = 0,
    height = typeof window !== "undefined" ? window.innerHeight : 0
  } = options;
  const latestOptions = (0, _latest.default)({
    positioner,
    element,
    align,
    offset,
    height
  });
  const getTarget = React.useRef(() => {
    const latestElement = latestOptions.current.element;
    return latestElement && "current" in latestElement ? latestElement.current : latestElement;
  }).current;
  const [state, dispatch] = React.useReducer((state, action) => {
    const nextState = {
      position: state.position,
      index: state.index,
      prevTop: state.prevTop
    };
    /* istanbul ignore next */

    if (action.type === "scrollToIndex") {
      var _action$value;

      return {
        position: latestOptions.current.positioner.get((_action$value = action.value) !== null && _action$value !== void 0 ? _action$value : -1),
        index: action.value,
        prevTop: void 0
      };
    } else if (action.type === "setPosition") {
      nextState.position = action.value;
    } else if (action.type === "setPrevTop") {
      nextState.prevTop = action.value;
    } else if (action.type === "reset") {
      return defaultState;
    }

    return nextState;
  }, defaultState);
  const throttledDispatch = (0, _throttle.useThrottleCallback)(dispatch, 15); // If we find the position along the way we can immediately take off
  // to the correct spot.

  (0, _event.default)(getTarget(), "scroll", () => {
    if (!state.position && state.index) {
      const position = latestOptions.current.positioner.get(state.index);

      if (position) {
        dispatch({
          type: "setPosition",
          value: position
        });
      }
    }
  }); // If the top changes out from under us in the case of dynamic cells, we
  // want to keep following it.

  const currentTop = state.index !== void 0 && ((_latestOptions$curren = latestOptions.current.positioner.get(state.index)) === null || _latestOptions$curren === void 0 ? void 0 : _latestOptions$curren.top);
  React.useEffect(() => {
    const target = getTarget();
    if (!target) return;
    const {
      height,
      align,
      offset,
      positioner
    } = latestOptions.current;

    if (state.position) {
      let scrollTop = state.position.top;

      if (align === "bottom") {
        scrollTop = scrollTop - height + state.position.height;
      } else if (align === "center") {
        scrollTop -= (height - state.position.height) / 2;
      }

      target.scrollTo(0, Math.max(0, scrollTop += offset)); // Resets state after 400ms, an arbitrary time I determined to be
      // still visually pleasing if there is a slow network reply in dynamic
      // cells

      let didUnsubscribe = false;
      const timeout = setTimeout(() => !didUnsubscribe && dispatch({
        type: "reset"
      }), 400);
      return () => {
        didUnsubscribe = true;
        clearTimeout(timeout);
      };
    } else if (state.index !== void 0) {
      // Estimates the top based upon the average height of current cells
      let estimatedTop = positioner.shortestColumn() / positioner.size() * state.index;
      if (state.prevTop) estimatedTop = Math.max(estimatedTop, state.prevTop + height);
      target.scrollTo(0, estimatedTop);
      throttledDispatch({
        type: "setPrevTop",
        value: estimatedTop
      });
    }
  }, [currentTop, state, latestOptions, getTarget, throttledDispatch]);
  return React.useRef(index => {
    dispatch({
      type: "scrollToIndex",
      value: index
    });
  }).current;
}

const defaultState = {
  index: void 0,
  position: void 0,
  prevTop: void 0
};