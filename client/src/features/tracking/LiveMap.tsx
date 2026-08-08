import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationPoint } from '../../types'

// Fix Leaflet default icon broken by bundlers
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
}

const makeIcon = (color: string, emoji?: string) => L.divIcon({
  html: emoji
    ? `<div style="width:32px;height:32px;background:${color};border:2.5px solid #0f0f0f;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:2px 2px 0 rgba(0,0,0,0.3)">${emoji}</div>`
    : `<div style="width:14px;height:14px;background:${color};border:2.5px solid #0f0f0f;border-radius:50%;box-shadow:2px 2px 0 rgba(0,0,0,0.3)"></div>`,
  iconSize: emoji ? [32, 32] : [14, 14],
  iconAnchor: emoji ? [16, 16] : [7, 7],
  className: '',
})

export default function LiveMap({ pickup, destination, driverLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map)

    L.marker([pickup.lat, pickup.lng], { icon: makeIcon('#16a34a') })
      .addTo(map).bindPopup('Pickup')
    L.marker([destination.lat, destination.lng], { icon: makeIcon('#dc2626') })
      .addTo(map).bindPopup('Drop')

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          )
          const poly = L.polyline(coords, { color: '#f97316', weight: 4, opacity: 0.85 }).addTo(map)
          map.fitBounds(poly.getBounds(), { padding: [40, 40] })
        } else {
          throw new Error('no route')
        }
      } catch {
        const line = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
          color: '#f97316', weight: 3, dashArray: '8,6',
        }).addTo(map)
        map.fitBounds(line.getBounds(), { padding: [40, 40] })
      }
    }

    fetchRoute()
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      driverMarkerRef.current = null
    }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return
    const icon = makeIcon('#f97316', '🚗')
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
    } else {
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup('Driver')
    }
    mapRef.current.panTo([driverLocation.lat, driverLocation.lng], { animate: true, duration: 0.8 })
  }, [driverLocation])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }} />
}
