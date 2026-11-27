let on = true;
export const setHaptics = (v) => { on = !!v; };
/** Short tick. No-ops where the Vibration API is missing (iOS Safari). */
export const tap = (ms = 6) => { if (on) { try { navigator.vibrate?.(ms); } catch { /* unsupported */ } } };
export const buzz = (p = [12, 40, 18]) => { if (on) { try { navigator.vibrate?.(p); } catch { /* unsupported */ } } };
