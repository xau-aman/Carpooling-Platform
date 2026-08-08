import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationPoint } from '../../types'

interface Props {
  pickup: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  driverLocation?: LocationPoint | null
}

export default function LiveMap({ pickup, destination, driverLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    const makeIcon = (color: string, emoji?: string) => L.divIcon({
      html: emoji
        ? `<div style="width:28px;height:28px;background:${color};border:2.5px solid #0f0f0f;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:2px 2px 0 #0f0f0f">${emoji}</div>`
        : `<div style="width:14px;height:14px;background:${color};border:2.5px solid #0f0f0f;border-radius:50%;box-shadow:2px 2px 0 #0f0f0f"></div>`,
      iconSize: emoji ? [28, 28] : [14, 14],
      iconAnchor: emoji ? [14, 14] : [7, 7],
      className: '',
    })

    L.marker([pickup.lat, pickup.lng], { icon: makeIcon('#16a34a') }).addTo(map).bindPopup('Pickup')
    L.marker([destination.lat, destination.lng], { icon: makeIcon('#dc2626') }).addTo(map).bindPopup('Drop')

    // Fetch OSRM route
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
          routeLayerRef.current = L.polyline(coords, { color: '#f97316', weight: 4, opacity: 0.8 }).addTo(map)
          map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] })
        } else {
          throw new Error('no route')
        }
      } catch {
        L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
          color: '#f97316', weight: 3, dashArray: '8,6',
        }).addTo(map)
        map.fitBounds([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], { padding: [40, 40] })
      }
    }

    fetchRoute()
    mapRef.current = map
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return

    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#f97316;border:2.5px solid #0f0f0f;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:3px 3px 0 #0f0f0f">🚗</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14], className: '',
    })

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
    } else {
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup('Driver')
    }

    // Pan smoothly to driver
    mapRef.current.panTo([driverLocation.lat, driverLocation.lng], { animate: true, duration: 0.8 })
  }, [driverLocation])

  return <div ref={containerRef} className="w-full h-full" />
}
