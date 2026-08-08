import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, Navigation, X } from 'lucide-react'
import { SavedPlace } from '../types'

export interface LocationResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  label: string
  placeholder?: string
  value: LocationResult | null
  onChange: (loc: LocationResult | null) => void
  savedPlaces?: SavedPlace[]
  accentColor?: 'green' | 'red'
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export default function LocationSearch({ label, placeholder, value, onChange, savedPlaces = [], accentColor = 'green' }: Props) {
  const [query, setQuery] = useState(value?.address || '')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => {
    if (value?.address && value.address !== query) setQuery(value.address)
  }, [value?.address])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q: string) => {
    if (q.length < 3) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 400)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (!q) { onChange(null); setResults([]); setOpen(false); return }
    search(q)
  }

  const select = (r: NominatimResult) => {
    const addr = r.display_name.split(',').slice(0, 3).join(',').trim()
    setQuery(addr)
    onChange({ address: addr, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
    setOpen(false)
    setResults([])
  }

  const selectSaved = (p: SavedPlace) => {
    setQuery(p.address)
    onChange({ address: p.address, lat: p.lat, lng: p.lng })
    setOpen(false)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const addr = data.display_name?.split(',').slice(0, 3).join(',').trim() || 'Current Location'
        setQuery(addr)
        onChange({ address: addr, lat: pos.coords.latitude, lng: pos.coords.longitude })
      } catch {
        onChange({ address: 'Current Location', lat: pos.coords.latitude, lng: pos.coords.longitude })
        setQuery('Current Location')
      }
      setLocating(false)
    }, () => setLocating(false), { enableHighAccuracy: true })
  }

  const dotColor = accentColor === 'green' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-wider text-[#3d3d3d]">{label}</label>
      <div className="relative">
        {/* Color dot */}
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-[#0f0f0f] ${dotColor}`} />

        <input
          value={query}
          onChange={handleInput}
          onFocus={() => (results.length > 0 || savedPlaces.length > 0) && setOpen(true)}
          placeholder={placeholder || 'Search location...'}
          className="neo-input pl-8 pr-16"
          autoComplete="off"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 size={14} className="animate-spin text-[#6b6b6b]" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); onChange(null); setResults([]); setOpen(false) }} className="text-[#6b6b6b] hover:text-[#0f0f0f] p-0.5">
              <X size={14} />
            </button>
          )}
          <button
            onClick={useCurrentLocation}
            className={`p-1 border border-[#0f0f0f] hover:bg-[#f0ede6] transition-colors ${locating ? 'animate-pulse' : ''}`}
            title="Use current location"
          >
            <Navigation size={12} className="text-[#f97316]" />
          </button>
        </div>

        {/* Dropdown */}
        {open && (results.length > 0 || savedPlaces.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-[#0f0f0f] border-t-0 shadow-[4px_4px_0_0_#0f0f0f] max-h-64 overflow-y-auto">
            {/* Saved places */}
            {savedPlaces.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-[#f0ede6]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">Saved Places</p>
                </div>
                {savedPlaces.map(p => (
                  <button
                    key={p.id}
                    onMouseDown={() => selectSaved(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f0ede6] text-left border-b border-[#f0ede6]"
                  >
                    <MapPin size={14} className="text-[#f97316] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-[#6b6b6b] truncate">{p.address}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <>
                {savedPlaces.length > 0 && (
                  <div className="px-3 py-1.5 bg-[#f0ede6]">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">Search Results</p>
                  </div>
                )}
                {results.map(r => (
                  <button
                    key={r.place_id}
                    onMouseDown={() => select(r)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-[#f0ede6] text-left border-b border-[#f0ede6] last:border-0"
                  >
                    <MapPin size={14} className="text-[#6b6b6b] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#0f0f0f] leading-snug">
                      {r.display_name.split(',').slice(0, 4).join(', ')}
                    </p>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
