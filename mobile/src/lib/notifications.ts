import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let notifId = 100
let channelCreated = false
// Never cache as false — always re-check so user granting permission later works
let permissionGranted = false

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
    await LocalNotifications.createChannel({
      id: 'gotogether_live',
      name: 'Live Trip',
      description: 'Ongoing trip progress',
      importance: 3,
      visibility: 1,
      vibration: false,
      sound: 'default',
    })
    channelCreated = true
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    // Channels must exist before scheduling — create them here
    await ensureChannel()
    // Permission was already requested natively in MainActivity on launch
    // Just check current state and cache it
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'granted') { permissionGranted = true }
    return display === 'granted'
  } catch {
    return false
  }
}

async function checkPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  if (permissionGranted) return true
  try {
    const { display } = await LocalNotifications.checkPermissions()
    permissionGranted = display === 'granted'
    return permissionGranted
  } catch { return false }
}

function getChannelId(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('payment') || t.includes('paid') || t.includes('wallet') || t.includes('earning') || t.includes('credited'))
    return 'gotogether_payments'
  return 'gotogether_rides'
}

export async function showLocalNotification(title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureChannel()
    const ok = await checkPermission()
    if (!ok) return
    await LocalNotifications.schedule({
      notifications: [{
        id: notifId++,
        title,
        body,
        channelId: getChannelId(title),
        iconColor: '#714B67',
        autoCancel: true,
        extra: { timestamp: Date.now() },
      }]
    })
  } catch (e) {
    console.warn('[Notif] Failed:', e)
  }
}

// Live trip progress notification — updates in place (same id = 1)
const LIVE_NOTIF_ID = 1
export async function showLiveTripNotification(from: string, to: string, status: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureChannel()
    const ok = await checkPermission()
    if (!ok) return
    const statusText: Record<string, string> = {
      IN_PROGRESS: '🚗 Trip in progress',
      STARTED: '🔑 OTP verification pending',
      PAYMENT_PENDING: '💳 Trip done — payment pending',
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: LIVE_NOTIF_ID,
        title: statusText[status] ?? '🚗 GoTogether',
        body: `${from} → ${to}`,
        channelId: 'gotogether_live',
        iconColor: '#f97316',
        ongoing: status === 'IN_PROGRESS',
        autoCancel: status !== 'IN_PROGRESS',
        extra: { live: true },
      }]
    })
  } catch (e) {
    console.warn('[LiveNotif] Failed:', e)
  }
}

export async function cancelLiveTripNotification() {
  if (!Capacitor.isNativePlatform()) return
  try { await LocalNotifications.cancel({ notifications: [{ id: LIVE_NOTIF_ID }] }) } catch {}
}
