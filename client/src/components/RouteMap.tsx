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
  heightPx?: number
}

export interface RouteInfo { distanceKm: number; durationMin: number }

const makeMarker = (color: string, label: string) => L.divIcon({
  html: `
    <div style="
      width:36px;height:36px;
      background:${color};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:900;line-height:1">${label}</span>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  className: '',
})

export default function RouteMap({ pickup, destination, onRouteCalculated, heightPx = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Destroy previous instance cleanly
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    setLoading(true)
    setRouteInfo(null)
    setTileError(false)

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
    })

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Primary tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    })

    tileLayer.on('tileerror', () => setTileError(true))
    tileLayer.addTo(map)

    // Markers
    L.marker([pickup.lat, pickup.lng], { icon: makeMarker('#16a34a', 'A') })
      .addTo(map)
      .bindPopup('<b>Pickup</b>')

    L.marker([destination.lat, destination.lng], { icon: makeMarker('#dc2626', 'B') })
      .addTo(map)
      .bindPopup('<b>Drop</b>')

    mapRef.current = map

    // Invalidate size after mount so Leaflet knows the real dimensions
    setTimeout(() => map.invalidateSize(), 50)

    let destroyed = false

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
        const data = await res.json()

        if (destroyed) return

        if (data.routes?.[0]) {
          const route = data.routes[0]
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          )
          const poly = L.polyline(coords, {
            color: '#714B67', weight: 5, opacity: 1,
          }).addTo(map)

          // Decorative orange inner line
          L.polyline(coords, {
            color: '#f97316', weight: 3, opacity: 0.7,
          }).addTo(map)

          const distKm = Math.round(route.distance / 100) / 10
          const durMin = Math.round(route.duration / 60)
          setRouteInfo({ distanceKm: distKm, durationMin: durMin })
          onRouteCalculated?.(distKm, durMin, JSON.stringify(coords.slice(0, 50)))
          if (!destroyed) map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 15 })
        } else {
          throw new Error('no route')
        }
      } catch {
        if (destroyed) return
        // Fallback straight line
        const line = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
          color: '#714B67', weight: 4, dashArray: '10,8', opacity: 0.8,
        }).addTo(map)
        if (!destroyed) map.fitBounds(line.getBounds(), { padding: [50, 50], maxZoom: 14 })

        // Haversine distance
        const R = 6371
        const dLat = ((destination.lat - pickup.lat) * Math.PI) / 180
        const dLng = ((destination.lng - pickup.lng) * Math.PI) / 180
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2
        const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
        const dur = Math.round(dist * 3)
        setRouteInfo({ distanceKm: dist, durationMin: dur })
        onRouteCalculated?.(dist, dur, '')
      } finally {
        if (!destroyed) {
          setLoading(false)
          setTimeout(() => { if (!destroyed) map.invalidateSize() }, 100)
        }
      }
    }

    fetchRoute()

    return () => {
      destroyed = true
      map.remove()
      mapRef.current = null
    }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ height: heightPx }}>
      {/* Map container — must have explicit pixel height */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', background: '#e8e0f0' }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ background: 'rgba(248,247,255,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="w-10 h-10 rounded-full border-3 border-[#714B67] border-t-transparent animate-spin"
            style={{ borderWidth: 3 }} />
          <p className="text-sm font-semibold text-[#495057]">Calculating route...</p>
        </div>
      )}

      {/* Tile error warning */}
      {tileError && !loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full z-[1000]">
          ⚠ Map tiles loading slowly
        </div>
      )}

      {/* Route info pill */}
      {routeInfo && !loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)', boxShadow: '0 4px 16px rgba(113,75,103,0.4)' }}>
          <span>📍 {routeInfo.distanceKm} km</span>
          <span className="opacity-50">·</span>
          <span>⏱ {routeInfo.durationMin} min</span>
        </div>
      )}
    </div>
  )
}
