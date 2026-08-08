import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let notifId = 100
let channelCreated = false

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
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'default',
    })
    await LocalNotifications.createChannel({
      id: 'gotogether_live',
      name: 'Live Trip',
      description: 'Ongoing trip progress',
      importance: 4,
      visibility: 1,
      vibration: false,
      sound: 'default',
    })
    channelCreated = true
  } catch {}
}

// Called once on login/restore — just sets up channels
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  await ensureChannel()
  const { display } = await LocalNotifications.checkPermissions().catch(() => ({ display: 'denied' as const }))
  return display === 'granted'
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
    // Always fresh check — no caching that could block notifications
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') return
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
    console.warn('[Notif]', e)
  }
}

// Live trip progress notification — same id so it updates in place
const LIVE_NOTIF_ID = 1
export async function showLiveTripNotification(from: string, to: string, status: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureChannel()
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') return
    const titles: Record<string, string> = {
      IN_PROGRESS:     '🚗 Trip in progress',
      STARTED:         '🔑 OTP pending — share with driver',
      PAYMENT_PENDING: '💳 Trip done — tap to pay',
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: LIVE_NOTIF_ID,
        title: titles[status] ?? '🚗 GoTogether',
        body: `${from.split(',')[0]} → ${to.split(',')[0]}`,
        channelId: 'gotogether_live',
        iconColor: '#f97316',
        ongoing: status === 'IN_PROGRESS',
        autoCancel: status !== 'IN_PROGRESS',
        extra: { live: true },
      }]
    })
  } catch (e) {
    console.warn('[LiveNotif]', e)
  }
}

export async function cancelLiveTripNotification() {
  if (!Capacitor.isNativePlatform()) return
  try { await LocalNotifications.cancel({ notifications: [{ id: LIVE_NOTIF_ID }] }) } catch {}
}
