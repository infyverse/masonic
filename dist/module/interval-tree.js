const RED = 0;
const BLACK = 1;
const NIL = 2;
const DELETE = 0;
const KEEP = 1;

function addInterval(treeNode, high, index) {
  let node = treeNode.list;
  let prevNode;

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
  let node = treeNode.list;

  if (node.index === index) {
    if (node.next === null) return DELETE;
    treeNode.list = node.next;
    return KEEP;
  }

  let prevNode = node;
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

const NULL_NODE = {
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
  const max = node.high;
  if (node.L === NULL_NODE && node.R === NULL_NODE) node.max = max;else if (node.L === NULL_NODE) node.max = Math.max(node.R.max, max);else if (node.R === NULL_NODE) node.max = Math.max(node.L.max, max);else node.max = Math.max(Math.max(node.L.max, node.R.max), max);
}

function updateMaxUp(node) {
  let x = node;

  while (x.P !== NULL_NODE) {
    updateMax(x.P);
    x = x.P;
  }
}

function rotateLeft(tree, x) {
  if (x.R === NULL_NODE) return;
  const y = x.R;
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
  const y = x.L;
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
  let w;

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
  let y;

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

export function createIntervalTree() {
  const tree = {
    root: NULL_NODE,
    size: 0
  }; // we know these indexes are a consistent, safe way to make look ups
  // for our case so it's a solid O(1) alternative to
  // the O(log n) searchNode() in typical interval trees

  const indexMap = {};
  return {
    insert(low, high, index) {
      let x = tree.root;
      let y = NULL_NODE;

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

      const z = {
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
      const z = indexMap[index];
      if (z === void 0) return;
      delete indexMap[index];
      const intervalResult = removeInterval(z, index);
      if (intervalResult === void 0) return;

      if (intervalResult === KEEP) {
        z.high = z.list.high;
        updateMax(z);
        updateMaxUp(z);
        tree.size--;
        return;
      }

      let y = z;
      let originalYColor = y.C;
      let x;

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
      const stack = [tree.root];

      while (stack.length !== 0) {
        const node = stack.pop();
        if (node === NULL_NODE || low > node.max) continue;
        if (node.L !== NULL_NODE) stack.push(node.L);
        if (node.R !== NULL_NODE) stack.push(node.R);

        if (node.low <= high && node.high >= low) {
          let curr = node.list;

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