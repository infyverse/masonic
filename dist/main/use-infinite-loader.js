"use strict";

exports.__esModule = true;
exports.useInfiniteLoader = useInfiniteLoader;

var _latest = /*#__PURE__*/_interopRequireDefault( /*#__PURE__*/require("@react-hook/latest"));

var React = /*#__PURE__*/_interopRequireWildcard( /*#__PURE__*/require("react"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A utility hook for seamlessly adding infinite scroll behavior to the `useMasonry()` hook. This
 * hook invokes a callback each time the last rendered index surpasses the total number of items
 * in your items array or the number defined in the `totalItems` option.
 *
 * @param loadMoreItems - This callback is invoked when more rows must be loaded. It will be used to
 *  determine when to refresh the list with the newly-loaded data. This callback may be called multiple
 *  times in reaction to a single scroll event, so it's important to memoize its arguments. If you're
 *  creating this callback inside of a functional component, make sure you wrap it in `React.useCallback()`,
 *  as well.
 * @param options
 */
function useInfiniteLoader(loadMoreItems, options = emptyObj) {
  const {
    isItemLoaded,
    minimumBatchSize = 16,
    threshold = 16,
    totalItems = 9e9
  } = options;
  const storedLoadMoreItems = (0, _latest.default)(loadMoreItems);
  const storedIsItemLoaded = (0, _latest.default)(isItemLoaded);
  return React.useCallback((startIndex, stopIndex, items) => {
    const unloadedRanges = scanForUnloadedRanges(storedIsItemLoaded.current, minimumBatchSize, items, totalItems, Math.max(0, startIndex - threshold), Math.min(totalItems - 1, (stopIndex || 0) + threshold)); // The user is responsible for memoizing their loadMoreItems() function
    // because we don't want to make assumptions about how they want to deal
    // with `items`

    for (let i = 0; i < unloadedRanges.length - 1; ++i) storedLoadMoreItems.current(unloadedRanges[i], unloadedRanges[++i], items);
  }, [totalItems, minimumBatchSize, threshold, storedLoadMoreItems, storedIsItemLoaded]);
}
/**
 * Returns all of the ranges within a larger range that contain unloaded rows.
 *
 * @param isItemLoaded
 * @param minimumBatchSize
 * @param items
 * @param totalItems
 * @param startIndex
 * @param stopIndex
 */


function scanForUnloadedRanges(isItemLoaded = defaultIsItemLoaded, minimumBatchSize = 16, items, totalItems = 9e9, startIndex, stopIndex) {
  const unloadedRanges = [];
  let rangeStartIndex,
      rangeStopIndex,
      index = startIndex;
  /* istanbul ignore next */

  for (; index <= stopIndex; index++) {
    if (!isItemLoaded(index, items)) {
      rangeStopIndex = index;
      if (rangeStartIndex === void 0) rangeStartIndex = index;
    } else if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
      unloadedRanges.push(rangeStartIndex, rangeStopIndex);
      rangeStartIndex = rangeStopIndex = void 0;
    }
  } // If :rangeStopIndex is not null it means we haven't run out of unloaded rows.
  // Scan forward to try filling our :minimumBatchSize.


  if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
    const potentialStopIndex = Math.min(Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1), totalItems - 1);
    /* istanbul ignore next */

    for (index = rangeStopIndex + 1; index <= potentialStopIndex; index++) {
      if (!isItemLoaded(index, items)) {
        rangeStopIndex = index;
      } else {
        break;
      }
    }

    unloadedRanges.push(rangeStartIndex, rangeStopIndex);
  } // Check to see if our first range ended prematurely.
  // In this case we should scan backwards to try filling our :minimumBatchSize.

  /* istanbul ignore next */


  if (unloadedRanges.length) {
    let firstUnloadedStart = unloadedRanges[0];
    const firstUnloadedStop = unloadedRanges[1];

    while (firstUnloadedStop - firstUnloadedStart + 1 < minimumBatchSize && firstUnloadedStart > 0) {
      const index = firstUnloadedStart - 1;

      if (!isItemLoaded(index, items)) {
        unloadedRanges[0] = firstUnloadedStart = index;
      } else {
        break;
      }
    }
  }

  return unloadedRanges;
}

const defaultIsItemLoaded = (index, items) => items[index] !== void 0;

const emptyObj = {};