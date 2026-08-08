import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { connectSocket } from '../lib/socket'

interface Notif { id: string; title: string; body: string; isRead: boolean; createdAt: string }

export default function Notifications() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => api.get('/notifications').then(r => setNotifs(r.data.data)).finally(() => setLoading(false))
  const handleRefresh = () => {
    setRefreshing(true)
    api.get('/notifications').then(r => setNotifs(r.data.data)).finally(() => setRefreshing(false))
  }
  useEffect(() => { load() }, [])

  // Realtime: reload when new notification arrives
  useEffect(() => {
    const s = connectSocket()
    s.on('notification:new', load)
    return () => { s.off('notification:new', load) }
  }, [])

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifs(n => n.map(x => ({ ...x, isRead: true })))
  }

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 py-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-bold text-xl">Notifications</h1>
              {unread > 0 && <p className="text-xs text-[#f97316] font-semibold">{unread} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-bold text-[#714B67] px-3 py-2 rounded-full bg-[#f9f5ff] active:scale-95">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
              <RefreshCw size={16} className={`text-[#6b6b6b] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}

        {!loading && notifs.length === 0 && (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="font-bold text-[#0f0f0f]">No notifications yet</p>
          </div>
        )}

        {notifs.map(n => (
          <div key={n.id} className={`bg-white rounded-2xl p-4 flex gap-3 ${!n.isRead ? 'border-l-4 border-[#f97316]' : ''}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-[#f97316]' : 'bg-[#e5e5e5]'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#0f0f0f]">{n.title}</p>
              <p className="text-sm text-[#6b6b6b] mt-0.5">{n.body}</p>
              <p className="text-xs text-[#9ca3af] mt-1">
                {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
