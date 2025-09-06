import { useMasonry } from "./use-masonry";
import { useScroller } from "./use-scroller";
/**
 * A heavily-optimized component that updates `useMasonry()` when the scroll position of the browser `window`
 * changes. This bare-metal component is used by `<Masonry>` under the hood.
 *
 * @param props
 */

export function MasonryScroller(props) {
  // We put this in its own layer because it's the thing that will trigger the most updates
  // and we don't want to slower ourselves by cycling through all the functions, objects, and effects
  // of other hooks
  const {
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

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  MasonryScroller.displayName = "MasonryScroller";
}