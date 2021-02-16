import * as React from 'react';
import { Vector2 } from '../../types/spatials';
import { clamp, clampVector } from '../../utils/math';
import useWindowSize from '../../hooks/useWindowSize/useWindowSize';
import { animated, useSpring, to, SpringConfig } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import { makeStyles, Theme } from '@material-ui/core';
import { useKeyboardControls } from '../roomControls/viewport/useKeyboardControls';
import useMergedRefs from '@react-hook/merged-ref';
import { FileDropLayer } from './files/FileDropLayer';
import { mandarin as theme } from '../../theme/theme';
import { useRoomStore } from '../../roomState/useRoomStore';
import { MediaReadinessContext } from '../../components/MediaReadinessProvider/MediaReadinessProvider';
import { useTrackCursor } from './useTrackCursor';
import { EventEmitter } from 'events';

export interface ViewportEventHandlers {
  zoomEnd: () => void;
}
export declare interface ViewportEvents {
  on<U extends keyof ViewportEventHandlers>(event: U, listener: ViewportEventHandlers[U]): this;
  off<U extends keyof ViewportEventHandlers>(event: U, listener: ViewportEventHandlers[U]): this;
  emit<U extends keyof ViewportEventHandlers>(event: U, ...args: Parameters<ViewportEventHandlers[U]>): boolean;
}
/**
 * ViewportEvents is a typed EventEmitter which provides a way for components further down
 * in the tree to react to changes in the viewport. Right now we just support an event
 * fired when a zoom has completed.
 */
export class ViewportEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100000);
  }
}

export const RoomViewportContext = React.createContext<null | {
  toWorldCoordinate: (screenCoordinate: Vector2, clampToBounds?: boolean) => Vector2;
  getZoom: () => number;
  onObjectDragStart: () => void;
  onObjectDragEnd: () => void;
  pan: (delta: Vector2) => void;
  zoom: (delta: number) => void;
  width: number;
  height: number;
  events: ViewportEvents;
}>(null);

export function useRoomViewport() {
  const context = React.useContext(RoomViewportContext);
  if (!context) {
    throw new Error('You must call useRoomViewport inside a RoomViewport');
  }
  return context;
}

export interface IRoomViewportProps {
  children: React.ReactNode;
  /** Configure the minimum zoom ratio - smaller means the room gets smaller */
  minZoom?: number;
  /** Configure the maximum zoom ratio - larger means the room gets larger */
  maxZoom?: number;
  /**
   * Pass content to this prop to render it within the viewport context,
   * but independent of the canvas transformation (i.e. floating UI content
   * that needs to be within the viewport context for certain information)
   */
  uiControls: React.ReactNode;
}

const DESKTOP_INITIAL_ZOOM = 1.25;
const MOBILE_INITIAL_ZOOM = 1;
const isMobile = typeof window !== 'undefined' && window.matchMedia(theme.breakpoints.down('sm'));
const INITIAL_ZOOM = isMobile ? MOBILE_INITIAL_ZOOM : DESKTOP_INITIAL_ZOOM;
const PINCH_GESTURE_DAMPING = 200;
const WHEEL_GESTURE_DAMPING = 400;
// how much "empty space" the user can see at the edge of the world,
// in viewport pixels. Needs to be large enough that the dock and
// any other UI doesn't overlap items on the edges at all times, so
// the user can at least pan to a position where they can reach the
// item.
const PAN_BUFFER = 100;
const VIEWPORT_PAN_SPRING = {
  tension: 500,
  friction: 20,
  mass: 0.1,
};
const VIEWPORT_ZOOM_SPRING = {
  tension: 700,
  friction: 40,
  mass: 0.1,
};
const RELAXED_SPRING = {
  tension: 65,
  friction: 55,
  mass: 10,
};

const useStyles = makeStyles<Theme, IRoomViewportProps>((theme) => ({
  fileDropLayer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  viewport: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    userSelect: 'none',
    cursor: 'move',
    position: 'relative',
    touchAction: 'none',
    contain: 'strict',
    '&:focus': {
      outline: 'none',
    },
  },
  canvas: {
    position: 'absolute',
    transformOrigin: 'center center',
    borderRadius: theme.shape.borderRadius,
    backgroundSize: 'cover',
  },
}));

