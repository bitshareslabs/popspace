import { EventEmitter } from 'events';
import throttle from 'lodash.throttle';
import create from 'zustand/vanilla';
import { Viewport } from '../viewport/Viewport';
import { RoomStateShape, useRoomStore } from '@roomState/useRoomStore';
import { Bounds, Vector2 } from '../../types/spatials';
import { clampSizeMaintainingRatio } from '@utils/clampSizeMaintainingRatio';
import { addVectors, clamp, multiplyVector, snap, snapWithoutZero } from '@utils/math';
import { SMALL_SIZE } from '@features/room/people/constants';

const MOVE_THROTTLE_PERIOD = 100;

type ActiveGestureState = {
  objectId: string | null;
  objectKind: CanvasObjectKind | null;
  position: Vector2 | null;
  size: Bounds | null;
  aspectRatio: number | null;
};

export interface CanvasOptions {
  /** Snaps items to a world-unit grid after dropping them - defaults to 1. */
  positionSnapIncrement?: number;
  sizeSnapIncrement?: number;
}

export interface CanvasEvents {
  gestureStart: () => void;
  gestureEnd: () => void;
}

/**
 * Different kinds of objects we use as content within any kind of Canvas.
 * 'other' is a special category, these items are usually ephemeral and their
 * position isn't stored or synced to peers but still requires positioning onscreen.
 */
export type CanvasObjectKind = 'person' | 'widget' | 'other';

export interface ResizeInfo {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveAspect?: boolean;
  origin?: 'top-left' | 'center';
}

/**
 * Returns a selector function to get the position vector of an object
 * in the Room Store.
 */
const objectPositionSelector = (objectId: string, objectType: CanvasObjectKind) => (roomState: RoomStateShape) => {
  if (objectType === 'person') {
    return roomState.userPositions[objectId]?.position ?? { x: 0, y: 0 };
  } else if (objectType === 'widget') {
    return roomState.widgetPositions[objectId]?.position ?? { x: 0, y: 0 };
  }
  return { x: 0, y: 0 };
};
const objectSizeSelector = (objectId: string, objectType: CanvasObjectKind) => (roomState: RoomStateShape) => {
  if (objectType === 'person') {
    return roomState.userPositions[objectId]?.size ?? { width: SMALL_SIZE, height: SMALL_SIZE };
  } else if (objectType === 'widget') {
    return roomState.widgetPositions[objectId]?.size ?? { width: 140, height: 80 };
  }
  return { width: 140, height: 80 };
};

export declare interface Canvas {
  on<Event extends keyof CanvasEvents>(ev: Event, cb: CanvasEvents[Event]): this;
  off<Event extends keyof CanvasEvents>(ev: Event, cb: CanvasEvents[Event]): this;
  emit<Event extends keyof CanvasEvents>(ev: Event, ...args: Parameters<CanvasEvents[Event]>): boolean;
}

/**
 * This class encapsulates the logic which powers the movement and
 * sizing of objects within a Room Canvas - the 2d space that makes
 * up the standard With Room. It implements the required functionality
 * for both CanvasContext and SizingContext
 */
export class Canvas extends EventEmitter {
  private activeGestureStore = create(
    () =>
      ({
        objectId: null,
        objectKind: null,
        position: null,
        size: null,
        aspectRatio: null,
      } as ActiveGestureState)
  );

  private measurementsStore = create(() => ({} as Record<string, Bounds>));

  private positionObservers: Record<string, Set<(position: Vector2) => void>> = {};
  private sizeObservers: Record<string, Set<(size: Bounds) => void>> = {};

  private unsubscribeActiveGesture: () => void;

  private _positionSnapIncrement = 1;
  private _sizeSnapIncrement = 1;

  readonly name = 'roomCanvas';

  constructor(private viewport: Viewport, options?: CanvasOptions) {
    super();
    this.unsubscribeActiveGesture = this.activeGestureStore.subscribe(this.handleActiveGestureChange);
    // @ts-ignore for debugging...
    window.roomCanvas = this;
    this._positionSnapIncrement = options?.positionSnapIncrement ?? 1;
    this._sizeSnapIncrement = options?.sizeSnapIncrement ?? 1;
  }

  private commitGesture = (
    objectId: string,
    objectKind: CanvasObjectKind,
    position: Vector2 | null,
    size: Bounds | null
  ) => {
    if (objectKind === 'person') {
      const { getActiveUserId, transformSelf } = useRoomStore.getState().api;
      // local user can only move or resize themselves; ignore gestures for all
      // other users
      if (objectId !== getActiveUserId()) return;

      transformSelf({ position: position || undefined, size: size || undefined });
    } else if (objectKind === 'widget') {
      useRoomStore.getState().api.transformWidget({
        widgetId: objectId,
        transform: {
          position: position || undefined,
          size: size || undefined,
        },
      });
    }
  };
  /**
   * Commits the gesture data from the active gesture store to
   * the backend
   */
  private commitActiveGesture = () => {
    const { objectId, objectKind, position, size } = this.activeGestureStore.getState();
    if (!objectId || !objectKind) return;
    this.commitGesture(objectId, objectKind, position, size);
  };
  private throttledCommitActiveGesture = throttle(this.commitActiveGesture, MOVE_THROTTLE_PERIOD, { trailing: false });

