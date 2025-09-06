import * as React from "react";
import { createIntervalTree } from "./interval-tree";
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

export function usePositioner(_ref, deps) {
  let {
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

  const initPositioner = () => {
    const [computedColumnWidth, computedColumnCount] = getColumns(width, columnWidth, columnGutter, columnCount, maxColumnCount, maxColumnWidth);
    return createPositioner(computedColumnCount, computedColumnWidth, columnGutter, rowGutter !== null && rowGutter !== void 0 ? rowGutter : columnGutter);
  };

  const positionerRef = React.useRef();
  if (positionerRef.current === undefined) positionerRef.current = initPositioner();
  const prevDeps = React.useRef(deps);
  const opts = [width, columnWidth, columnGutter, rowGutter, columnCount, maxColumnCount, maxColumnWidth];
  const prevOpts = React.useRef(opts);
  const optsChanged = !opts.every((item, i) => prevOpts.current[i] === item);

  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    if (deps.length !== prevDeps.current.length) {
      throw new Error("usePositioner(): The length of your dependencies array changed.");
    }
  } // Create a new positioner when the dependencies or sizes change
  // Thanks to https://github.com/khmm12 for pointing this out
  // https://github.com/jaredLunde/masonic/pull/41


  if (optsChanged || !deps.every((item, i) => prevDeps.current[i] === item)) {
    const prevPositioner = positionerRef.current;
    const positioner = initPositioner();
    prevDeps.current = deps;
    prevOpts.current = opts;

    if (optsChanged) {
      const cacheSize = prevPositioner.size();

      for (let index = 0; index < cacheSize; index++) {
        const pos = prevPositioner.get(index);
        positioner.set(index, pos !== void 0 ? pos.height : 0);
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
export const createPositioner = function (columnCount, columnWidth, columnGutter, rowGutter) {
  if (columnGutter === void 0) {
    columnGutter = 0;
  }

  if (rowGutter === void 0) {
    rowGutter = columnGutter;
  }

  // O(log(n)) lookup of cells to render for a given viewport size
  // Store tops and bottoms of each cell for fast intersection lookup.
  const intervalTree = createIntervalTree(); // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.

  const columnHeights = new Array(columnCount); // Used for O(1) item access

  const items = []; // Tracks the item indexes within an individual column

  const columnItems = new Array(columnCount);

  for (let i = 0; i < columnCount; i++) {
    columnHeights[i] = 0;
    columnItems[i] = [];
  }

  return {
    columnCount,
    columnWidth,
    set: function (index, height) {
      if (height === void 0) {
        height = 0;
      }

      let column = 0; // finds the shortest column and uses it

      for (let i = 1; i < columnHeights.length; i++) {
        if (columnHeights[i] < columnHeights[column]) column = i;
      }

      const top = columnHeights[column] || 0;
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
      const columns = new Array(columnCount);
      let i = 0,
          j = 0; // determines which columns have items that changed, as well as the minimum index
      // changed in that column, as all items after that index will have their positions
      // affected by the change

      for (; i < updates.length - 1; i++) {
        const index = updates[i];
        const item = items[index];
        item.height = updates[++i];
        intervalTree.remove(index);
        intervalTree.insert(item.top, item.top + item.height, index);
        columns[item.column] = columns[item.column] === void 0 ? index : Math.min(index, columns[item.column]);
      }

      for (i = 0; i < columns.length; i++) {
        // bails out if the column didn't change
        if (columns[i] === void 0) continue;
        const itemsInColumn = columnItems[i]; // the index order is sorted with certainty so binary search is a great solution
        // here as opposed to Array.indexOf()

        const startIndex = binarySearch(itemsInColumn, columns[i]);
        const index = columnItems[i][startIndex];
        const startItem = items[index];
        columnHeights[i] = startItem.top + startItem.height + rowGutter;

        for (j = startIndex + 1; j < itemsInColumn.length; j++) {
          const index = itemsInColumn[j];
          const item = items[index];
          item.top = columnHeights[i];
          columnHeights[i] = item.top + item.height + rowGutter;
          intervalTree.remove(index);
          intervalTree.insert(item.top, item.top + item.height, index);
        }
      }
    },
    // Render all cells visible within the viewport range defined.
    range: (lo, hi, renderCallback) => intervalTree.search(lo, hi, (index, top) => renderCallback(index, items[index].left, top)),
    estimateHeight: (itemCount, defaultItemHeight) => {
      const tallestColumn = Math.max(0, Math.max.apply(null, columnHeights));
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
const binarySearch = (a, y) => {
  let l = 0;
  let h = a.length - 1;

  while (l <= h) {
    const m = l + h >>> 1;
    const x = a[m];
    if (x === y) return m;else if (x <= y) l = m + 1;else h = m - 1;
  }

  return -1;
};

const getColumns = function (width, minimumWidth, gutter, columnCount, maxColumnCount, maxColumnWidth) {
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
  let columnWidth = Math.floor((width - gutter * (columnCount - 1)) / columnCount); // Cap the column width if maxColumnWidth is specified

  if (maxColumnWidth !== undefined && columnWidth > maxColumnWidth) {
    columnWidth = maxColumnWidth;
  }

  return [columnWidth, columnCount];
};

const emptyArr = [];