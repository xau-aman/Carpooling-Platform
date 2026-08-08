import { useEffect, useState } from 'react'
import { Users, Car, MapPin, TrendingUp } from 'lucide-react'
import api from '../../lib/api'
import { StatCard, LoadingState, PageHeader } from '../../components/ui'

interface Stats { employees: number; vehicles: number; ridesThisMonth: number; completedTrips: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Admin Dashboard" subtitle="Organization overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats?.employees ?? 0} icon={<Users size={20} />} />
        <StatCard label="Registered Vehicles" value={stats?.vehicles ?? 0} icon={<Car size={20} />} accent />
        <StatCard label="Rides This Month" value={stats?.ridesThisMonth ?? 0} icon={<MapPin size={20} />} />
        <StatCard label="Completed Trips" value={stats?.completedTrips ?? 0} icon={<TrendingUp size={20} />} />
      </div>
    </div>
  )
}
