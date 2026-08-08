import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../lib/api'
import { PageHeader, LoadingState, StatCard } from '../../components/ui'
import { MapPin, IndianRupee, Users, Car } from 'lucide-react'

interface AdminReport {
  totalTrips: number
  totalDistance: number
  totalFuelCost: number
  totalPassengers: number
  vehicleStats: Array<{ vehicleId: string; _count: { id: number }; _sum: { distanceKm: number | null } }>
}

export default function AdminReports() {
  const [data, setData] = useState<AdminReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reports').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  const vehicleChartData = data.vehicleStats.slice(0, 6).map((v, i) => ({
    name: `V${i + 1}`,
    trips: v._count.id,
    km: Math.round(v._sum.distanceKm ?? 0),
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Organization Reports" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trips" value={data.totalTrips} icon={<MapPin size={20} />} />
        <StatCard label="Total Distance" value={`${data.totalDistance}km`} icon={<Car size={20} />} />
        <StatCard label="Fuel Cost" value={`₹${data.totalFuelCost}`} icon={<IndianRupee size={20} />} accent />
        <StatCard label="Passengers" value={data.totalPassengers} icon={<Users size={20} />} />
      </div>

      {vehicleChartData.length > 0 && (
        <div className="neo-card p-5 mb-6">
          <p className="font-display font-bold text-sm uppercase mb-4">Vehicle Utilization (Trips)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vehicleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#f97316" name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="neo-card overflow-hidden">
        <div className="px-5 py-3 bg-[#0f0f0f]">
          <p className="font-display font-bold text-sm uppercase text-white">Financial Summary</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: 'Total Completed Trips', value: data.totalTrips },
              { label: 'Total Distance Covered', value: `${data.totalDistance} km` },
              { label: 'Estimated Fuel Cost', value: `₹${data.totalFuelCost}` },
              { label: 'Total Passengers Served', value: data.totalPassengers },
              { label: 'Active Vehicles', value: data.vehicleStats.length },
            ].map(row => (
              <tr key={row.label} className="border-b border-[#f0ede6] last:border-0">
                <td className="px-5 py-3 text-[#6b6b6b]">{row.label}</td>
                <td className="px-5 py-3 font-bold text-right">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
