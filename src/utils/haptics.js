/**
 * Safe haptic feedback utility for mobile web apps.
 * Triggers light vibration pulses on supported touch devices without throwing errors.
 */
export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window)) return

  try {
    if (navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10)
          break
        case 'medium':
          navigator.vibrate(18)
          break
        case 'heavy':
          navigator.vibrate(35)
          break
        case 'success':
          navigator.vibrate([10, 30, 20])
          break
        case 'warning':
          navigator.vibrate([25, 40, 25])
          break
        case 'click':
          navigator.vibrate(8)
          break
        default:
          navigator.vibrate(10)
          break
      }
    }
  } catch {
    // Ignore unsupported device/browser vibration exceptions
  }
}
