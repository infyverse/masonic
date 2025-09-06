import { useWindowSize } from "@react-hook/window-size";
import * as React from "react";
const __reactCreateElement__ = React.createElement;
import { MasonryScroller } from "./masonry-scroller";
import { useContainerPosition } from "./use-container-position";
import { usePositioner } from "./use-positioner";
import { useResizeObserver } from "./use-resize-observer";
import { useScrollToIndex } from "./use-scroll-to-index";

/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 *
 * @param props
 */
export function Masonry(props) {
  const containerRef = React.useRef(null);
  const windowSize = useWindowSize({
    initialWidth: props.ssrWidth,
    initialHeight: props.ssrHeight
  });
  const containerPos = useContainerPosition(containerRef, windowSize);
  const nextProps = Object.assign({
    offset: containerPos.offset,
    width: containerPos.width || windowSize[0],
    height: windowSize[1],
    containerRef
  }, props);
  nextProps.positioner = usePositioner(nextProps);
  nextProps.resizeObserver = useResizeObserver(nextProps.positioner);
  const scrollToIndex = useScrollToIndex(nextProps.positioner, {
    height: nextProps.height,
    offset: containerPos.offset,
    align: typeof props.scrollToIndex === "object" ? props.scrollToIndex.align : void 0
  });
  const index = props.scrollToIndex && (typeof props.scrollToIndex === "number" ? props.scrollToIndex : props.scrollToIndex.index);
  React.useEffect(() => {
    if (index !== void 0) scrollToIndex(index);
  }, [index, scrollToIndex]);
  return __reactCreateElement__(MasonryScroller, nextProps);
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  Masonry.displayName = "Masonry";
}