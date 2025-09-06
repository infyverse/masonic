import memoizeOne from "@essentials/memoize-one";
import OneKeyMap from "@essentials/one-key-map";
import useLatest from "@react-hook/latest";
import * as React from "react";
const __reactCreateElement__ = React.createElement;
import trieMemoize from "trie-memoize";
import { elementsCache } from "./elements-cache";
import { useForceUpdate } from "./use-force-update";

/**
 * This hook handles the render phases of the masonry layout and returns the grid as a React element.
 *
 * @param options - Options for configuring the masonry layout renderer. See `UseMasonryOptions`.
 * @param options.positioner
 * @param options.resizeObserver
 * @param options.items
 * @param options.as
 * @param options.id
 * @param options.className
 * @param options.style
 * @param options.role
 * @param options.tabIndex
 * @param options.containerRef
 * @param options.itemAs
 * @param options.itemStyle
 * @param options.itemHeightEstimate
 * @param options.itemKey
 * @param options.overscanBy
 * @param options.scrollTop
 * @param options.isScrolling
 * @param options.height
 * @param options.render
 * @param options.onRender
 */
export function useMasonry(_ref) {
  let {
    // Measurement and layout
    positioner,
    resizeObserver,
    // Grid items
    items,
    // Container props
    as: ContainerComponent = "div",
    id,
    className,
    style,
    role = "grid",
    tabIndex = 0,
    containerRef,
    // Item props
    itemAs: ItemComponent = "div",
    itemStyle,
    itemHeightEstimate = 300,
    itemKey = defaultGetItemKey,
    // Rendering props
    overscanBy = 2,
    scrollTop,
    isScrolling,
    height,
    render: RenderComponent,
    onRender
  } = _ref;
  let startIndex = 0;
  let stopIndex;
  const forceUpdate = useForceUpdate();
  const setItemRef = getRefSetter(positioner, resizeObserver);
  const itemCount = items.length;
  const {
    columnWidth,
    columnCount,
    range,
    estimateHeight,
    size,
    shortestColumn
  } = positioner;
  const measuredCount = size();
  const shortestColumnSize = shortestColumn();
  const children = [];
  const itemRole = role === "list" ? "listitem" : role === "grid" ? "gridcell" : undefined;
  const storedOnRender = useLatest(onRender);
  overscanBy = height * overscanBy;
  const rangeEnd = scrollTop + overscanBy;
  const needsFreshBatch = shortestColumnSize < rangeEnd && measuredCount < itemCount;
  range( // We overscan in both directions because users scroll both ways,
  // though one must admit scrolling down is more common and thus
  // we only overscan by half the downward overscan amount
  Math.max(0, scrollTop - overscanBy / 2), rangeEnd, (index, left, top) => {
    const data = items[index];
    const key = itemKey(data, index);
    const phaseTwoStyle = {
      top,
      left,
      width: columnWidth,
      writingMode: "horizontal-tb",
      position: "absolute"
    };
    /* istanbul ignore next */

    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      throwWithoutData(data, index);
    }

    children.push( /*#__PURE__*/__reactCreateElement__(ItemComponent, {
      key: key,
      ref: setItemRef(index),
      role: itemRole,
      style: typeof itemStyle === "object" && itemStyle !== null ? Object.assign({}, phaseTwoStyle, itemStyle) : phaseTwoStyle
    }, createRenderElement(RenderComponent, index, data, columnWidth)));

    if (stopIndex === void 0) {
      startIndex = index;
      stopIndex = index;
    } else {
      startIndex = Math.min(startIndex, index);
      stopIndex = Math.max(stopIndex, index);
    }
  });

  if (needsFreshBatch) {
    const batchSize = Math.min(itemCount - measuredCount, Math.ceil((scrollTop + overscanBy - shortestColumnSize) / itemHeightEstimate * columnCount));
    let index = measuredCount;
    const phaseOneStyle = getCachedSize(columnWidth);

    for (; index < measuredCount + batchSize; index++) {
      const data = items[index];
      const key = itemKey(data, index);
      /* istanbul ignore next */

      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        throwWithoutData(data, index);
      }

      children.push( /*#__PURE__*/__reactCreateElement__(ItemComponent, {
        key: key,
        ref: setItemRef(index),
        role: itemRole,
        style: typeof itemStyle === "object" ? Object.assign({}, phaseOneStyle, itemStyle) : phaseOneStyle
      }, createRenderElement(RenderComponent, index, data, columnWidth)));
    }
  } // Calls the onRender callback if the rendered indices changed


  React.useEffect(() => {
    if (typeof storedOnRender.current === "function" && stopIndex !== void 0) storedOnRender.current(startIndex, stopIndex, items);
    didEverMount = "1";
  }, [startIndex, stopIndex, items, storedOnRender]); // If we needed a fresh batch we should reload our components with the measured
  // sizes

  React.useEffect(() => {
    if (needsFreshBatch) forceUpdate(); // eslint-disable-next-line
  }, [needsFreshBatch, positioner]); // gets the container style object based upon the estimated height and whether or not
  // the page is being scrolled

  const containerStyle = getContainerStyle(isScrolling, estimateHeight(itemCount, itemHeightEstimate));
  return /*#__PURE__*/__reactCreateElement__(ContainerComponent, {
    ref: containerRef,
    key: didEverMount,
    id: id,
    role: role,
    className: className,
    tabIndex: tabIndex,
    style: typeof style === "object" ? assignUserStyle(containerStyle, style) : containerStyle,
    children: children
  });
}
/* istanbul ignore next */

