export function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}
export function hapticStrong() {
  if (navigator.vibrate) navigator.vibrate([20, 30, 60]);
}
