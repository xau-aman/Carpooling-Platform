import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let notifId = 100
let channelCreated = false
let permissionGranted: boolean | null = null

async function ensureChannel() {
  if (channelCreated) return
  try {
    await LocalNotifications.createChannel({
      id: 'gotogether_rides',
      name: 'Ride Updates',
      description: 'OTP, trip status, live tracking',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'default',
    })
    await LocalNotifications.createChannel({
      id: 'gotogether_payments',
      name: 'Payments',
      description: 'Payment confirmations and earnings',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: 'default',
    })
    channelCreated = true
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    // Create channels first — required before requesting permission on Android
    await ensureChannel()
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'granted') { permissionGranted = true; return true }
    if (display === 'denied') { permissionGranted = false; return false }
    // 'prompt' or 'prompt-with-rationale' — ask user
    const result = await LocalNotifications.requestPermissions()
    permissionGranted = result.display === 'granted'
    return permissionGranted
  } catch {
    return false
  }
}

function getChannelId(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('payment') || t.includes('paid') || t.includes('₹') || t.includes('wallet') || t.includes('earning'))
    return 'gotogether_payments'
  return 'gotogether_rides'
}

export async function showLocalNotification(title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureChannel()
    // Use cached permission state, re-check only if unknown
    if (permissionGranted === null) {
      const { display } = await LocalNotifications.checkPermissions()
      if (display !== 'granted') {
        const res = await LocalNotifications.requestPermissions()
        permissionGranted = res.display === 'granted'
      } else {
        permissionGranted = true
      }
    }
    if (!permissionGranted) return
    await LocalNotifications.schedule({
      notifications: [{
        id: notifId++,
        title,
        body,
        channelId: getChannelId(title),
        iconColor: '#714B67',
        smallIcon: 'ic_stat_notify',
        autoCancel: true,
        extra: { timestamp: Date.now() },
      }]
    })
  } catch (e) {
    console.warn('[Notif] Failed:', e)
  }
}