export const RoomViewport: React.FC<IRoomViewportProps> = (props) => {
  const styles = useStyles(props);

  const { children, minZoom = 1 / 4, maxZoom = 2, uiControls, ...rest } = props;

  const [events] = React.useState(() => new ViewportEvents());

  const bounds = useRoomStore((room) => room.state.bounds);
  const backgroundUrl = useRoomStore((room) => room.state.wallpaperUrl);

  const domTarget = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // some basic necessary variables
  const [windowWidth, windowHeight] = useWindowSize();
  const halfWindowWidth = windowWidth / 2;
  const halfWindowHeight = windowHeight / 2;
  const halfCanvasWidth = bounds.width / 2;
  const halfCanvasHeight = bounds.height / 2;

  // initializes canvas size
  React.useLayoutEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    canvasEl.style.width = `${bounds.width}px`;
    canvasEl.style.height = `${bounds.height}px`;
    canvasEl.style.backgroundImage = `url(${backgroundUrl})`;
  }, [canvasRef, bounds, backgroundUrl]);

  // the main spring which controls the Canvas transformation.
  // X/Y position is in World Space - i.e. the coordinate space
  // is not affected by the zoom
  const [{ centerX, centerY }, setPanSpring] = useSpring(() => ({
    centerX: 0,
    centerY: 0,
    isPanning: false,
    config: VIEWPORT_PAN_SPRING,
  }));
  const [{ zoom, isZooming }, setZoomSpring] = useSpring(() => ({
    zoom: minZoom,
    isZooming: false,
    config: VIEWPORT_ZOOM_SPRING,
  }));

  const toWorldCoordinate = React.useCallback(
    (screenPoint: Vector2, clampToBounds: boolean = false) => {
      const scale = 1 / zoom.goal;
      const currentCenterX = centerX.goal;
      const currentCenterY = centerY.goal;

      // This was a bit trial-and-error, but:
      // 1. subtract half of the window size
      //      Imagine the viewport was centered at 0,0 in world space (the center of the window
      //      is exactly at the center of the room). if the user
      //      moved an object toward the upper left corner of their screen,
      //      that would logically be in negative world coordinate space -
      //      however, screen coordinates are only positive from the top left corner.
      //      this is basically the part that converts from a top-left to a center-based
      //      positioning system.
      // 2. scale based on zoom
      //      scaling for zoom is necessary - imagine if you are at 0.5x zoom and you move
      //      the object 10 pixels to the left - you are actually moving 20 pixels of world
      //      space because the world is half-size.
      // 3. subtract the pan of the canvas
      //      subtracting the pan value accommodates for the fact that pan moves the world
      //      independently of the visible screen space, so we need to add that offset in.
      //      this is done OUTSIDE of the zoom scaling because the pan coordinate is already
      //      in world space and doesn't need to be adjusted for zoom.
      const transformedPoint = {
        x: (screenPoint.x - halfWindowWidth) * scale - currentCenterX,
        y: (screenPoint.y - halfWindowHeight) * scale - currentCenterY,
      };

      // restrict the point to the room bounds, if desired
      if (clampToBounds) {
        return clampVector(
          transformedPoint,
          {
            x: -halfCanvasWidth,
            y: -halfCanvasHeight,
          },
          {
            x: halfCanvasWidth,
            y: halfCanvasHeight,
          }
        );
      }

      return transformedPoint;
    },
    [zoom, centerX, centerY, halfWindowWidth, halfWindowHeight, halfCanvasWidth, halfCanvasHeight]
  );

  const clampPanPosition = React.useCallback(
    (panPosition: Vector2) => {
      const scale = zoom?.goal ?? 1;

      const worldScreenWidth = windowWidth / scale;
      const worldScreenHeight = windowHeight / scale;

      const panBufferWorldSize = PAN_BUFFER / scale;

      const minX = Math.min(0, -halfCanvasWidth + worldScreenWidth / 2) - panBufferWorldSize;
      const maxX = Math.max(0, halfCanvasWidth - worldScreenWidth / 2) + panBufferWorldSize;
      const minY = Math.min(0, -halfCanvasHeight + worldScreenHeight / 2) - panBufferWorldSize;
      const maxY = Math.max(0, halfCanvasHeight - worldScreenHeight / 2) + panBufferWorldSize;

      return {
        x: clamp(panPosition.x, minX, maxX),
        y: clamp(panPosition.y, minY, maxY),
      };
    },
    [halfCanvasHeight, halfCanvasWidth, zoom, windowWidth, windowHeight]
  );

  const doAbsoluteZoom = React.useCallback(
    (val: number, spring?: SpringConfig) => {
      const clamped = clamp(val, minZoom, maxZoom);

      // also update pan position as the user zooms, since
      // the allowed boundary changes slightly as the zoom changes
      const clampedPan = clampPanPosition({
        x: centerX?.goal ?? 0,
        y: centerY?.goal ?? 0,
      });

      const panPromise = setPanSpring({
        centerX: clampedPan.x,
        centerY: clampedPan.y,
        config: spring ?? VIEWPORT_PAN_SPRING,
      });
      const zoomPromise = setZoomSpring({
        zoom: clamped,
        config: spring ?? VIEWPORT_ZOOM_SPRING,
      });
      return Promise.all([panPromise, zoomPromise]);
    },
    [centerX, centerY, clampPanPosition, maxZoom, minZoom, setZoomSpring, setPanSpring]
  );

  const doZoom = React.useCallback(
    (delta: number, spring?: SpringConfig) => {
      const currentZoom = zoom?.goal ?? 1;
      const added = currentZoom + delta;
      return doAbsoluteZoom(added, spring);
    },
    [doAbsoluteZoom, zoom]
  );

  const doPan = React.useCallback(
    (delta: Vector2, spring?: SpringConfig) => {
      // when the user drags, we constrain the distance they can
      // move the canvas to keep it on screen
      // TODO: figure out how to do this with gesture constraints
      // instead of hard-constraining the value (advantage: we can
      // have some elasticity to the boundary collision)
      const clamped = clampPanPosition({
        x: (centerX?.goal ?? 0) - delta.x / (zoom?.goal ?? 1),
        y: (centerY?.goal ?? 0) - delta.y / (zoom?.goal ?? 1),
      });

      return setPanSpring({
        centerX: clamped.x,
        centerY: clamped.y,
        isPanning: true,
        config: spring ?? VIEWPORT_PAN_SPRING,
      });
    },
    [centerX, centerY, clampPanPosition, setPanSpring, zoom]
  );

  const userId = useRoomStore((room) => (room.sessionId && room.sessionLookup[room.sessionId]) ?? null);
  const { isReady } = React.useContext(MediaReadinessContext);

  // these need to be cached in refs so they don't invalidate the effect
  // below when the window size changes.
  const doPanRef = React.useRef(doPan);
  const doAbsoluteZoomRef = React.useRef(doAbsoluteZoom);
  React.useLayoutEffect(() => void (doPanRef.current = doPan), [doPan]);
  React.useLayoutEffect(() => void (doAbsoluteZoomRef.current = doAbsoluteZoom), [doAbsoluteZoom]);
  // on first mount, the view is zoomed out at the center of the room
  // wait a moment, then zoom in to the user's avatar
  React.useEffect(() => {
    if (!isReady) return;

    const timeout = setTimeout(async () => {
      if (!userId) return;

      // find user's position
      const room = useRoomStore.getState();
      const userPosition = room.userPositions[userId];
      const point = userPosition.position;

      // set flags to control rasterization optimizations
      setPanSpring({ isPanning: true });
      setZoomSpring({ isZooming: true });
      // zoom in
      const zoomResult = doAbsoluteZoomRef.current(INITIAL_ZOOM, RELAXED_SPRING);
      const panResult = doPanRef.current(point, RELAXED_SPRING);
      await Promise.all([zoomResult, panResult]);
      setPanSpring({ isPanning: false });
      setZoomSpring({ isZooming: false });
      events.emit('zoomEnd');
    }, 1000);
    return () => clearTimeout(timeout);
  }, [userId, isReady, setPanSpring, setZoomSpring, doPanRef, doAbsoluteZoomRef, events]);

  // active is required to prevent default behavior, which
  // we want to do for zoom.
  useGesture(
    {
      onPinch: ({ delta: [_, d], offset: [dist], event }) => {
        event?.preventDefault();
        doAbsoluteZoom(INITIAL_ZOOM + dist / PINCH_GESTURE_DAMPING);
      },
      onWheel: ({ delta: [x, y], event }) => {
        event?.preventDefault();
        if (event?.ctrlKey || event?.metaKey) {
          doZoom(-y / WHEEL_GESTURE_DAMPING);
        } else {
          doPan({
            x,
            y,
          });
        }
      },
      onPinchStart: ({ event }) => {
        event?.preventDefault();
        setZoomSpring({ isZooming: true });
      },
      onPinchEnd: ({ event }) => {
        event?.preventDefault();
        setZoomSpring({ isZooming: false });
        events.emit('zoomEnd');
      },
    },
    {
      domTarget,
      // keeps the pinch gesture within our min/max zoom bounds,
      // without this you can pinch 'more' than the zoom allows,
      // creating weird deadzones at min and max values where
      // you have to keep pinching to get 'back' into the allowed range
      pinch: {
        distanceBounds: {
          min: (minZoom - INITIAL_ZOOM) * PINCH_GESTURE_DAMPING,
          max: (maxZoom - INITIAL_ZOOM) * PINCH_GESTURE_DAMPING,
        },
      },
      eventOptions: {
        passive: false,
      },
    }
  );

  const onCursorMove = useTrackCursor();

  const bindPassiveGestures = useGesture({
    onDrag: ({ delta: [x, y] }) => {
      doPan({ x: -x, y: -y });
    },
    onDragStart: () => {
      setPanSpring({ isPanning: true });
    },
    onDragEnd: () => {
      setPanSpring({ isPanning: false });
    },
    onWheelStart: ({ event }) => {
      if (event?.ctrlKey) {
        setZoomSpring({ isZooming: true });
      } else {
        setPanSpring({ isPanning: true });
      }
    },
    onWheelEnd: () => {
      if (isZooming.goal) {
        setZoomSpring({ isZooming: false });
      } else {
        setPanSpring({ isPanning: false });
      }
      events.emit('zoomEnd');
    },
    onMove: ({ xy }) => {
      onCursorMove(toWorldCoordinate({ x: xy[0], y: xy[1] }));
    },
  });

  const onObjectDragStart = React.useCallback(() => {
    if (!domTarget.current) return;
    domTarget.current.style.cursor = 'grabbing';
  }, []);

  const onObjectDragEnd = React.useCallback(() => {
    if (!domTarget.current) return;
    domTarget.current.style.cursor = 'move';
  }, []);

  // WARNING: it is vital that this be memoized so that performance doesn't
  // decrease as much as we add more widgets. The reason is that a change in
  // this context value will cause all RoomObjects to re-render. RoomObjects
  // should try to re-render infrequently, as they only control the positioning
  // of the room items, but each one re-rendering will also trigger a re-render
  // of its drag handle, and in some cases (like people) the drag handle is
  // the entire item, so the whole item gets re-rendered. It's a tricky cascade,
  // but keeping that rendering to a minimum really makes a difference for performance.
  // To that end - avoid at all possible making this value change. Right now it
  // only depends on stable references. Some of the referenced functions, like
  // doPan and doZoom, may seem volatile - but they are all just memoized
  // on stable references to spring values and other things which are not
  // going to change often, like the size of the room.
  const infoContextValue = React.useMemo(
    () => ({
      toWorldCoordinate,
      getZoom: () => zoom.get(),
      onObjectDragStart,
      onObjectDragEnd,
      pan: doPan,
      zoom: async (delta: number, spring?: any) => {
        await doZoom(delta, spring);
        events.emit('zoomEnd');
      },
      width: bounds.width,
      height: bounds.height,
      events,
    }),
    [toWorldCoordinate, zoom, onObjectDragStart, onObjectDragEnd, doPan, doZoom, bounds.width, bounds.height, events]
  );

  const { props: keyControlProps } = useKeyboardControls({
    pan: doPan,
    zoom: doZoom,
  });

  const viewportRef = useMergedRefs(keyControlProps.ref, domTarget);

  return (
    <RoomViewportContext.Provider value={infoContextValue}>
      <animated.div
        className={styles.viewport}
        {...keyControlProps}
        ref={viewportRef}
        aria-labelledby="keyboard-explainer"
        {...bindPassiveGestures()}
        {...rest}
      >
        <FileDropLayer className={styles.fileDropLayer}>
          <animated.div
            className={styles.canvas}
            ref={canvasRef}
            style={{
              transform: to([centerX, centerY, zoom], (cx, cy, zoomv) => {
                // 1. Translate the center of the canvas to 0,0 (-halfCanvasWidth, -halfCanvasHeight)
                // 2. Translate that center point back to the center of the screen (+halfWindowWidth, +halfWindowHeight)
                // 3. Scale up (or down) to the specified zoom value
                // 4. Translate the center according to the pan position
                return `translate(${-halfCanvasWidth}px, ${-halfCanvasHeight}px) translate(${halfWindowWidth}px, ${halfWindowHeight}px) scale(${zoomv}, ${zoomv}) translate(${cx}px, ${cy}px)`;
              }),
            }}
          >
            {children}
          </animated.div>
        </FileDropLayer>
      </animated.div>
      {uiControls}
    </RoomViewportContext.Provider>
  );
};
