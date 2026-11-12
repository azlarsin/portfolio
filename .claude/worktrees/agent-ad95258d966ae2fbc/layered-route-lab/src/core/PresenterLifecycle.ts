export const PRESENTER_LIFECYCLE_EVENTS = [
  "willAppear",
  "didAppear",
  "willDisappear",
  "didDisappear",
] as const;

export type PresenterLifecycleEvent =
  (typeof PRESENTER_LIFECYCLE_EVENTS)[number];

type PresenterLifecycleListener = () => void;

export interface PresenterLifecycle {
  emit: (event: PresenterLifecycleEvent) => void;
  getCurrentEvent: () => PresenterLifecycleEvent;
  on: (
    event: PresenterLifecycleEvent,
    listener: PresenterLifecycleListener,
  ) => () => void;
}

export function createPresenterLifecycle(
  initialEvent: PresenterLifecycleEvent,
): PresenterLifecycle {
  let currentEvent = initialEvent;
  const listeners = new Map<
    PresenterLifecycleEvent,
    Set<PresenterLifecycleListener>
  >(
    PRESENTER_LIFECYCLE_EVENTS.map((event) => [
      event,
      new Set<PresenterLifecycleListener>(),
    ]),
  );

  return {
    emit(event) {
      currentEvent = event;
      listeners.get(event)?.forEach((listener) => listener());
    },
    getCurrentEvent() {
      return currentEvent;
    },
    on(event, listener) {
      const eventListeners = listeners.get(event);
      eventListeners?.add(listener);
      return () => eventListeners?.delete(listener);
    },
  };
}
