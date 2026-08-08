import { useEffect, useRef, useState } from 'react'
import { MapPin, Check, X, Search, Loader } from 'lucide-react'

interface LocationResult { display_name: string; lat: string; lon: string }

interface Props {
  onConfirm: (result: LocationResult) => void
  onClose: () => void
  initialLat?: number
  initialLng?: number
  label?: string
}

async function searchPlaces(q: string): Promise<LocationResult[]> {
  if (q.length < 3) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    )
    return res.json()
  } catch { return [] }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const d = await res.json()
    return d.display_name?.split(',').slice(0, 3).join(', ').trim() ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export default function MapPicker({
  onConfirm, onClose,
  initialLat = 22.5726, initialLng = 88.3639,
  label = 'Select Location'
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng })
  const [geocoding, setGeocoding] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<LocationResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doReverseGeocode = (lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true)
      const addr = await reverseGeocode(lat, lng)
      setAddress(addr)
      setGeocoding(false)
    }, 600)
  }

  useEffect(() => {
    if (!mapContainerRef.current) return

    let map: import('leaflet').Map

    import('leaflet').then(L => {
      if (!mapContainerRef.current) return

      // Remove any existing map instance
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapRef.current = map

      // CRITICAL: invalidate size after a tick so container has real dimensions
      setTimeout(() => {
        map.invalidateSize()
        doReverseGeocode(initialLat, initialLng)
      }, 100)

      map.on('moveend', () => {
        const c = map.getCenter()
        setCoords({ lat: c.lat, lng: c.lng })
        doReverseGeocode(c.lat, c.lng)
      })
    })

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
      if (searchTimer.current) clearTimeout(searchTimer.current)
      map?.remove()
      mapRef.current = null
    }
  }, [])

  const handleSearch = (v: string) => {
    setSearchQ(v)
    setSearchOpen(false)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (v.length < 3) { setSearchResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const r = await searchPlaces(v)
      setSearchResults(r)
      setSearchOpen(r.length > 0)
      setSearching(false)
    }, 400)
  }

  const selectResult = (r: LocationResult) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon)
    mapRef.current?.setView([lat, lng], 16, { animate: true })
    setSearchQ(r.display_name.split(',').slice(0, 2).join(', '))
    setSearchOpen(false)
    setSearchResults([])
    // Set address immediately from search result
    setAddress(r.display_name.split(',').slice(0, 3).join(', ').trim())
    setCoords({ lat, lng })
  }

  const handleConfirm = () => {
    onConfirm({ display_name: address, lat: String(coords.lat), lon: String(coords.lng) })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-white"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Top bar — search */}
      <div className="shrink-0 bg-white px-3 pt-3 pb-2 z-20 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center shrink-0 active:scale-95"
          >
            <X size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] rounded-2xl px-3 py-2.5">
            <Search size={15} className="text-[#714B67] shrink-0" />
            <input
              className="flex-1 text-sm font-medium outline-none bg-transparent text-[#0f0f0f] placeholder:text-[#9ca3af]"
              placeholder={`Search for ${label.toLowerCase()}...`}
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            />
            {searching && <Loader size={14} className="text-[#714B67] animate-spin shrink-0" />}
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-[#e5e5e5] overflow-hidden max-h-52 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                className="w-full px-4 py-3 text-left border-b border-[#f5f5f5] last:border-0 active:bg-[#f5f5f5] flex items-start gap-3"
                onMouseDown={e => { e.preventDefault(); selectResult(r) }}
                onClick={() => selectResult(r)}
              >
                <MapPin size={14} className="text-[#714B67] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#0f0f0f] truncate">{r.display_name.split(',')[0]}</p>
                  <p className="text-xs text-[#6b6b6b] truncate">{r.display_name.split(',').slice(1, 3).join(',')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container — takes remaining space */}
      <div className="relative flex-1 overflow-hidden">
        {/* Actual map div — must have explicit 100% width/height */}
        <div
          ref={mapContainerRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* Center pin overlay — pointer-events-none so map still receives touches */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          {/* Pin positioned so tip points to exact center */}
          <div style={{ transform: 'translateY(-20px)' }}>
            <div style={{
              width: 28, height: 28,
              background: '#714B67',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: '3px solid white',
              boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
            }} />
            {/* Shadow dot */}
            <div style={{
              width: 10, height: 5,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '50%',
              margin: '2px auto 0',
              transform: 'translateX(2px)',
            }} />
          </div>
        </div>
      </div>

      {/* Bottom confirm bar */}
      <div
        className="shrink-0 bg-white px-4 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-3 bg-[#f5f5f5] rounded-2xl px-4 py-3 mb-3 min-h-[48px]">
          <MapPin size={16} className="text-[#714B67] shrink-0" />
          <p className="text-sm font-medium text-[#0f0f0f] flex-1 line-clamp-2">
            {geocoding
              ? 'Getting address...'
              : address || 'Move map to select location'}
          </p>
          {geocoding && <Loader size={14} className="text-[#714B67] animate-spin shrink-0" />}
        </div>
        <button
          onClick={handleConfirm}
          disabled={!address || geocoding}
          className="m-btn m-btn-primary m-btn-full disabled:opacity-50"
        >
          <Check size={18} /> Confirm Location
        </button>
      </div>
    </div>
  )
}
