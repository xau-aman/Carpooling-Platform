import { useEffect, useRef } from 'react'

interface Props {
  driverLat: number
  driverLng: number
  pickupLat: number
  pickupLng: number
  destLat: number
  destLng: number
}

export default function LiveMap({ driverLat, driverLng, pickupLat, pickupLng, destLat, destLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const driverMarkerRef = useRef<import('leaflet').Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [driverLat, driverLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      // Pickup marker (green)
      L.marker([pickupLat, pickupLng], {
        icon: L.divIcon({
          html: `<div style="width:14px;height:14px;background:#16a34a;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: '',
        })
      }).addTo(map)

      // Dest marker (red)
      L.marker([destLat, destLng], {
        icon: L.divIcon({
          html: `<div style="width:14px;height:14px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: '',
        })
      }).addTo(map)

      // Route line
      L.polyline([[pickupLat, pickupLng], [destLat, destLng]], {
        color: '#714B67', weight: 3, opacity: 0.5, dashArray: '6 6'
      }).addTo(map)

      // Driver marker (car icon)
      const driverIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;background:#714B67;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px">🚗</div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], className: '',
      })
      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map)
      driverMarkerRef.current = driverMarker
      mapInstanceRef.current = map
    })
    return () => { mapInstanceRef.current?.remove() }
  }, [])

  // Update driver position smoothly
  useEffect(() => {
    if (!driverMarkerRef.current || !mapInstanceRef.current) return
    const latlng = { lat: driverLat, lng: driverLng }
    driverMarkerRef.current.setLatLng(latlng)
    mapInstanceRef.current.panTo(latlng, { animate: true, duration: 0.8 })
  }, [driverLat, driverLng])

  return (
    <div ref={mapRef} style={{ height: '220px', width: '100%', borderRadius: '16px', overflow: 'hidden' }} />
  )
}
