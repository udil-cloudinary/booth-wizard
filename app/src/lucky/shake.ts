type PermissionAPI = { requestPermission?: () => Promise<'granted' | 'denied'> };

/** Change in acceleration (m/s², summed over the 3 axes) that counts as one jolt. */
const JOLT = 24;
/** Two jolts this close together make a shake. */
const WINDOW_MS = 600;
/** No second shake right after the first one. */
const COOLDOWN_MS = 1500;

/**
 * Shake-to-reroll. `onAvailable` fires once a real motion reading arrives, so
 * laptops (DeviceMotionEvent defined, no sensor) never show the shake hint.
 * iOS needs `ask()` from inside a tap before it sends any readings.
 */
export function shakeDetector(onShake: () => void, onAvailable: () => void) {
  const DME = (globalThis as { DeviceMotionEvent?: PermissionAPI }).DeviceMotionEvent;
  let listening = false;
  let available = false;
  let prev: { x: number; y: number; z: number } | null = null;
  let lastJolt = 0;
  let lastShake = 0;

  function onMotion(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null || a.y === null || a.z === null) return;
    if (!available) {
      available = true;
      onAvailable();
    }
    const cur = { x: a.x, y: a.y, z: a.z };
    if (prev) {
      const delta = Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) + Math.abs(cur.z - prev.z);
      const now = e.timeStamp || performance.now();
      if (delta > JOLT) {
        if (now - lastJolt < WINDOW_MS && now - lastShake > COOLDOWN_MS) {
          lastShake = now;
          onShake();
        }
        lastJolt = now;
      }
    }
    prev = cur;
  }

  function listen() {
    if (listening || !DME) return;
    listening = true;
    window.addEventListener('devicemotion', onMotion);
  }

  // Android and others: readings come without asking.
  if (DME && typeof DME.requestPermission !== 'function') listen();

  return {
    /** Call from a tap handler. iOS shows its permission prompt once. */
    ask() {
      if (listening || !DME || typeof DME.requestPermission !== 'function') return;
      DME.requestPermission()
        .then((r) => r === 'granted' && listen())
        .catch(() => {});
    },
  };
}
