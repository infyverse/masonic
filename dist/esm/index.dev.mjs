import * as React from 'react';
import { useWindowSize } from '@react-hook/window-size';
import memoizeOne from '@essentials/memoize-one';
import OneKeyMap from '@essentials/one-key-map';
import useLatest from '@react-hook/latest';
import trieMemoize from 'trie-memoize';
import { requestTimeout, clearRequestTimeout } from '@essentials/request-timeout';
import useScrollPosition from '@react-hook/window-scroll';
import useLayoutEffect from '@react-hook/passive-layout-effect';
import rafSchd from 'raf-schd';
import useEvent from '@react-hook/event';
import { useThrottleCallback } from '@react-hook/throttle';

var RED = 0;
var BLACK = 1;
var NIL = 2;
var DELETE = 0;
var KEEP = 1;

function addInterval(treeNode, high, index) {
  var node = treeNode.list;
  var prevNode;

  while (node) {
    if (node.index === index) return false;
    if (high > node.high) break;
    prevNode = node;
    node = node.next;
  }

  if (!prevNode) treeNode.list = {
    index,
    high,
    next: node
  };
  if (prevNode) prevNode.next = {
    index,
    high,
    next: prevNode.next
  };
  return true;
}

function removeInterval(treeNode, index) {
  var node = treeNode.list;

  if (node.index === index) {
    if (node.next === null) return DELETE;
    treeNode.list = node.next;
    return KEEP;
  }

  var prevNode = node;
  node = node.next;

  while (node !== null) {
    if (node.index === index) {
      prevNode.next = node.next;
      return KEEP;
    }

    prevNode = node;
    node = node.next;
  }
}

var NULL_NODE = {
  low: 0,
  max: 0,
  high: 0,
  C: NIL,
  // @ts-expect-error
  P: undefined,
  // @ts-expect-error
  R: undefined,
  // @ts-expect-error
  L: undefined,
  // @ts-expect-error
  list: undefined
};
NULL_NODE.P = NULL_NODE;
NULL_NODE.L = NULL_NODE;
NULL_NODE.R = NULL_NODE;

function updateMax(node) {
  var max = node.high;
  if (node.L === NULL_NODE && node.R === NULL_NODE) node.max = max;else if (node.L === NULL_NODE) node.max = Math.max(node.R.max, max);else if (node.R === NULL_NODE) node.max = Math.max(node.L.max, max);else node.max = Math.max(Math.max(node.L.max, node.R.max), max);
}

function updateMaxUp(node) {
  var x = node;

  while (x.P !== NULL_NODE) {
    updateMax(x.P);
    x = x.P;
  }
}

function rotateLeft(tree, x) {
  if (x.R === NULL_NODE) return;
  var y = x.R;
  x.R = y.L;
  if (y.L !== NULL_NODE) y.L.P = x;
  y.P = x.P;
  if (x.P === NULL_NODE) tree.root = y;else if (x === x.P.L) x.P.L = y;else x.P.R = y;
  y.L = x;
  x.P = y;
  updateMax(x);
  updateMax(y);
}

function rotateRight(tree, x) {
  if (x.L === NULL_NODE) return;
  var y = x.L;
  x.L = y.R;
  if (y.R !== NULL_NODE) y.R.P = x;
  y.P = x.P;
  if (x.P === NULL_NODE) tree.root = y;else if (x === x.P.R) x.P.R = y;else x.P.L = y;
  y.R = x;
  x.P = y;
  updateMax(x);
  updateMax(y);
}

function replaceNode(tree, x, y) {
  if (x.P === NULL_NODE) tree.root = y;else if (x === x.P.L) x.P.L = y;else x.P.R = y;
  y.P = x.P;
}

function fixRemove(tree, x) {
  var w;

  while (x !== NULL_NODE && x.C === BLACK) {
    if (x === x.P.L) {
      w = x.P.R;

      if (w.C === RED) {
        w.C = BLACK;
        x.P.C = RED;
        rotateLeft(tree, x.P);
        w = x.P.R;
      }

      if (w.L.C === BLACK && w.R.C === BLACK) {
        w.C = RED;
        x = x.P;
      } else {
        if (w.R.C === BLACK) {
          w.L.C = BLACK;
          w.C = RED;
          rotateRight(tree, w);
          w = x.P.R;
        }

        w.C = x.P.C;
        x.P.C = BLACK;
        w.R.C = BLACK;
        rotateLeft(tree, x.P);
        x = tree.root;
      }
    } else {
      w = x.P.L;

      if (w.C === RED) {
        w.C = BLACK;
        x.P.C = RED;
        rotateRight(tree, x.P);
        w = x.P.L;
      }

      if (w.R.C === BLACK && w.L.C === BLACK) {
        w.C = RED;
        x = x.P;
      } else {
        if (w.L.C === BLACK) {
          w.R.C = BLACK;
          w.C = RED;
          rotateLeft(tree, w);
          w = x.P.L;
        }

        w.C = x.P.C;
        x.P.C = BLACK;
        w.L.C = BLACK;
        rotateRight(tree, x.P);
        x = tree.root;
      }
    }
  }

  x.C = BLACK;
}

