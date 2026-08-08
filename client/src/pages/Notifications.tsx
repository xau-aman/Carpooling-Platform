import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import api from '../lib/api'
import Button from '../components/Button'
import { PageHeader, LoadingState, EmptyState } from '../components/ui'

interface Notification {
  id: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/notifications').then(r => setNotifs(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    setNotifs(n => n.map(x => ({ ...x, isRead: true })))
  }

  if (loading) return <LoadingState />

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        action={unread > 0 ? <Button variant="ghost" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>Mark all read</Button> : undefined}
      />

      {notifs.length === 0 ? (
        <EmptyState message="No notifications yet." icon={<Bell size={40} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map(n => (
            <div key={n.id} className={`neo-card p-4 flex gap-3 ${!n.isRead ? 'border-[#f97316]' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-[#f97316]' : 'bg-[#f0ede6]'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-sm text-[#6b6b6b] mt-0.5">{n.body}</p>
                <p className="text-xs text-[#6b6b6b] mt-1">
                  {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
