import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../lib/api'
import { PageHeader, LoadingState, StatCard } from '../components/ui'
import { Leaf, IndianRupee, MapPin, Users } from 'lucide-react'

interface ReportData {
  totalTrips: number
  totalDistance: number
  totalFuelCost: number
  totalPassengers: number
}

// Mock monthly data for charts (derived from real totals)
const buildMonthlyData = (total: number) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
    month,
    value: Math.round((total / 6) * (0.6 + i * 0.1)),
  }))

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Employee reports from trips
    api.get('/trips').then(r => {
      const trips = r.data.data
      const completed = trips.filter((t: { status: string }) => ['COMPLETED', 'PAYMENT_COMPLETED'].includes(t.status))
      setData({
        totalTrips: completed.length,
        totalDistance: completed.reduce((s: number, t: { ride: { distanceKm?: number } }) => s + (t.ride.distanceKm ?? 0), 0),
        totalFuelCost: completed.reduce((s: number, t: { ride: { farePerSeat: number } }) => s + t.ride.farePerSeat, 0),
        totalPassengers: completed.length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  const co2Saved = Math.round(data.totalDistance * 0.21 * 10) / 10
  const moneySaved = Math.round(data.totalDistance * 6)

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Reports" subtitle="Your carpooling impact" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trips" value={data.totalTrips} icon={<MapPin size={20} />} />
        <StatCard label="Distance" value={`${Math.round(data.totalDistance)}km`} icon={<MapPin size={20} />} />
        <StatCard label="Money Saved" value={`₹${moneySaved}`} icon={<IndianRupee size={20} />} accent />
        <StatCard label="CO₂ Saved" value={`${co2Saved}kg`} icon={<Leaf size={20} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trips over time */}
        <div className="neo-card p-5">
          <p className="font-display font-bold text-sm uppercase mb-4">Trips Per Month</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={buildMonthlyData(data.totalTrips)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distance per month */}
        <div className="neo-card p-5">
          <p className="font-display font-bold text-sm uppercase mb-4">Distance (km)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={buildMonthlyData(data.totalDistance)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f0f0f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="neo-card mt-6 overflow-hidden">
        <div className="px-5 py-3 bg-[#0f0f0f]">
          <p className="font-display font-bold text-sm uppercase text-white">Financial Summary</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: 'Total Trips Completed', value: data.totalTrips },
              { label: 'Total Distance Covered', value: `${Math.round(data.totalDistance)} km` },
              { label: 'Estimated Fuel Cost Saved', value: `₹${moneySaved}` },
              { label: 'CO₂ Emissions Reduced', value: `${co2Saved} kg` },
              { label: 'Colleagues Carpooled With', value: data.totalPassengers },
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