  // subscribe to changes in active object position and forward them to the
  // correct object
  private handleActiveGestureChange = (state: ActiveGestureState) => {
    if (state.objectId) {
      if (state.position) {
        const position = state.position;
        this.positionObservers[state.objectId]?.forEach((cb) => cb(position));
      }
      if (state.size) {
        const size = state.size;
        this.sizeObservers[state.objectId]?.forEach((cb) => cb(size));
      }
    }
  };

  private clearActiveGesture = () => {
    this.activeGestureStore.setState({
      objectId: null,
      objectKind: null,
      position: null,
      size: null,
      aspectRatio: null,
    });
  };

  private snapPosition = (position: Vector2) => ({
    x: snap(position.x, this._positionSnapIncrement),
    y: snap(position.y, this._positionSnapIncrement),
  });

  onObjectDragStart = (screenPosition: Vector2, objectId: string, objectType: CanvasObjectKind) => {
    const worldPosition = this.viewport.viewportToWorld(screenPosition, true);
    this.activeGestureStore.setState({
      objectId,
      objectKind: objectType,
      position: worldPosition,
    });
    this.emit('gestureStart');
  };

  onObjectDrag = (screenPosition: Vector2, objectId: string, objectType: CanvasObjectKind) => {
    const worldPosition = this.viewport.viewportToWorld(screenPosition, true);
    this.activeGestureStore.setState({
      objectId,
      objectKind: objectType,
      position: worldPosition,
    });
    this.throttledCommitActiveGesture();
  };

  onObjectDragEnd = (screenPosition: Vector2, objectId: string, objectType: CanvasObjectKind) => {
    const worldPosition = this.viewport.viewportToWorld(screenPosition, true);
    this.activeGestureStore.setState({
      objectId,
      objectKind: objectType,
      position: worldPosition,
    });
    this.commitActiveGesture();
    this.clearActiveGesture();
    this.emit('gestureEnd');
  };

  /**
   * Directly sets the world position of an object, applying
   * clamping and snapping behaviors.
   */
  setPosition = (worldPosition: Vector2, objectId: string, objectType: CanvasObjectKind) => {
    this.commitGesture(objectId, objectType, this.viewport.clampToWorld(this.snapPosition(worldPosition)), null);
  };

  /**
   * Moves an object relatively from its current position in world coordinates, applying
   * clamping and snapping behaviors.
   */
  movePositionRelative = (movement: Vector2, objectId: string, objectType: CanvasObjectKind) => {
    this.commitGesture(
      objectId,
      objectType,
      this.viewport.clampToWorld(this.snapPosition(addVectors(this.getPosition(objectId, objectType), movement))),
      null
    );
  };

  observePosition = (objectId: string, objectType: CanvasObjectKind, observer: (position: Vector2) => void) => {
    // store the observer
    this.positionObservers[objectId] = this.positionObservers[objectId] ?? new Set();
    this.positionObservers[objectId].add(observer);
    // subscribe to position
    const unsubscribe = useRoomStore.subscribe((position) => {
      // only notify observer of Room State position changes if the object
      // is not actively being moved, which should override Room State position.
      if (this.activeGestureStore.getState().objectId !== objectId) {
        observer(position);
      }
    }, objectPositionSelector(objectId, objectType));

    return () => {
      unsubscribe();
      this.positionObservers[objectId]?.delete(observer);
    };
  };

  getPosition = (objectId: string, objectType: CanvasObjectKind) => {
    const activeDragState = this.activeGestureStore.getState();
    if (activeDragState.objectId === objectId && activeDragState.position) {
      return activeDragState.position;
    }

    return objectPositionSelector(objectId, objectType)(useRoomStore.getState());
  };

  private clampAndEnforceMode = ({
    width,
    height,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    preserveAspect,
    aspectRatio,
    snap: doSnap,
  }: {
    width: number;
    height: number;
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    preserveAspect?: boolean;
    aspectRatio: number;
    snap: boolean;
  }) => {
    let clamped;
    if (preserveAspect) {
      clamped = clampSizeMaintainingRatio({
        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        aspectRatio: aspectRatio,
      });
    } else {
      clamped = {
        width: clamp(width, minWidth, maxWidth),
        height: clamp(height, minHeight, maxHeight),
      };
    }
    if (doSnap) {
      clamped.width = snapWithoutZero(clamped.width, this._sizeSnapIncrement);
      clamped.height = snapWithoutZero(clamped.height, this._sizeSnapIncrement);
    }
    return clamped;
  };

