export const haptic = {
  tap: () => { try { navigator.vibrate?.(6); } catch { /* ignore */ } },
  soft: () => { try { navigator.vibrate?.(12); } catch { /* ignore */ } },
  wrong: () => { try { navigator.vibrate?.([30, 40, 30]); } catch { /* ignore */ } },
  win: () => { try { navigator.vibrate?.([20, 40, 20, 40, 60]); } catch { /* ignore */ } },
};
