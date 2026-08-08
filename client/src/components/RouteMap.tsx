import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LatLng { lat: number; lng: number }
interface Props {
  pickup: LatLng
  destination: LatLng
  onRouteCalculated?: (distanceKm: number, durationMin: number, polyline: string) => void
  height?: string
}

export interface RouteInfo { distanceKm: number; durationMin: number }

const makeIcon = (color: string) => L.divIcon({
  html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid #0f0f0f;border-radius:50%;box-shadow:2px 2px 0 rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7], className: '',
})

export default function RouteMap({ pickup, destination, onRouteCalculated, height = 'h-72' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Destroy previous instance
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map)

    L.marker([pickup.lat, pickup.lng], { icon: makeIcon('#16a34a') }).addTo(map).bindPopup('Pickup')
    L.marker([destination.lat, destination.lng], { icon: makeIcon('#dc2626') }).addTo(map).bindPopup('Drop')

    mapRef.current = map
    setLoading(true)

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const route = data.routes[0]
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          )
          const poly = L.polyline(coords, { color: '#f97316', weight: 4, opacity: 0.9 }).addTo(map)
          const distKm = Math.round(route.distance / 100) / 10
          const durMin = Math.round(route.duration / 60)
          setRouteInfo({ distanceKm: distKm, durationMin: durMin })
          onRouteCalculated?.(distKm, durMin, JSON.stringify(coords.slice(0, 50)))
          map.fitBounds(poly.getBounds(), { padding: [40, 40] })
        } else {
          throw new Error('no route')
        }
      } catch {
        const line = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
          color: '#f97316', weight: 3, dashArray: '8,6',
        }).addTo(map)
        map.fitBounds(line.getBounds(), { padding: [40, 40] })
        const R = 6371
        const dLat = ((destination.lat - pickup.lat) * Math.PI) / 180
        const dLng = ((destination.lng - pickup.lng) * Math.PI) / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
        const dur = Math.round(dist * 3)
        setRouteInfo({ distanceKm: dist, durationMin: dur })
        onRouteCalculated?.(dist, dur, '')
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  return (
    <div className="relative">
      <div ref={containerRef} className={`w-full ${height}`} style={{ minHeight: '200px' }} />
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
            Calculating route...
          </div>
        </div>
      )}
      {routeInfo && !loading && (
        <div className="absolute bottom-3 left-3 bg-white border-2 border-[#0f0f0f] px-3 py-1.5 shadow-[2px_2px_0_#0f0f0f] flex items-center gap-3 text-sm font-bold z-[1000]">
          <span>📍 {routeInfo.distanceKm} km</span>
          <span className="text-[#6b6b6b]">·</span>
          <span>⏱ {routeInfo.durationMin} min</span>
        </div>
      )}
    </div>
  )
}