  onResizeStart = (initialSize: Bounds, objectId: string, objectKind: CanvasObjectKind) => {
    this.activeGestureStore.setState({
      objectId,
      objectKind,
      aspectRatio: initialSize.width / initialSize.height,
      size: initialSize,
      position: this.getPosition(objectId, objectKind),
    });
  };

  private getCenterResizeOffset = (objectId: string, objectKind: CanvasObjectKind, newSize: Bounds) => {
    const oldSize = this.getSize(objectId, objectKind);
    const delta = { x: newSize.width - oldSize.width, y: newSize.height - oldSize.height };
    return addVectors(this.getPosition(objectId, objectKind), multiplyVector(delta, -0.5));
  };

  onResize = (size: Bounds, objectId: string, objectKind: CanvasObjectKind, info: ResizeInfo) => {
    const clampedSize = this.clampAndEnforceMode({
      ...size,
      ...info,
      aspectRatio: this.activeGestureStore.getState().aspectRatio || 1,
      snap: false,
    });

    // for center origin, offset the position at 1/2 the size delta
    const position =
      info.origin === 'center'
        ? this.getCenterResizeOffset(objectId, objectKind, clampedSize)
        : this.activeGestureStore.getState().position;

    this.activeGestureStore.setState({
      size: clampedSize,
      objectId,
      objectKind,
      position,
    });
  };

  onResizeEnd = (size: Bounds, objectId: string, objectKind: CanvasObjectKind, info: ResizeInfo) => {
    const clampedSize = this.clampAndEnforceMode({
      ...size,
      ...info,
      aspectRatio: this.activeGestureStore.getState().aspectRatio || 1,
      snap: true,
    });
    // for center origin, offset the position at 1/2 the size delta
    const position =
      info.origin === 'center'
        ? this.getCenterResizeOffset(objectId, objectKind, clampedSize)
        : this.activeGestureStore.getState().position;
    this.activeGestureStore.setState({
      objectId,
      objectKind,
      size: clampedSize,
      position,
    });
    this.commitActiveGesture();
    this.clearActiveGesture();
  };

  /**
   * Directly set the size of an object, in world units, applying any resize
   * constraints.
   */
  setSize = (size: Bounds, objectId: string, objectKind: CanvasObjectKind, info: ResizeInfo) => {
    const currentSize = this.getSize(objectId, objectKind);
    const currentAspectRatio = currentSize.width / currentSize.height;
    const clampedSize = this.clampAndEnforceMode({
      ...size,
      ...info,
      aspectRatio: currentAspectRatio,
      snap: true,
    });
    // for center origin, offset the position at 1/2 the size delta
    const position = info.origin === 'center' ? this.getCenterResizeOffset(objectId, objectKind, clampedSize) : null;

    this.commitGesture(objectId, objectKind, position, clampedSize);
  };

  observeSize = (objectId: string, objectKind: CanvasObjectKind, observer: (size: Bounds) => void) => {
    // store the observer
    this.sizeObservers[objectId] = this.sizeObservers[objectId] ?? new Set();
    this.sizeObservers[objectId].add(observer);
    // subscribe to position
    const unsubscribe = useRoomStore.subscribe((position) => {
      // only notify observer of Room State position changes if the object
      // is not actively being moved, which should override Room State position.
      if (this.activeGestureStore.getState().objectId !== objectId) {
        observer(position);
      }
    }, objectSizeSelector(objectId, objectKind));

    return () => {
      unsubscribe();
      this.sizeObservers[objectId]?.delete(observer);
    };
  };

  getSize = (objectId: string, objectKind: CanvasObjectKind) => {
    const activeResizeState = this.activeGestureStore.getState();
    if (activeResizeState.objectId === objectId && activeResizeState.size) {
      return activeResizeState.size;
    }

    return objectSizeSelector(objectId, objectKind)(useRoomStore.getState());
  };

  onMeasure = (size: Bounds, objectId: string) => {
    this.measurementsStore.setState({
      [objectId]: size,
    });
  };

  observeMeasurements = (objectId: string, objectKind: CanvasObjectKind, observer: (size: Bounds) => void) => {
    return this.measurementsStore.subscribe<Bounds | undefined>(
      (size) => observer(size ?? { width: 0, height: 0 }),
      (sizes) => sizes[objectId]
    );
  };

  getMeasurements = (objectId: string) => this.measurementsStore.getState()[objectId] ?? { width: 0, height: 0 };

  onGestureStart = () => {
    this.emit('gestureStart');
  };

  onGestureEnd = () => {
    this.emit('gestureEnd');
  };

  dispose = () => {
    this.unsubscribeActiveGesture();
  };
}
