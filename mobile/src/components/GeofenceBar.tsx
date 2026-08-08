const RADIUS = 300

interface Props {
  distM: number | null
}

export default function GeofenceBar({ distM }: Props) {
  if (distM === null) return null
  const near = distM <= RADIUS
  return (
    <div className="mx-4 mb-3 rounded-2xl p-3 flex items-center gap-3"
      style={{ background: near ? '#f0fdf4' : '#fff7ed' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: near ? '#16a34a' : '#f97316' }}>
        <span className="text-white text-sm">{near ? '✓' : '📍'}</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: near ? '#16a34a' : '#ea580c' }}>
        {near
          ? `Within ${RADIUS}m — tap Complete Trip`
          : `${distM}m from destination (need < ${RADIUS}m)`}
      </p>
    </div>
  )
}
