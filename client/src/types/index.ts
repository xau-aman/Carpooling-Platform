// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  organizationId: string
  email: string
  phone?: string
  name: string
  role: 'ADMIN' | 'EMPLOYEE' | 'DRIVER'
  profilePhoto?: string
  isActive: boolean
  createdAt: string
  profile?: EmployeeProfile
  wallet?: Wallet
}

export interface EmployeeProfile {
  id: string
  userId: string
  department?: string
  manager?: string
  location?: string
}

// ── Organization ──────────────────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  address?: string
  industry?: string
  adminEmail: string
}

export interface OrganizationSettings {
  id: string
  organizationId: string
  fuelCostPerLiter: number
  costPerKm: number
  travelCostPolicy?: string
  defaultCarpoolPolicy?: string
}

// ── Vehicle ───────────────────────────────────────────────────────────────────
export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID'

export interface Vehicle {
  id: string
  organizationId: string
  userId: string
  model: string
  registration: string
  seats: number
  fuelType: FuelType
  color?: string
  isActive: boolean
  createdAt: string
}

// ── Ride ──────────────────────────────────────────────────────────────────────
export type RideStatus = 'PUBLISHED' | 'FULL' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'

export interface Ride {
  id: string
  organizationId: string
  driverId: string
  vehicleId: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  destAddress: string
  destLat: number
  destLng: number
  departureTime: string
  availableSeats: number
  totalSeats: number
  farePerSeat: number
  status: RideStatus
  isRecurring: boolean
  distanceKm?: number
  durationMin?: number
  routePolyline?: string
  driver: { id: string; name: string; profilePhoto?: string }
  vehicle: { id: string; model: string; registration: string; seats: number; color?: string }
  bookings?: RideBooking[]
  // Matching
  matchScore?: number
  driverRating?: number
  ratingCount?: number
  pickupDistanceKm?: number
}

// ── Booking ───────────────────────────────────────────────────────────────────
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface RideBooking {
  id: string
  rideId: string
  userId: string
  seats: number
  status: BookingStatus
  createdAt: string
  ride?: Ride
  payment?: Payment
}

// ── Trip ──────────────────────────────────────────────────────────────────────
export type TripStatus = 'BOOKED' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'CANCELLED'

export interface Trip {
  id: string
  rideId: string
  status: TripStatus
  startedAt?: string
  completedAt?: string
  createdAt: string
  ride: Ride
  participants: TripParticipant[]
  messages?: ChatMessage[]
}

export interface TripParticipant {
  id: string
  tripId: string
  userId: string
  isDriver: boolean
  user: { id: string; name: string; profilePhoto?: string }
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export interface Wallet {
  id: string
  userId: string
  balance: number
  transactions?: WalletTransaction[]
}

export type TransactionType = 'CREDIT' | 'DEBIT'
export type TransactionReason = 'RECHARGE' | 'RIDE_PAYMENT' | 'REFUND' | 'BONUS'

export interface WalletTransaction {
  id: string
  walletId: string
  type: TransactionType
  reason: TransactionReason
  amount: number
  note?: string
  createdAt: string
}

// ── Payment ───────────────────────────────────────────────────────────────────
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface Payment {
  id: string
  userId: string
  bookingId?: string
  tripId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  razorpayOrderId?: string
  createdAt: string
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  tripId: string
  senderId: string
  message: string
  createdAt: string
  sender: { id: string; name: string; profilePhoto?: string }
}

// ── Location ──────────────────────────────────────────────────────────────────
export interface LocationPoint {
  lat: number
  lng: number
  heading?: number
  speed?: number
  timestamp?: string
}

// ── Saved Places ─────────────────────────────────────────────────────────────
export interface SavedPlace {
  id: string
  userId: string
  label: string
  address: string
  lat: number
  lng: number
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
