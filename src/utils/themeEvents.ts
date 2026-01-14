// src/utils/themeEvents.ts

type Listener = () => void;

export const THEME_UPDATED = "THEME_UPDATED";

class ThemeEvents {
  private listeners = new Set<Listener>();

  emit() {
    this.listeners.forEach((cb) => cb());
  }

  on(cb: Listener) {
    this.listeners.add(cb);

    // return unsubscribe function
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const themeEvents = new ThemeEvents();
