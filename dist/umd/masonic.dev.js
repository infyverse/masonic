(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Masonic = {}, global.React));
})(this, (function (exports, React) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var React__namespace = /*#__PURE__*/_interopNamespace(React);
  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

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
      index: index,
      high: high,
      next: node
    };
    if (prevNode) prevNode.next = {
      index: index,
      high: high,
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
      insert: function insert(low, high, index) {
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
          low: low,
          high: high,
          max: high,
          C: RED,
          P: y,
          L: NULL_NODE,
          R: NULL_NODE,
          list: {
            index: index,
            high: high,
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
      remove: function remove(index) {
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
      search: function search(low, high, callback) {
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

  var useLatest = function useLatest(current) {
    var storedValue = React__namespace.useRef(current);
    React__namespace.useEffect(function () {
      storedValue.current = current;
    });
    return storedValue;
  };

  var useLatest$1 = useLatest;

  var useDebounceCallback = function useDebounceCallback(callback, wait, leading) {
    if (wait === void 0) {
      wait = 100;
    }

    if (leading === void 0) {
      leading = false;
    }

    var storedCallback = useLatest$1(callback);
    var timeout = React__namespace.useRef();
    var deps = [wait, leading, storedCallback]; // Cleans up pending timeouts when the deps change

    function _ref() {
      timeout.current && clearTimeout(timeout.current);
      timeout.current = void 0;
    }

    React__namespace.useEffect(function () {
      return _ref;
    }, deps);

    function _ref2() {
      timeout.current = void 0;
    }

    return React__namespace.useCallback(function () {
      // eslint-disable-next-line prefer-rest-params
      var args = arguments;
      var current = timeout.current; // Calls on leading edge

      if (current === void 0 && leading) {
        timeout.current = setTimeout(_ref2, wait); // eslint-disable-next-line prefer-spread

        return storedCallback.current.apply(null, args);
      } // Clear the timeout every call and start waiting again


      current && clearTimeout(current); // Waits for `wait` before invoking the callback

      timeout.current = setTimeout(function () {
        timeout.current = void 0;
        storedCallback.current.apply(null, args);
      }, wait);
    }, deps);
  };
  var useDebounce = function useDebounce(initialState, wait, leading) {
    var state = React__namespace.useState(initialState);
    return [state[0], useDebounceCallback(state[1], wait, leading)];
  };

  function useEvent(target, type, listener, cleanup) {
    var storedListener = React__namespace.useRef(listener);
    var storedCleanup = React__namespace.useRef(cleanup);
    React__namespace.useEffect(function () {
      storedListener.current = listener;
      storedCleanup.current = cleanup;
    });
    React__namespace.useEffect(function () {
      var targetEl = target && 'current' in target ? target.current : target;
      if (!targetEl) return;
      var didUnsubscribe = 0;

      function listener() {
        if (didUnsubscribe) return;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        storedListener.current.apply(this, args);
      }

      targetEl.addEventListener(type, listener);
      var cleanup = storedCleanup.current;
      return function () {
        didUnsubscribe = 1;
        targetEl.removeEventListener(type, listener);
        cleanup && cleanup();
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, type]);
  }

  var emptyObj$2 = {};
  var win$2 = typeof window === 'undefined' ? null : window;
  var wv = win$2 && typeof win$2.visualViewport !== 'undefined' ? win$2.visualViewport : null;

  var getSize = function getSize() {
    return [document.documentElement.clientWidth, document.documentElement.clientHeight];
  };

  var useWindowSize = function useWindowSize(options) {
    if (options === void 0) {
      options = emptyObj$2;
    }

    var _options = options,
        wait = _options.wait,
        leading = _options.leading,
        _options$initialWidth = _options.initialWidth,
        initialWidth = _options$initialWidth === void 0 ? 0 : _options$initialWidth,
        _options$initialHeigh = _options.initialHeight,
        initialHeight = _options$initialHeigh === void 0 ? 0 : _options$initialHeigh;

    var _useDebounce = useDebounce(
    /* istanbul ignore next */
    typeof document === 'undefined' ? [initialWidth, initialHeight] : getSize, wait, leading),
        size = _useDebounce[0],
        setDebouncedSize = _useDebounce[1];

    var setSize = function setSize() {
      return setDebouncedSize(getSize);
    };

    useEvent(win$2, 'resize', setSize); // @ts-expect-error

    useEvent(wv, 'resize', setSize);
    useEvent(win$2, 'orientationchange', setSize);
    return size;
  };

  var memoOne = function memoOne(fn, areEqual) {
    var equal = areEqual || defaultAreEqual;
    var args, value;
    return function () {
      return !!args && equal(arguments, args) ? value : value = fn.apply(null, args = arguments);
    };
  };

  var memoizeOne = memoOne;

  var defaultAreEqual = function defaultAreEqual(current, prev) {
    return current[0] === prev[0] && current[1] === prev[1] && current[2] === prev[2] && current[3] === prev[3];
  };

  var OneKeyMap = function OneKeyMap() {
    this.set = void 0;
    this.get = void 0;
    var key, val;

    this.get = function (k) {
      return k === key ? val : void 0;
    };

    this.set = function (k, v) {
      key = k;
      val = v;
    };
  };

  var OneKeyMap$1 = OneKeyMap;

  var createCache = function createCache(obj) {
    function _set(k, v) {
      cache[k] = v;
    }

    function _get(k) {
      return cache[k];
    }

    try {
      // @ts-ignore
      return new obj();
    } catch (e) {
      var cache = {};
      return {
        set: _set,
        get: _get
      };
    }
  };

  var memo = function memo(constructors) {
    var depth = constructors.length,
        baseCache = createCache(constructors[0]);
    var base;
    var map;
    var i;
    var node;
    var one = depth === 1; // quicker access for one and two-argument functions

    var g1 = function g1(args) {
      return (base = baseCache.get(args[0])) === void 0 || one ? base : base.get(args[1]);
    };

    var s1 = function s1(args, value) {
      if (one) baseCache.set(args[0], value);else {
        if ((base = baseCache.get(args[0])) === void 0) {
          map = createCache(constructors[1]);
          map.set(args[1], value);
          baseCache.set(args[0], map);
        } else {
          base.set(args[1], value);
        }
      }
      return value;
    };

    var g2 = function g2(args) {
      node = baseCache;

      for (i = 0; i < depth; i++) if ((node = node.get(args[i])) === void 0) return;

      return node;
    };

    var s2 = function s2(args, value) {
      node = baseCache;

      for (i = 0; i < depth - 1; i++) {
        if ((map = node.get(args[i])) === void 0) {
          map = createCache(constructors[i + 1]);
          node.set(args[i], map);
          node = map;
        } else {
          node = map;
        }
      }

      node.set(args[depth - 1], value);
      return value;
    };

    return depth < 3 ? {
      g: g1,
      s: s1
    } : {
      g: g2,
      s: s2
    };
  };

  var memoize = function memoize(mapConstructors, fn) {
    var item;

    var _memo = memo(mapConstructors),
        g = _memo.g,
        s = _memo.s;

    return function () {
      return (item = g(arguments)) === void 0 ? s(arguments, fn.apply(null, arguments)) : item;
    };
  };

  var trieMemoize = memoize;

  var elementsCache = /*#__PURE__*/new WeakMap();

  function useForceUpdate() {
    var setState = React__namespace.useState(emptyObj$1)[1];
    return React__namespace.useRef(function () {
      return setState({});
    }).current;
  }
  var emptyObj$1 = {};

  var __reactCreateElement__$2 = React__namespace.createElement;

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
    var positioner = _ref.positioner,
        resizeObserver = _ref.resizeObserver,
        items = _ref.items,
        _ref$as = _ref.as,
        ContainerComponent = _ref$as === void 0 ? "div" : _ref$as,
        id = _ref.id,
        className = _ref.className,
        style = _ref.style,
        _ref$role = _ref.role,
        role = _ref$role === void 0 ? "grid" : _ref$role,
        _ref$tabIndex = _ref.tabIndex,
        tabIndex = _ref$tabIndex === void 0 ? 0 : _ref$tabIndex,
        containerRef = _ref.containerRef,
        _ref$itemAs = _ref.itemAs,
        ItemComponent = _ref$itemAs === void 0 ? "div" : _ref$itemAs,
        itemStyle = _ref.itemStyle,
        _ref$itemHeightEstima = _ref.itemHeightEstimate,
        itemHeightEstimate = _ref$itemHeightEstima === void 0 ? 300 : _ref$itemHeightEstima,
        _ref$itemKey = _ref.itemKey,
        itemKey = _ref$itemKey === void 0 ? defaultGetItemKey : _ref$itemKey,
        _ref$overscanBy = _ref.overscanBy,
        overscanBy = _ref$overscanBy === void 0 ? 2 : _ref$overscanBy,
        scrollTop = _ref.scrollTop,
        isScrolling = _ref.isScrolling,
        height = _ref.height,
        RenderComponent = _ref.render,
        onRender = _ref.onRender;
    var startIndex = 0;
    var stopIndex;
    var forceUpdate = useForceUpdate();
    var setItemRef = getRefSetter(positioner, resizeObserver);
    var itemCount = items.length;
    var columnWidth = positioner.columnWidth,
        columnCount = positioner.columnCount,
        range = positioner.range,
        estimateHeight = positioner.estimateHeight,
        size = positioner.size,
        shortestColumn = positioner.shortestColumn;
    var measuredCount = size();
    var shortestColumnSize = shortestColumn();
    var children = [];
    var itemRole = role === "list" ? "listitem" : role === "grid" ? "gridcell" : undefined;
    var storedOnRender = useLatest$1(onRender);
    overscanBy = height * overscanBy;
    var rangeEnd = scrollTop + overscanBy;
    var needsFreshBatch = shortestColumnSize < rangeEnd && measuredCount < itemCount;
    range( // We overscan in both directions because users scroll both ways,
    // though one must admit scrolling down is more common and thus
    // we only overscan by half the downward overscan amount
    Math.max(0, scrollTop - overscanBy / 2), rangeEnd, function (index, left, top) {
      var data = items[index];
      var key = itemKey(data, index);
      var phaseTwoStyle = {
        top: top,
        left: left,
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
        style: typeof itemStyle === "object" && itemStyle !== null ? _extends({}, phaseTwoStyle, itemStyle) : phaseTwoStyle
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
          style: typeof itemStyle === "object" ? _extends({}, phaseOneStyle, itemStyle) : phaseOneStyle
        }, createRenderElement(RenderComponent, _index, _data, columnWidth)));
      }
    } // Calls the onRender callback if the rendered indices changed


    React__namespace.useEffect(function () {
      if (typeof storedOnRender.current === "function" && stopIndex !== void 0) storedOnRender.current(startIndex, stopIndex, items);
      didEverMount = "1";
    }, [startIndex, stopIndex, items, storedOnRender]); // If we needed a fresh batch we should reload our components with the measured
    // sizes

    React__namespace.useEffect(function () {
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
  var createRenderElement = /*#__PURE__*/trieMemoize([OneKeyMap$1, {}, WeakMap, OneKeyMap$1], function (RenderComponent, index, data, columnWidth) {
    return /*#__PURE__*/__reactCreateElement__$2(RenderComponent, {
      index: index,
      data: data,
      width: columnWidth
    });
  });
  var getContainerStyle = /*#__PURE__*/memoizeOne(function (isScrolling, estimateHeight) {
    return {
      position: "relative",
      width: "100%",
      maxWidth: "100%",
      height: Math.ceil(estimateHeight),
      maxHeight: Math.ceil(estimateHeight),
      willChange: isScrolling ? "contents" : void 0,
      pointerEvents: isScrolling ? "none" : void 0
    };
  });

  var cmp2 = function cmp2(args, pargs) {
    return args[0] === pargs[0] && args[1] === pargs[1];
  };

  var assignUserStyle = /*#__PURE__*/memoizeOne(function (containerStyle, userStyle) {
    return _extends({}, containerStyle, userStyle);
  }, // @ts-expect-error
  cmp2);

  function defaultGetItemKey(_, i) {
    return i;
  } // the below memoizations for for ensuring shallow equal is reliable for pure
  // component children


  var getCachedSize = /*#__PURE__*/memoizeOne(function (width) {
    return {
      width: width,
      zIndex: -1000,
      visibility: "hidden",
      position: "absolute",
      writingMode: "horizontal-tb"
    };
  }, function (args, pargs) {
    return args[0] === pargs[0];
  });
  var getRefSetter = /*#__PURE__*/memoizeOne(function (positioner, resizeObserver) {
    return function (index) {
      return function (el) {
        if (el === null) return;

        if (resizeObserver) {
          resizeObserver.observe(el);
          elementsCache.set(el, index);
        }

        if (positioner.get(index) === void 0) positioner.set(index, el.offsetHeight);
      };
    };
  }, // @ts-expect-error
  cmp2);

  var u = 'undefined',
      win$1 = typeof window !== u ? window : {},
      p = typeof performance !== u ? performance : Date,
      now$1 = function now() {
    return p.now();
  },
      af = 'AnimationFrame',
      Caf = 'cancel' + af,
      Raf = 'request' + af,
      raf = win$1[Raf] && /*#__PURE__*/win$1[Raf].bind(win$1),
      caf = win$1[Caf] && /*#__PURE__*/win$1[Caf].bind(win$1);

  function _raf(callback) {
    var curr = now$1(),
        next = Math.max(lastTime + 1000 / 60, curr);
    return setTimeout(function () {
      callback(lastTime = next);
    }, next - curr);
  }

  function _caf(h) {
    return clearTimeout(h);
  }

  if (!raf || !caf) {
    var lastTime = 0;
    raf = _raf;
    caf = _caf;
  }

  /**
   * Copyright 2011, Joe Lambert.
   * Free to use under the MIT license.
   * http://www.opensource.org/licenses/mit-license.php
   **/
  var clearRequestTimeout = function clearRequestTimeout(handle) {
    caf(handle.v || -1);
  };
  var requestTimeout = function requestTimeout(fn, ms) {
    var start = now$1(),
        handle = {};

    var _loop = function loop() {
      now$1() - start >= ms ? fn.call(null) : handle.v = raf(_loop);
    };

    handle.v = raf(_loop);
    return handle;
  };

  var perf = typeof performance !== 'undefined' ? performance : Date;

  var now = function now() {
    return perf.now();
  };

  function useThrottleCallback(callback, fps, leading) {
    if (fps === void 0) {
      fps = 30;
    }

    if (leading === void 0) {
      leading = false;
    }

    var storedCallback = useLatest$1(callback);
    var ms = 1000 / fps;
    var prev = React__namespace.useRef(0);
    var trailingTimeout = React__namespace.useRef();

    var clearTrailing = function clearTrailing() {
      return trailingTimeout.current && clearTimeout(trailingTimeout.current);
    };

    var deps = [fps, leading, storedCallback]; // Reset any time the deps change

    function _ref() {
      prev.current = 0;
      clearTrailing();
    }

    React__namespace.useEffect(function () {
      return _ref;
    }, deps);
    return React__namespace.useCallback(function () {
      // eslint-disable-next-line prefer-rest-params
      var args = arguments;
      var rightNow = now();

      var call = function call() {
        prev.current = rightNow;
        clearTrailing();
        storedCallback.current.apply(null, args);
      };

      var current = prev.current; // leading

      if (leading && current === 0) return call(); // body

      if (rightNow - current > ms) {
        if (current > 0) return call();
        prev.current = rightNow;
      } // trailing


      clearTrailing();
      trailingTimeout.current = setTimeout(function () {
        call();
        prev.current = 0;
      }, ms);
    }, deps);
  }
  function useThrottle(initialState, fps, leading) {
    var state = React__namespace.useState(initialState);
    return [state[0], useThrottleCallback(state[1], fps, leading)];
  }

  var win = typeof window === 'undefined' ? null : window;

  var getScrollY = function getScrollY() {
    return win.scrollY !== void 0 ? win.scrollY : win.pageYOffset === void 0 ? 0 : win.pageYOffset;
  };

  var useWindowScroll = function useWindowScroll(fps) {
    if (fps === void 0) {
      fps = 30;
    }

    var state = useThrottle(typeof window === 'undefined' ? 0 : getScrollY, fps, true);
    useEvent(win, 'scroll', function () {
      return state[1](getScrollY());
    });
    return state[0];
  };
  var useScrollPosition = useWindowScroll;

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

    var _React$useState = React__namespace.useState(false),
        isScrolling = _React$useState[0],
        setIsScrolling = _React$useState[1];

    var didMount = React__namespace.useRef(0);
    React__namespace.useEffect(function () {
      if (didMount.current === 1) setIsScrolling(true);
      var didUnsubscribe = false;
      var to = requestTimeout(function () {
        if (didUnsubscribe) return; // This is here to prevent premature bail outs while maintaining high resolution
        // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.

        setIsScrolling(false);
      }, 40 + 1000 / fps);
      didMount.current = 1;
      return function () {
        didUnsubscribe = true;
        clearRequestTimeout(to);
      };
    }, [fps, scrollTop]);
    return {
      scrollTop: Math.max(0, scrollTop - offset),
      isScrolling: isScrolling
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
    var _useScroller = useScroller(props.offset, props.scrollFps),
        scrollTop = _useScroller.scrollTop,
        isScrolling = _useScroller.isScrolling; // This is an update-heavy phase and while we could just Object.assign here,
    // it is way faster to inline and there's a relatively low hit to he bundle
    // size.


    return useMasonry({
      scrollTop: scrollTop,
      isScrolling: isScrolling,
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

  var usePassiveLayoutEffect = React__default["default"][typeof document !== 'undefined' && document.createElement !== void 0 ? 'useLayoutEffect' : 'useEffect'];
  var useLayoutEffect = usePassiveLayoutEffect;

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

    var _React$useState = React__namespace.useState({
      offset: 0,
      width: 0
    }),
        containerPosition = _React$useState[0],
        setContainerPosition = _React$useState[1];

    useLayoutEffect(function () {
      var current = elementRef.current;

      if (current !== null && document.fullscreenElement === null) {
        var offset = 0;
        var el = current;

        do {
          offset += el.offsetTop || 0;
          el = el.offsetParent;
        } while (el);

        if (offset !== containerPosition.offset || current.offsetWidth !== containerPosition.width) {
          setContainerPosition({
            offset: offset,
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
    var width = _ref.width,
        _ref$columnWidth = _ref.columnWidth,
        columnWidth = _ref$columnWidth === void 0 ? 200 : _ref$columnWidth,
        _ref$columnGutter = _ref.columnGutter,
        columnGutter = _ref$columnGutter === void 0 ? 0 : _ref$columnGutter,
        rowGutter = _ref.rowGutter,
        columnCount = _ref.columnCount,
        maxColumnCount = _ref.maxColumnCount,
        maxColumnWidth = _ref.maxColumnWidth;

    if (deps === void 0) {
      deps = emptyArr;
    }

    var initPositioner = function initPositioner() {
      var _getColumns = getColumns(width, columnWidth, columnGutter, columnCount, maxColumnCount, maxColumnWidth),
          computedColumnWidth = _getColumns[0],
          computedColumnCount = _getColumns[1];

      return createPositioner(computedColumnCount, computedColumnWidth, columnGutter, rowGutter !== null && rowGutter !== void 0 ? rowGutter : columnGutter);
    };

    var positionerRef = React__namespace.useRef();
    if (positionerRef.current === undefined) positionerRef.current = initPositioner();
    var prevDeps = React__namespace.useRef(deps);
    var opts = [width, columnWidth, columnGutter, rowGutter, columnCount, maxColumnCount, maxColumnWidth];
    var prevOpts = React__namespace.useRef(opts);
    var optsChanged = !opts.every(function (item, i) {
      return prevOpts.current[i] === item;
    });

    if (typeof process !== "undefined" && "production" !== "production") {
      if (deps.length !== prevDeps.current.length) {
        throw new Error("usePositioner(): The length of your dependencies array changed.");
      }
    } // Create a new positioner when the dependencies or sizes change
    // Thanks to https://github.com/khmm12 for pointing this out
    // https://github.com/jaredLunde/masonic/pull/41


    if (optsChanged || !deps.every(function (item, i) {
      return prevDeps.current[i] === item;
    })) {
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
      columnCount: columnCount,
      columnWidth: columnWidth,
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
          top: top,
          height: height,
          column: column
        };
        intervalTree.insert(top, top + height, index);
      },
      get: function get(index) {
        return items[index];
      },
      // This only updates items in the specific columns that have changed, on and after the
      // specific items that have changed
      update: function update(updates) {
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
      range: function range(lo, hi, renderCallback) {
        return intervalTree.search(lo, hi, function (index, top) {
          return renderCallback(index, items[index].left, top);
        });
      },
      estimateHeight: function estimateHeight(itemCount, defaultItemHeight) {
        var tallestColumn = Math.max(0, Math.max.apply(null, columnHeights));
        return itemCount === intervalTree.size ? tallestColumn : tallestColumn + Math.ceil((itemCount - intervalTree.size) / columnCount) * defaultItemHeight;
      },
      shortestColumn: function shortestColumn() {
        if (columnHeights.length > 1) return Math.min.apply(null, columnHeights);
        return columnHeights[0] || 0;
      },
      size: function size() {
        return intervalTree.size;
      },
      all: function all() {
        return items;
      }
    };
  };

  /* istanbul ignore next */
  var binarySearch = function binarySearch(a, y) {
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

  var rafSchd = function rafSchd(fn) {
    var lastArgs = [];
    var frameId = null;

    function _ref() {
      frameId = null;
      fn.apply(void 0, lastArgs);
    }

    var wrapperFn = function wrapperFn() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      lastArgs = args;

      if (frameId) {
        return;
      }

      frameId = requestAnimationFrame(_ref);
    };

    wrapperFn.cancel = function () {
      if (!frameId) {
        return;
      }

      cancelAnimationFrame(frameId);
      frameId = null;
    };

    return wrapperFn;
  };

  var rafSchd$1 = rafSchd;

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

    React__namespace.useEffect(function () {
      return _ref;
    }, [resizeObserver]);
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
  function (positioner, updater) {
    var updates = [];
    var update = rafSchd$1(function () {
      if (updates.length > 0 && document.fullscreenElement === null) {
        // Updates the size/positions of the cell with the resize
        // observer updates
        positioner.update(updates);
        updater(updates);
      }

      updates.length = 0;
    });

    var commonHandler = function commonHandler(target) {
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

    var handleEntries = function handleEntries(entries) {
      var i = 0;

      for (; i < entries.length; i++) {
        var entry = entries[i];
        var index = elementsCache.get(entry.target);
        if (index === void 0) continue;
        var handler = handlers.get(index);

        if (!handler) {
          handler = rafSchd$1(commonHandler);
          handlers.set(index, handler);
        }

        handler(entry.target);
      }
    };

    var ro = new ResizeObserver(handleEntries); // Overrides the original disconnect to include cancelling handling the entries.
    // Ideally this would be its own method but that would result in a breaking
    // change.

    var disconnect = ro.disconnect.bind(ro);

    ro.disconnect = function () {
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

    var _options$align = options.align,
        align = _options$align === void 0 ? "top" : _options$align,
        _options$element = options.element,
        element = _options$element === void 0 ? typeof window !== "undefined" && window : _options$element,
        _options$offset = options.offset,
        offset = _options$offset === void 0 ? 0 : _options$offset,
        _options$height = options.height,
        height = _options$height === void 0 ? typeof window !== "undefined" ? window.innerHeight : 0 : _options$height;
    var latestOptions = useLatest$1({
      positioner: positioner,
      element: element,
      align: align,
      offset: offset,
      height: height
    });
    var getTarget = React__namespace.useRef(function () {
      var latestElement = latestOptions.current.element;
      return latestElement && "current" in latestElement ? latestElement.current : latestElement;
    }).current;

    var _React$useReducer = React__namespace.useReducer(function (state, action) {
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
    }, defaultState),
        state = _React$useReducer[0],
        dispatch = _React$useReducer[1];

    var throttledDispatch = useThrottleCallback(dispatch, 15); // If we find the position along the way we can immediately take off
    // to the correct spot.

    useEvent(getTarget(), "scroll", function () {
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
    React__namespace.useEffect(function () {
      var target = getTarget();
      if (!target) return;
      var _latestOptions$curren2 = latestOptions.current,
          height = _latestOptions$curren2.height,
          align = _latestOptions$curren2.align,
          offset = _latestOptions$curren2.offset,
          positioner = _latestOptions$curren2.positioner;

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
    return React__namespace.useRef(function (index) {
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

  var __reactCreateElement__$1 = React__namespace.createElement;

  /**
   * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
   * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
   * It will change its column count to fit its container's width and will decide how many rows to render based upon
   * the height of the browser `window`.
   *
   * @param props
   */
  function Masonry(props) {
    var containerRef = React__namespace.useRef(null);
    var windowSize = useWindowSize({
      initialWidth: props.ssrWidth,
      initialHeight: props.ssrHeight
    });
    var containerPos = useContainerPosition(containerRef, windowSize);

    var nextProps = _extends({
      offset: containerPos.offset,
      width: containerPos.width || windowSize[0],
      height: windowSize[1],
      containerRef: containerRef
    }, props);

    nextProps.positioner = usePositioner(nextProps);
    nextProps.resizeObserver = useResizeObserver(nextProps.positioner);
    var scrollToIndex = useScrollToIndex(nextProps.positioner, {
      height: nextProps.height,
      offset: containerPos.offset,
      align: typeof props.scrollToIndex === "object" ? props.scrollToIndex.align : void 0
    });
    var index = props.scrollToIndex && (typeof props.scrollToIndex === "number" ? props.scrollToIndex : props.scrollToIndex.index);
    React__namespace.useEffect(function () {
      if (index !== void 0) scrollToIndex(index);
    }, [index, scrollToIndex]);
    return __reactCreateElement__$1(MasonryScroller, nextProps);
  }

  if (typeof process !== "undefined" && "production" !== "production") {
    Masonry.displayName = "Masonry";
  }

  var __reactCreateElement__ = React__namespace.createElement;

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

    var _options = options,
        isItemLoaded = _options.isItemLoaded,
        _options$minimumBatch = _options.minimumBatchSize,
        minimumBatchSize = _options$minimumBatch === void 0 ? 16 : _options$minimumBatch,
        _options$threshold = _options.threshold,
        threshold = _options$threshold === void 0 ? 16 : _options$threshold,
        _options$totalItems = _options.totalItems,
        totalItems = _options$totalItems === void 0 ? 9e9 : _options$totalItems;
    var storedLoadMoreItems = useLatest$1(loadMoreItems);
    var storedIsItemLoaded = useLatest$1(isItemLoaded);
    return React__namespace.useCallback(function (startIndex, stopIndex, items) {
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

  var defaultIsItemLoaded = function defaultIsItemLoaded(index, items) {
    return items[index] !== void 0;
  };

  var emptyObj = {};

  exports.List = List;
  exports.Masonry = Masonry;
  exports.MasonryScroller = MasonryScroller;
  exports.createIntervalTree = createIntervalTree;
  exports.createPositioner = createPositioner;
  exports.createResizeObserver = createResizeObserver;
  exports.useContainerPosition = useContainerPosition;
  exports.useInfiniteLoader = useInfiniteLoader;
  exports.useMasonry = useMasonry;
  exports.usePositioner = usePositioner;
  exports.useResizeObserver = useResizeObserver;
  exports.useScrollToIndex = useScrollToIndex;
  exports.useScroller = useScroller;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=masonic.dev.js.map