function minimumTree(x) {
  while (x.L !== NULL_NODE) x = x.L;

  return x;
}

function fixInsert(tree, z) {
  var y;

  while (z.P.C === RED) {
    if (z.P === z.P.P.L) {
      y = z.P.P.R;

      if (y.C === RED) {
        z.P.C = BLACK;
        y.C = BLACK;
        z.P.P.C = RED;
        z = z.P.P;
      } else {
        if (z === z.P.R) {
          z = z.P;
          rotateLeft(tree, z);
        }

        z.P.C = BLACK;
        z.P.P.C = RED;
        rotateRight(tree, z.P.P);
      }
    } else {
      y = z.P.P.L;

      if (y.C === RED) {
        z.P.C = BLACK;
        y.C = BLACK;
        z.P.P.C = RED;
        z = z.P.P;
      } else {
        if (z === z.P.L) {
          z = z.P;
          rotateRight(tree, z);
        }

        z.P.C = BLACK;
        z.P.P.C = RED;
        rotateLeft(tree, z.P.P);
      }
    }
  }

  tree.root.C = BLACK;
}

function createIntervalTree() {
  var tree = {
    root: NULL_NODE,
    size: 0
  }; // we know these indexes are a consistent, safe way to make look ups
  // for our case so it's a solid O(1) alternative to
  // the O(log n) searchNode() in typical interval trees

  var indexMap = {};
  return {
    insert(low, high, index) {
      var x = tree.root;
      var y = NULL_NODE;

      while (x !== NULL_NODE) {
        y = x;
        if (low === y.low) break;
        if (low < x.low) x = x.L;else x = x.R;
      }

      if (low === y.low && y !== NULL_NODE) {
        if (!addInterval(y, high, index)) return;
        y.high = Math.max(y.high, high);
        updateMax(y);
        updateMaxUp(y);
        indexMap[index] = y;
        tree.size++;
        return;
      }

      var z = {
        low,
        high,
        max: high,
        C: RED,
        P: y,
        L: NULL_NODE,
        R: NULL_NODE,
        list: {
          index,
          high,
          next: null
        }
      };

      if (y === NULL_NODE) {
        tree.root = z;
      } else {
        if (z.low < y.low) y.L = z;else y.R = z;
        updateMaxUp(z);
      }

      fixInsert(tree, z);
      indexMap[index] = z;
      tree.size++;
    },

    remove(index) {
      var z = indexMap[index];
      if (z === void 0) return;
      delete indexMap[index];
      var intervalResult = removeInterval(z, index);
      if (intervalResult === void 0) return;

      if (intervalResult === KEEP) {
        z.high = z.list.high;
        updateMax(z);
        updateMaxUp(z);
        tree.size--;
        return;
      }

      var y = z;
      var originalYColor = y.C;
      var x;

      if (z.L === NULL_NODE) {
        x = z.R;
        replaceNode(tree, z, z.R);
      } else if (z.R === NULL_NODE) {
        x = z.L;
        replaceNode(tree, z, z.L);
      } else {
        y = minimumTree(z.R);
        originalYColor = y.C;
        x = y.R;

        if (y.P === z) {
          x.P = y;
        } else {
          replaceNode(tree, y, y.R);
          y.R = z.R;
          y.R.P = y;
        }

        replaceNode(tree, z, y);
        y.L = z.L;
        y.L.P = y;
        y.C = z.C;
      }

      updateMax(x);
      updateMaxUp(x);
      if (originalYColor === BLACK) fixRemove(tree, x);
      tree.size--;
    },

    search(low, high, callback) {
      var stack = [tree.root];

      while (stack.length !== 0) {
        var node = stack.pop();
        if (node === NULL_NODE || low > node.max) continue;
        if (node.L !== NULL_NODE) stack.push(node.L);
        if (node.R !== NULL_NODE) stack.push(node.R);

        if (node.low <= high && node.high >= low) {
          var curr = node.list;

          while (curr !== null) {
            if (curr.high >= low) callback(curr.index, node.low);
            curr = curr.next;
          }
        }
      }
    },

    get size() {
      return tree.size;
    }

  };
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

var elementsCache = /*#__PURE__*/new WeakMap();

function useForceUpdate() {
  var setState = React.useState(emptyObj$1)[1];
  return React.useRef(() => setState({})).current;
}
var emptyObj$1 = {};

var __reactCreateElement__$2 = React.createElement;

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
function useMasonry(_ref) {
  var {
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
  var startIndex = 0;
  var stopIndex;
  var forceUpdate = useForceUpdate();
  var setItemRef = getRefSetter(positioner, resizeObserver);
  var itemCount = items.length;
  var {
    columnWidth,
    columnCount,
    range,
    estimateHeight,
    size,
    shortestColumn
  } = positioner;
  var measuredCount = size();
  var shortestColumnSize = shortestColumn();
  var children = [];
  var itemRole = role === "list" ? "listitem" : role === "grid" ? "gridcell" : undefined;
  var storedOnRender = useLatest(onRender);
  overscanBy = height * overscanBy;
  var rangeEnd = scrollTop + overscanBy;
  var needsFreshBatch = shortestColumnSize < rangeEnd && measuredCount < itemCount;
  range( // We overscan in both directions because users scroll both ways,
  // though one must admit scrolling down is more common and thus
  // we only overscan by half the downward overscan amount
  Math.max(0, scrollTop - overscanBy / 2), rangeEnd, (index, left, top) => {
    var data = items[index];
    var key = itemKey(data, index);
    var phaseTwoStyle = {
      top,
      left,
      width: columnWidth,
      writingMode: "horizontal-tb",
      position: "absolute"
    };
    /* istanbul ignore next */

    if (typeof process !== "undefined" && "production" !== "production") {
      throwWithoutData(data, index);
    }

    children.push( /*#__PURE__*/__reactCreateElement__$2(ItemComponent, {
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
    var batchSize = Math.min(itemCount - measuredCount, Math.ceil((scrollTop + overscanBy - shortestColumnSize) / itemHeightEstimate * columnCount));
    var _index = measuredCount;
    var phaseOneStyle = getCachedSize(columnWidth);

    for (; _index < measuredCount + batchSize; _index++) {
      var _data = items[_index];
      var key = itemKey(_data, _index);
      /* istanbul ignore next */

      if (typeof process !== "undefined" && "production" !== "production") {
        throwWithoutData(_data, _index);
      }

      children.push( /*#__PURE__*/__reactCreateElement__$2(ItemComponent, {
        key: key,
        ref: setItemRef(_index),
        role: itemRole,
        style: typeof itemStyle === "object" ? Object.assign({}, phaseOneStyle, itemStyle) : phaseOneStyle
      }, createRenderElement(RenderComponent, _index, _data, columnWidth)));
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

  var containerStyle = getContainerStyle(isScrolling, estimateHeight(itemCount, itemHeightEstimate));
  return /*#__PURE__*/__reactCreateElement__$2(ContainerComponent, {
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
    throw new Error("No data was found at index: " + index + "\n\n" + "This usually happens when you've mutated or changed the \"items\" array in a " + "way that makes it shorter than the previous \"items\" array. Masonic knows nothing " + "about your underlying data and when it caches cell positions, it assumes you aren't " + "mutating the underlying \"items\".\n\n" + "See https://codesandbox.io/s/masonic-w-react-router-example-2b5f9?file=/src/index.js for " + "an example that gets around this limitations. For advanced implementations, see " + "https://codesandbox.io/s/masonic-w-react-router-and-advanced-config-example-8em42?file=/src/index.js\n\n" + "If this was the result of your removing an item from your \"items\", see this issue: " + "https://github.com/jaredLunde/masonic/issues/12");
  }
} // This is for triggering a remount after SSR has loaded in the client w/ hydrate()


var didEverMount = "0";
//
// Render-phase utilities
// ~5.5x faster than createElement without the memo
var createRenderElement = /*#__PURE__*/trieMemoize([OneKeyMap, {}, WeakMap, OneKeyMap], (RenderComponent, index, data, columnWidth) => /*#__PURE__*/__reactCreateElement__$2(RenderComponent, {
  index: index,
  data: data,
  width: columnWidth
}));
var getContainerStyle = /*#__PURE__*/memoizeOne((isScrolling, estimateHeight) => ({
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  height: Math.ceil(estimateHeight),
  maxHeight: Math.ceil(estimateHeight),
  willChange: isScrolling ? "contents" : void 0,
  pointerEvents: isScrolling ? "none" : void 0
}));

var cmp2 = (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1];

var assignUserStyle = /*#__PURE__*/memoizeOne((containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle), // @ts-expect-error
cmp2);

function defaultGetItemKey(_, i) {
  return i;
} // the below memoizations for for ensuring shallow equal is reliable for pure
// component children


var getCachedSize = /*#__PURE__*/memoizeOne(width => ({
  width,
  zIndex: -1000,
  visibility: "hidden",
  position: "absolute",
  writingMode: "horizontal-tb"
}), (args, pargs) => args[0] === pargs[0]);
var getRefSetter = /*#__PURE__*/memoizeOne((positioner, resizeObserver) => index => el => {
  if (el === null) return;

  if (resizeObserver) {
    resizeObserver.observe(el);
    elementsCache.set(el, index);
  }

  if (positioner.get(index) === void 0) positioner.set(index, el.offsetHeight);
}, // @ts-expect-error
cmp2);

/**
 * A hook for tracking whether the `window` is currently being scrolled and it's scroll position on
 * the y-axis. These values are used for determining which grid cells to render and when
 * to add styles to the masonry container that maximize scroll performance.
 *
 * @param offset - The vertical space in pixels between the top of the grid container and the top
 *  of the browser `document.documentElement`.
 * @param fps - This determines how often (in frames per second) to update the scroll position of the
 *  browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
 *  The default value of `12` has been very reasonable in my own testing, but if you have particularly
 *  heavy `render` components it may be prudent to reduce this number.
 */

function useScroller(offset, fps) {
  if (offset === void 0) {
    offset = 0;
  }

  if (fps === void 0) {
    fps = 12;
  }

  var scrollTop = useScrollPosition(fps);
  var [isScrolling, setIsScrolling] = React.useState(false);
  var didMount = React.useRef(0);
  React.useEffect(() => {
    if (didMount.current === 1) setIsScrolling(true);
    var didUnsubscribe = false;
    var to = requestTimeout(() => {
      if (didUnsubscribe) return; // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.

      setIsScrolling(false);
    }, 40 + 1000 / fps);
    didMount.current = 1;
    return () => {
      didUnsubscribe = true;
      clearRequestTimeout(to);
    };
  }, [fps, scrollTop]);
  return {
    scrollTop: Math.max(0, scrollTop - offset),
    isScrolling
  };
}

/**
 * A heavily-optimized component that updates `useMasonry()` when the scroll position of the browser `window`
 * changes. This bare-metal component is used by `<Masonry>` under the hood.
 *
 * @param props
 */

function MasonryScroller(props) {
  // We put this in its own layer because it's the thing that will trigger the most updates
  // and we don't want to slower ourselves by cycling through all the functions, objects, and effects
  // of other hooks
  var {
    scrollTop,
    isScrolling
  } = useScroller(props.offset, props.scrollFps); // This is an update-heavy phase and while we could just Object.assign here,
  // it is way faster to inline and there's a relatively low hit to he bundle
  // size.

  return useMasonry({
    scrollTop,
    isScrolling,
    positioner: props.positioner,
    resizeObserver: props.resizeObserver,
    items: props.items,
    onRender: props.onRender,
    as: props.as,
    id: props.id,
    className: props.className,
    style: props.style,
    role: props.role,
    tabIndex: props.tabIndex,
    containerRef: props.containerRef,
    itemAs: props.itemAs,
    itemStyle: props.itemStyle,
    itemHeightEstimate: props.itemHeightEstimate,
    itemKey: props.itemKey,
    overscanBy: props.overscanBy,
    height: props.height,
    render: props.render
  });
}

if (typeof process !== "undefined" && "production" !== "production") {
  MasonryScroller.displayName = "MasonryScroller";
}

/**
 * A hook for measuring the width of the grid container, as well as its distance
 * from the top of the document. These values are necessary to correctly calculate the number/width
 * of columns to render, as well as the number of rows to render.
 *
 * @param elementRef - A `ref` object created by `React.useRef()`. That ref should be provided to the
 *   `containerRef` property in `useMasonry()`.
 * @param deps - You can force this hook to recalculate the `offset` and `width` whenever this
 *   dependencies list changes. A common dependencies list might look like `[windowWidth, windowHeight]`,
 *   which would force the hook to recalculate any time the size of the browser `window` changed.
 */

function useContainerPosition(elementRef, deps) {
  if (deps === void 0) {
    deps = emptyArr$1;
  }

  var [containerPosition, setContainerPosition] = React.useState({
    offset: 0,
    width: 0
  });
  useLayoutEffect(() => {
    var {
      current
    } = elementRef;

    if (current !== null && document.fullscreenElement === null) {
      var offset = 0;
      var el = current;

      do {
        offset += el.offsetTop || 0;
        el = el.offsetParent;
      } while (el);

      if (offset !== containerPosition.offset || current.offsetWidth !== containerPosition.width) {
        setContainerPosition({
          offset,
          width: current.offsetWidth
        });
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps

  }, deps);
  return containerPosition;
}
var emptyArr$1 = [];

/**
 * This hook creates the grid cell positioner and cache required by `useMasonry()`. This is
 * the meat of the grid's layout algorithm, determining which cells to render at a given scroll
 * position, as well as where to place new items in the grid.
 *
 * @param options - Properties that determine the number of columns in the grid, as well
 *  as their widths.
 * @param options.columnWidth
 * @param options.width
 * @param deps - This hook will create a new positioner, clearing all existing cached positions,
 *  whenever the dependencies in this list change.
 * @param options.columnGutter
 * @param options.rowGutter
 * @param options.columnCount
 * @param options.maxColumnCount
 * @param options.maxColumnWidth
 */

function usePositioner(_ref, deps) {
  var {
    width,
    columnWidth = 200,
    columnGutter = 0,
    rowGutter,
    columnCount,
    maxColumnCount,
    maxColumnWidth
  } = _ref;

  if (deps === void 0) {
    deps = emptyArr;
  }

  var initPositioner = () => {
    var [computedColumnWidth, computedColumnCount] = getColumns(width, columnWidth, columnGutter, columnCount, maxColumnCount, maxColumnWidth);
    return createPositioner(computedColumnCount, computedColumnWidth, columnGutter, rowGutter !== null && rowGutter !== void 0 ? rowGutter : columnGutter);
  };

  var positionerRef = React.useRef();
  if (positionerRef.current === undefined) positionerRef.current = initPositioner();
  var prevDeps = React.useRef(deps);
  var opts = [width, columnWidth, columnGutter, rowGutter, columnCount, maxColumnCount, maxColumnWidth];
  var prevOpts = React.useRef(opts);
  var optsChanged = !opts.every((item, i) => prevOpts.current[i] === item);

  if (typeof process !== "undefined" && "production" !== "production") {
    if (deps.length !== prevDeps.current.length) {
      throw new Error("usePositioner(): The length of your dependencies array changed.");
    }
  } // Create a new positioner when the dependencies or sizes change
  // Thanks to https://github.com/khmm12 for pointing this out
  // https://github.com/jaredLunde/masonic/pull/41


  if (optsChanged || !deps.every((item, i) => prevDeps.current[i] === item)) {
    var prevPositioner = positionerRef.current;
    var positioner = initPositioner();
    prevDeps.current = deps;
    prevOpts.current = opts;

    if (optsChanged) {
      var cacheSize = prevPositioner.size();

      for (var _index2 = 0; _index2 < cacheSize; _index2++) {
        var pos = prevPositioner.get(_index2);
        positioner.set(_index2, pos !== void 0 ? pos.height : 0);
      }
    }

    positionerRef.current = positioner;
  }

  return positionerRef.current;
}

/**
 * Creates a cell positioner for the `useMasonry()` hook. The `usePositioner()` hook uses
 * this utility under the hood.
 *
 * @param columnCount - The number of columns in the grid
 * @param columnWidth - The width of each column in the grid
 * @param columnGutter - The amount of horizontal space between columns in pixels.
 * @param rowGutter - The amount of vertical space between cells within a column in pixels (falls back
 * to `columnGutter`).
 */
var createPositioner = function createPositioner(columnCount, columnWidth, columnGutter, rowGutter) {
  if (columnGutter === void 0) {
    columnGutter = 0;
  }

  if (rowGutter === void 0) {
    rowGutter = columnGutter;
  }

  // O(log(n)) lookup of cells to render for a given viewport size
  // Store tops and bottoms of each cell for fast intersection lookup.
  var intervalTree = createIntervalTree(); // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.

  var columnHeights = new Array(columnCount); // Used for O(1) item access

  var items = []; // Tracks the item indexes within an individual column

  var columnItems = new Array(columnCount);

  for (var i = 0; i < columnCount; i++) {
    columnHeights[i] = 0;
    columnItems[i] = [];
  }

  return {
    columnCount,
    columnWidth,
    set: function set(index, height) {
      if (height === void 0) {
        height = 0;
      }

      var column = 0; // finds the shortest column and uses it

      for (var _i2 = 1; _i2 < columnHeights.length; _i2++) {
        if (columnHeights[_i2] < columnHeights[column]) column = _i2;
      }

      var top = columnHeights[column] || 0;
      columnHeights[column] = top + height + rowGutter;
      columnItems[column].push(index);
      items[index] = {
        left: column * (columnWidth + columnGutter),
        top,
        height,
        column
      };
      intervalTree.insert(top, top + height, index);
    },
    get: index => items[index],
    // This only updates items in the specific columns that have changed, on and after the
    // specific items that have changed
    update: updates => {
      var columns = new Array(columnCount);
      var i = 0,
          j = 0; // determines which columns have items that changed, as well as the minimum index
      // changed in that column, as all items after that index will have their positions
      // affected by the change

      for (; i < updates.length - 1; i++) {
        var _index3 = updates[i];
        var item = items[_index3];
        item.height = updates[++i];
        intervalTree.remove(_index3);
        intervalTree.insert(item.top, item.top + item.height, _index3);
        columns[item.column] = columns[item.column] === void 0 ? _index3 : Math.min(_index3, columns[item.column]);
      }

      for (i = 0; i < columns.length; i++) {
        // bails out if the column didn't change
        if (columns[i] === void 0) continue;
        var itemsInColumn = columnItems[i]; // the index order is sorted with certainty so binary search is a great solution
        // here as opposed to Array.indexOf()

        var startIndex = binarySearch(itemsInColumn, columns[i]);
        var _index4 = columnItems[i][startIndex];
        var startItem = items[_index4];
        columnHeights[i] = startItem.top + startItem.height + rowGutter;

        for (j = startIndex + 1; j < itemsInColumn.length; j++) {
          var _index5 = itemsInColumn[j];
          var _item = items[_index5];
          _item.top = columnHeights[i];
          columnHeights[i] = _item.top + _item.height + rowGutter;
          intervalTree.remove(_index5);
          intervalTree.insert(_item.top, _item.top + _item.height, _index5);
        }
      }
    },
    // Render all cells visible within the viewport range defined.
    range: (lo, hi, renderCallback) => intervalTree.search(lo, hi, (index, top) => renderCallback(index, items[index].left, top)),
    estimateHeight: (itemCount, defaultItemHeight) => {
      var tallestColumn = Math.max(0, Math.max.apply(null, columnHeights));
      return itemCount === intervalTree.size ? tallestColumn : tallestColumn + Math.ceil((itemCount - intervalTree.size) / columnCount) * defaultItemHeight;
    },
    shortestColumn: () => {
      if (columnHeights.length > 1) return Math.min.apply(null, columnHeights);
      return columnHeights[0] || 0;
    },

    size() {
      return intervalTree.size;
    },

    all() {
      return items;
    }

  };
};

/* istanbul ignore next */
var binarySearch = (a, y) => {
  var l = 0;
  var h = a.length - 1;

  while (l <= h) {
    var m = l + h >>> 1;
    var x = a[m];
    if (x === y) return m;else if (x <= y) l = m + 1;else h = m - 1;
  }

  return -1;
};

var getColumns = function getColumns(width, minimumWidth, gutter, columnCount, maxColumnCount, maxColumnWidth) {
  if (width === void 0) {
    width = 0;
  }

  if (minimumWidth === void 0) {
    minimumWidth = 0;
  }

  if (gutter === void 0) {
    gutter = 8;
  }

  columnCount = columnCount || Math.min(Math.floor((width + gutter) / (minimumWidth + gutter)), maxColumnCount || Infinity) || 1;
  var columnWidth = Math.floor((width - gutter * (columnCount - 1)) / columnCount); // Cap the column width if maxColumnWidth is specified

  if (maxColumnWidth !== undefined && columnWidth > maxColumnWidth) {
    columnWidth = maxColumnWidth;
  }

  return [columnWidth, columnCount];
};

var emptyArr = [];

/**
 * Creates a resize observer that forces updates to the grid cell positions when mutations are
 * made to cells affecting their height.
 *
 * @param positioner - The masonry cell positioner created by the `usePositioner()` hook.
 */
function useResizeObserver(positioner) {
  var forceUpdate = useForceUpdate();
  var resizeObserver = createResizeObserver(positioner, forceUpdate); // Cleans up the resize observers when they change or the
  // component unmounts

  function _ref() {
    return resizeObserver.disconnect();
  }

  React.useEffect(() => _ref, [resizeObserver]);
  return resizeObserver;
}

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
var createResizeObserver = /*#__PURE__*/trieMemoize([WeakMap], // TODO: figure out a way to test this

/* istanbul ignore next */
(positioner, updater) => {
  var updates = [];
  var update = rafSchd(() => {
    if (updates.length > 0 && document.fullscreenElement === null) {
      // Updates the size/positions of the cell with the resize
      // observer updates
      positioner.update(updates);
      updater(updates);
    }

    updates.length = 0;
  });

  var commonHandler = target => {
    var height = target.offsetHeight;

    if (height > 0) {
      var index = elementsCache.get(target);

      if (index !== void 0) {
        var position = positioner.get(index);
        if (position !== void 0 && height !== position.height) updates.push(index, height);
      }
    }

    update();
  };

  var handlers = new Map();

  var handleEntries = entries => {
    var i = 0;

    for (; i < entries.length; i++) {
      var entry = entries[i];
      var index = elementsCache.get(entry.target);
      if (index === void 0) continue;
      var handler = handlers.get(index);

      if (!handler) {
        handler = rafSchd(commonHandler);
        handlers.set(index, handler);
      }

      handler(entry.target);
    }
  };

  var ro = new ResizeObserver(handleEntries); // Overrides the original disconnect to include cancelling handling the entries.
  // Ideally this would be its own method but that would result in a breaking
  // change.

  var disconnect = ro.disconnect.bind(ro);

  ro.disconnect = () => {
    disconnect();
    handlers.forEach(_ref2);
  };

  return ro;
});

/**
 * A hook that creates a callback for scrolling to a specific index in
 * the "items" array.
 *
 * @param positioner - A positioner created by the `usePositioner()` hook
 * @param options - Configuration options
 */
function useScrollToIndex(positioner, options) {
  var _latestOptions$curren;

  var {
    align = "top",
    element = typeof window !== "undefined" && window,
    offset = 0,
    height = typeof window !== "undefined" ? window.innerHeight : 0
  } = options;
  var latestOptions = useLatest({
    positioner,
    element,
    align,
    offset,
    height
  });
  var getTarget = React.useRef(() => {
    var latestElement = latestOptions.current.element;
    return latestElement && "current" in latestElement ? latestElement.current : latestElement;
  }).current;
  var [state, dispatch] = React.useReducer((state, action) => {
    var nextState = {
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
  var throttledDispatch = useThrottleCallback(dispatch, 15); // If we find the position along the way we can immediately take off
  // to the correct spot.

  useEvent(getTarget(), "scroll", () => {
    if (!state.position && state.index) {
      var position = latestOptions.current.positioner.get(state.index);

      if (position) {
        dispatch({
          type: "setPosition",
          value: position
        });
      }
    }
  }); // If the top changes out from under us in the case of dynamic cells, we
  // want to keep following it.

  var currentTop = state.index !== void 0 && ((_latestOptions$curren = latestOptions.current.positioner.get(state.index)) === null || _latestOptions$curren === void 0 ? void 0 : _latestOptions$curren.top);
  React.useEffect(() => {
    var target = getTarget();
    if (!target) return;
    var {
      height,
      align,
      offset,
      positioner
    } = latestOptions.current;

    function _ref() {
      return !didUnsubscribe && dispatch({
        type: "reset"
      });
    }

    function _ref2() {
      didUnsubscribe = true;
      clearTimeout(timeout);
    }

    if (state.position) {
      var scrollTop = state.position.top;

      if (align === "bottom") {
        scrollTop = scrollTop - height + state.position.height;
      } else if (align === "center") {
        scrollTop -= (height - state.position.height) / 2;
      }

      target.scrollTo(0, Math.max(0, scrollTop += offset)); // Resets state after 400ms, an arbitrary time I determined to be
      // still visually pleasing if there is a slow network reply in dynamic
      // cells

      var didUnsubscribe = false;
      var timeout = setTimeout(_ref, 400);
      return _ref2;
    } else if (state.index !== void 0) {
      // Estimates the top based upon the average height of current cells
      var estimatedTop = positioner.shortestColumn() / positioner.size() * state.index;
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
var defaultState = {
  index: void 0,
  position: void 0,
  prevTop: void 0
};

var __reactCreateElement__$1 = React.createElement;

/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 *
 * @param props
 */
function Masonry(props) {
  var containerRef = React.useRef(null);
  var windowSize = useWindowSize({
    initialWidth: props.ssrWidth,
    initialHeight: props.ssrHeight
  });
  var containerPos = useContainerPosition(containerRef, windowSize);
  var nextProps = Object.assign({
    offset: containerPos.offset,
    width: containerPos.width || windowSize[0],
    height: windowSize[1],
    containerRef
  }, props);
  nextProps.positioner = usePositioner(nextProps);
  nextProps.resizeObserver = useResizeObserver(nextProps.positioner);
  var scrollToIndex = useScrollToIndex(nextProps.positioner, {
    height: nextProps.height,
    offset: containerPos.offset,
    align: typeof props.scrollToIndex === "object" ? props.scrollToIndex.align : void 0
  });
  var index = props.scrollToIndex && (typeof props.scrollToIndex === "number" ? props.scrollToIndex : props.scrollToIndex.index);
  React.useEffect(() => {
    if (index !== void 0) scrollToIndex(index);
  }, [index, scrollToIndex]);
  return __reactCreateElement__$1(MasonryScroller, nextProps);
}

if (typeof process !== "undefined" && "production" !== "production") {
  Masonry.displayName = "Masonry";
}

var __reactCreateElement__ = React.createElement;

/**
 * This is just a single-column `<Masonry>` component without column-specific props.
 *
 * @param props
 */
function List(props) {
  return /*#__PURE__*/__reactCreateElement__(Masonry, _extends({
    role: "list",
    rowGutter: props.rowGutter,
    columnCount: 1,
    columnWidth: 1
  }, props));
}

if (typeof process !== "undefined" && "production" !== "production") {
  List.displayName = "List";
}

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

function useInfiniteLoader(loadMoreItems, options) {
  if (options === void 0) {
    options = emptyObj;
  }

  var {
    isItemLoaded,
    minimumBatchSize = 16,
    threshold = 16,
    totalItems = 9e9
  } = options;
  var storedLoadMoreItems = useLatest(loadMoreItems);
  var storedIsItemLoaded = useLatest(isItemLoaded);
  return React.useCallback((startIndex, stopIndex, items) => {
    var unloadedRanges = scanForUnloadedRanges(storedIsItemLoaded.current, minimumBatchSize, items, totalItems, Math.max(0, startIndex - threshold), Math.min(totalItems - 1, (stopIndex || 0) + threshold)); // The user is responsible for memoizing their loadMoreItems() function
    // because we don't want to make assumptions about how they want to deal
    // with `items`

    for (var i = 0; i < unloadedRanges.length - 1; ++i) storedLoadMoreItems.current(unloadedRanges[i], unloadedRanges[++i], items);
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

function scanForUnloadedRanges(isItemLoaded, minimumBatchSize, items, totalItems, startIndex, stopIndex) {
  if (isItemLoaded === void 0) {
    isItemLoaded = defaultIsItemLoaded;
  }

  if (minimumBatchSize === void 0) {
    minimumBatchSize = 16;
  }

  if (totalItems === void 0) {
    totalItems = 9e9;
  }

  var unloadedRanges = [];
  var rangeStartIndex,
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
    var potentialStopIndex = Math.min(Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1), totalItems - 1);
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
    var firstUnloadedStart = unloadedRanges[0];
    var firstUnloadedStop = unloadedRanges[1];

    while (firstUnloadedStop - firstUnloadedStart + 1 < minimumBatchSize && firstUnloadedStart > 0) {
      var _index = firstUnloadedStart - 1;

      if (!isItemLoaded(_index, items)) {
        unloadedRanges[0] = firstUnloadedStart = _index;
      } else {
        break;
      }
    }
  }

  return unloadedRanges;
}

var defaultIsItemLoaded = (index, items) => items[index] !== void 0;

var emptyObj = {};

export { List, Masonry, MasonryScroller, createIntervalTree, createPositioner, createResizeObserver, useContainerPosition, useInfiniteLoader, useMasonry, usePositioner, useResizeObserver, useScrollToIndex, useScroller };
//# sourceMappingURL=index.dev.mjs.map
