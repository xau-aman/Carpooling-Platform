import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationPoint } from '../../types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  pickup: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  driverLocation?: LocationPoint | null
  heightPx?: number
}

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

const driverIcon = L.divIcon({
  html: `
    <div style="
      width:44px;height:44px;
      background:#f97316;
      border:3px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 4px 12px rgba(249,115,22,0.5);
      animation:pulse 1.5s infinite;
    ">🚗</div>
    <style>@keyframes pulse{0%,100%{box-shadow:0 4px 12px rgba(249,115,22,0.5)}50%{box-shadow:0 4px 20px rgba(249,115,22,0.9)}}</style>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  className: '',
})

export default function LiveMap({ pickup, destination, driverLocation, heightPx = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map)

    L.marker([pickup.lat, pickup.lng], { icon: makeMarker('#16a34a', 'A') })
      .addTo(map).bindPopup('<b>Pickup</b>')
    L.marker([destination.lat, destination.lng], { icon: makeMarker('#dc2626', 'B') })
      .addTo(map).bindPopup('<b>Drop</b>')

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 50)

    let destroyed = false

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
        const data = await res.json()
        if (destroyed) return
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          )
          const poly = L.polyline(coords, { color: '#714B67', weight: 5, opacity: 1 }).addTo(map)
          L.polyline(coords, { color: '#f97316', weight: 3, opacity: 0.7 }).addTo(map)
          if (!destroyed) map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 15 })
        } else throw new Error('no route')
      } catch {
        if (destroyed) return
        const line = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
          color: '#714B67', weight: 4, dashArray: '10,8',
        }).addTo(map)
        if (!destroyed) map.fitBounds(line.getBounds(), { padding: [50, 50] })
      }
      if (!destroyed) setTimeout(() => { if (!destroyed) map.invalidateSize() }, 100)
    }

    fetchRoute()

    return () => {
      destroyed = true
      map.remove()
      mapRef.current = null
      driverMarkerRef.current = null
    }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
    } else {
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
        .addTo(mapRef.current)
        .bindPopup('<b>Driver</b>')
    }
    mapRef.current.panTo([driverLocation.lat, driverLocation.lng], { animate: true, duration: 0.8 })
  }, [driverLocation])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ height: heightPx }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#e8e0f0' }} />
      {driverLocation && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: '#f97316', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Driver is live
        </div>
      )}
    </div>
  )
}