function throwWithoutData(data, index) {
  if (!data) {
    throw new Error(`No data was found at index: ${index}\n\n` + `This usually happens when you've mutated or changed the "items" array in a ` + `way that makes it shorter than the previous "items" array. Masonic knows nothing ` + `about your underlying data and when it caches cell positions, it assumes you aren't ` + `mutating the underlying "items".\n\n` + `See https://codesandbox.io/s/masonic-w-react-router-example-2b5f9?file=/src/index.js for ` + `an example that gets around this limitations. For advanced implementations, see ` + `https://codesandbox.io/s/masonic-w-react-router-and-advanced-config-example-8em42?file=/src/index.js\n\n` + `If this was the result of your removing an item from your "items", see this issue: ` + `https://github.com/jaredLunde/masonic/issues/12`);
  }
} // This is for triggering a remount after SSR has loaded in the client w/ hydrate()


let didEverMount = "0";
//
// Render-phase utilities
// ~5.5x faster than createElement without the memo
const createRenderElement = /*#__PURE__*/trieMemoize([OneKeyMap, {}, WeakMap, OneKeyMap], (RenderComponent, index, data, columnWidth) => /*#__PURE__*/__reactCreateElement__(RenderComponent, {
  index: index,
  data: data,
  width: columnWidth
}));
const getContainerStyle = /*#__PURE__*/memoizeOne((isScrolling, estimateHeight) => ({
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  height: Math.ceil(estimateHeight),
  maxHeight: Math.ceil(estimateHeight),
  willChange: isScrolling ? "contents" : void 0,
  pointerEvents: isScrolling ? "none" : void 0
}));

const cmp2 = (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1];

const assignUserStyle = /*#__PURE__*/memoizeOne((containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle), // @ts-expect-error
cmp2);

function defaultGetItemKey(_, i) {
  return i;
} // the below memoizations for for ensuring shallow equal is reliable for pure
// component children


const getCachedSize = /*#__PURE__*/memoizeOne(width => ({
  width,
  zIndex: -1000,
  visibility: "hidden",
  position: "absolute",
  writingMode: "horizontal-tb"
}), (args, pargs) => args[0] === pargs[0]);
const getRefSetter = /*#__PURE__*/memoizeOne((positioner, resizeObserver) => index => el => {
  if (el === null) return;

  if (resizeObserver) {
    resizeObserver.observe(el);
    elementsCache.set(el, index);
  }

  if (positioner.get(index) === void 0) positioner.set(index, el.offsetHeight);
}, // @ts-expect-error
cmp2);