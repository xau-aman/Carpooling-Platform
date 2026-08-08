import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let notifId = 100
let channelCreated = false

async function ensureChannel() {
  if (channelCreated) return
  try {
    await LocalNotifications.createChannel({
      id: 'gotogether_default',
      name: 'GoTogether Notifications',
      description: 'Ride updates, OTP, payments',
      importance: 5,   // IMPORTANCE_HIGH
      visibility: 1,   // VISIBILITY_PUBLIC
      vibration: true,
      sound: 'default',
    })
    channelCreated = true
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    await ensureChannel()
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'granted') return true
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch {
    return false
  }
}

export async function showLocalNotification(title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureChannel()
    await LocalNotifications.schedule({
      notifications: [{
        id: notifId++,
        title,
        body,
        channelId: 'gotogether_default',
        iconColor: '#714B67',
        autoCancel: true,
        extra: { timestamp: Date.now() },
      }]
    })
  } catch (e) {
    console.warn('[Notif] Failed:', e)
  }
}
