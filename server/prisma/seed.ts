import { PrismaClient, FuelType, RideStatus, TripStatus, BookingStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionReason } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

// ── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const setHour = (d: Date, h: number, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x }

// Ahmedabad area locations
const LOCATIONS = [
  { address: 'ISKCON Temple, Satellite, Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { address: 'Infocity, GIFT City, Gandhinagar', lat: 23.1667, lng: 72.6833 },
  { address: 'SG Highway, Prahlad Nagar, Ahmedabad', lat: 23.0300, lng: 72.5100 },
  { address: 'Bopal, Ahmedabad', lat: 23.0350, lng: 72.4700 },
  { address: 'Vastrapur Lake, Ahmedabad', lat: 23.0400, lng: 72.5300 },
  { address: 'Navrangpura, Ahmedabad', lat: 23.0350, lng: 72.5600 },
  { address: 'Maninagar, Ahmedabad', lat: 22.9900, lng: 72.6100 },
  { address: 'Chandkheda, Ahmedabad', lat: 23.1100, lng: 72.5900 },
  { address: 'Gota, Ahmedabad', lat: 23.0900, lng: 72.5600 },
  { address: 'Thaltej, Ahmedabad', lat: 23.0500, lng: 72.5000 },
  { address: 'Bodakdev, Ahmedabad', lat: 23.0450, lng: 72.5150 },
  { address: 'Paldi, Ahmedabad', lat: 23.0100, lng: 72.5700 },
  { address: 'Naranpura, Ahmedabad', lat: 23.0600, lng: 72.5700 },
  { address: 'Vejalpur, Ahmedabad', lat: 22.9950, lng: 72.5400 },
  { address: 'Nikol, Ahmedabad', lat: 23.0500, lng: 72.6500 },
  { address: 'Naroda, Ahmedabad', lat: 23.0900, lng: 72.6600 },
  { address: 'Vastral, Ahmedabad', lat: 23.0200, lng: 72.6700 },
  { address: 'Odhav, Ahmedabad', lat: 23.0300, lng: 72.6600 },
  { address: 'Sabarmati, Ahmedabad', lat: 23.0800, lng: 72.5800 },
  { address: 'Motera, Ahmedabad', lat: 23.0950, lng: 72.5950 },
]

const VEHICLE_MODELS = [
  { model: 'Maruti Swift', seats: 4, fuel: FuelType.PETROL },
  { model: 'Honda City', seats: 4, fuel: FuelType.PETROL },
  { model: 'Hyundai Creta', seats: 5, fuel: FuelType.PETROL },
  { model: 'Tata Nexon EV', seats: 5, fuel: FuelType.ELECTRIC },
  { model: 'Maruti Ertiga', seats: 6, fuel: FuelType.CNG },
  { model: 'Toyota Innova', seats: 7, fuel: FuelType.DIESEL },
  { model: 'Hyundai i20', seats: 4, fuel: FuelType.PETROL },
  { model: 'Kia Seltos', seats: 5, fuel: FuelType.PETROL },
  { model: 'Tata Tiago CNG', seats: 4, fuel: FuelType.CNG },
  { model: 'MG Hector', seats: 5, fuel: FuelType.PETROL },
]

const COLORS = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey', 'Brown']
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales', 'Legal', 'Data Science']
const FIRST_NAMES = ['Raj', 'Aman', 'Priya', 'Neha', 'Vikram', 'Ankit', 'Pooja', 'Rahul', 'Sneha', 'Karan', 'Divya', 'Rohan', 'Meera', 'Arjun', 'Kavya', 'Nikhil', 'Riya', 'Saurabh', 'Tanvi', 'Harsh', 'Ishaan', 'Nisha', 'Yash', 'Simran', 'Aditya', 'Shruti', 'Varun', 'Deepa', 'Mohit', 'Anjali']
const LAST_NAMES = ['Patel', 'Shah', 'Mehta', 'Joshi', 'Desai', 'Modi', 'Trivedi', 'Pandya', 'Bhatt', 'Parikh', 'Kapoor', 'Sharma', 'Gupta', 'Singh', 'Kumar', 'Verma', 'Agarwal', 'Malhotra', 'Nair', 'Iyer']

async function main() {
  console.log('🌱 Seeding GoTogether with rich dummy data...')

  // ── Wipe ──────────────────────────────────────────────────────────────────
  await prisma.payment.deleteMany()
  await prisma.walletTransaction.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.tripParticipant.deleteMany()
  await prisma.tripLocation.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.rideBooking.deleteMany()
  await prisma.ride.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.savedPlace.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.employeeProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organizationSettings.deleteMany()
  await prisma.organization.deleteMany()

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      id: 'org-1',
      name: 'GoTogether Corp',
      address: 'Ahmedabad, Gujarat, India',
      industry: 'Technology',
      adminEmail: 'admin@gotogether.com',
    },
  })

  await prisma.organizationSettings.create({
    data: { organizationId: org.id, fuelCostPerLiter: 105, costPerKm: 6 },
  })

  const hash = await bcrypt.hash('Demo@1234', 12)

  // ── Core demo accounts ────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-1',
      organizationId: org.id,
      email: 'admin@gotogether.com',
      name: 'Admin User',
      phone: '9000000001',
      passwordHash: hash,
      role: 'ADMIN',
    },
  })

  const driver = await prisma.user.create({
    data: {
      id: 'user-driver-1',
      organizationId: org.id,
      email: 'driver@gotogether.com',
      name: 'Raj Patel',
      phone: '9000000002',
      passwordHash: hash,
      profile: { create: { department: 'Engineering', manager: 'Admin User', location: 'Bopal' } },
    },
  })

  const emp = await prisma.user.create({
    data: {
      id: 'user-emp-1',
      organizationId: org.id,
      email: 'user@gotogether.com',
      name: 'Aman Shah',
      phone: '9000000003',
      passwordHash: hash,
      profile: { create: { department: 'Product', manager: 'Admin User', location: 'Vastrapur' } },
    },
  })

  // ── 10 Drivers ────────────────────────────────────────────────────────────
  const driverUsers = [driver]
  const driverNames = ['Vikram Desai', 'Karan Mehta', 'Rohan Joshi', 'Arjun Shah', 'Nikhil Patel', 'Saurabh Modi', 'Yash Trivedi', 'Varun Bhatt', 'Mohit Parikh']
  for (let i = 0; i < 9; i++) {
    const u = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `driver${i + 2}@gotogether.com`,
        name: driverNames[i],
        phone: `900000${String(10 + i).padStart(4, '0')}`,
        passwordHash: hash,
        profile: { create: { department: pick(DEPARTMENTS), manager: 'Admin User', location: pick(LOCATIONS).address.split(',')[0] } },
      },
    })
    driverUsers.push(u)
  }

  // ── 20 Employee users ─────────────────────────────────────────────────────
  const empUsers = [emp]
  for (let i = 0; i < 19; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    const u = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `emp${i + 2}@gotogether.com`,
        name,
        phone: `900001${String(i).padStart(4, '0')}`,
        passwordHash: hash,
        profile: { create: { department: pick(DEPARTMENTS), manager: pick(driverNames), location: pick(LOCATIONS).address.split(',')[0] } },
      },
    })
    empUsers.push(u)
  }

  // Admin wallet
  await prisma.wallet.create({ data: { userId: admin.id, balance: 5000 } })

  // ── Vehicles (1-2 per driver) ─────────────────────────────────────────────
  const driverVehicles: Record<string, string> = {}
  let regCounter = 1000
  for (const d of driverUsers) {
    const vm = pick(VEHICLE_MODELS)
    const v = await prisma.vehicle.create({
      data: {
        organizationId: org.id,
        userId: d.id,
        model: vm.model,
        registration: `GJ01AB${regCounter++}`,
        seats: vm.seats,
        fuelType: vm.fuel,
        color: pick(COLORS),
      },
    })
    driverVehicles[d.id] = v.id
  }

  // ── Wallets for all users ─────────────────────────────────────────────────
  const allUsers = [...driverUsers, ...empUsers.slice(1)] // emp[0] already done below
  for (const u of allUsers) {
    const balance = rand(200, 3000)
    const wallet = await prisma.wallet.create({ data: { userId: u.id, balance } })
    // Add some transaction history
    const txCount = rand(2, 8)
    for (let t = 0; t < txCount; t++) {
      const isCredit = Math.random() > 0.4
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: isCredit ? TransactionType.CREDIT : TransactionType.DEBIT,
          reason: isCredit ? pick([TransactionReason.RECHARGE, TransactionReason.RIDE_EARNING, TransactionReason.BONUS]) : TransactionReason.RIDE_PAYMENT,
          amount: rand(100, 800),
          note: isCredit ? 'Wallet recharge' : 'Ride payment',
          createdAt: daysAgo(rand(1, 60)),
        },
      })
    }
  }

  // emp wallet (user-emp-1)
  const empWallet = await prisma.wallet.create({ data: { userId: emp.id, balance: 1500 } })
  await prisma.walletTransaction.create({
    data: { walletId: empWallet.id, type: TransactionType.CREDIT, reason: TransactionReason.RECHARGE, amount: 1500, note: 'Initial recharge' },
  })

  console.log('✅ Users + Vehicles + Wallets created')

  // ── Rides ─────────────────────────────────────────────────────────────────
  // Past completed rides (60 days back to yesterday)
  const completedRides: { rideId: string; driverId: string; fare: number; bookingIds: string[] }[] = []

  for (let day = 60; day >= 1; day--) {
    const ridesPerDay = rand(2, 5)
    for (let r = 0; r < ridesPerDay; r++) {
      const driverUser = pick(driverUsers)
      const vehicleId = driverVehicles[driverUser.id]
      const pickup = pick(LOCATIONS)
      let dest = pick(LOCATIONS)
      while (dest.address === pickup.address) dest = pick(LOCATIONS)

      const distKm = Math.round((Math.random() * 20 + 5) * 10) / 10
      const fare = rand(80, 300)
      const totalSeats = rand(2, 4)
      const bookedSeats = rand(1, totalSeats)

      const ride = await prisma.ride.create({
        data: {
          organizationId: org.id,
          driverId: driverUser.id,
          vehicleId,
          pickupAddress: pickup.address,
          pickupLat: pickup.lat + (Math.random() - 0.5) * 0.01,
          pickupLng: pickup.lng + (Math.random() - 0.5) * 0.01,
          destAddress: dest.address,
          destLat: dest.lat + (Math.random() - 0.5) * 0.01,
          destLng: dest.lng + (Math.random() - 0.5) * 0.01,
          departureTime: setHour(daysAgo(day), pick([8, 9, 10, 17, 18, 19]), pick([0, 15, 30, 45])),
          availableSeats: 0,
          totalSeats,
          farePerSeat: fare,
          status: RideStatus.COMPLETED,
          distanceKm: distKm,
          durationMin: Math.round(distKm * 3),
        },
      })

      // Create bookings for this ride
      const passengers = [...empUsers].sort(() => Math.random() - 0.5).slice(0, bookedSeats)
      const bookingIds: string[] = []
      for (const p of passengers) {
        if (p.id === driverUser.id) continue
        const booking = await prisma.rideBooking.create({
          data: {
            rideId: ride.id,
            userId: p.id,
            seats: 1,
            status: BookingStatus.COMPLETED,
          },
        })
        bookingIds.push(booking.id)
      }

      completedRides.push({ rideId: ride.id, driverId: driverUser.id, fare, bookingIds })
    }
  }

  console.log(`✅ ${completedRides.length} past rides created`)

  // ── Trips for completed rides ─────────────────────────────────────────────
  let tripCount = 0
  for (const cr of completedRides) {
    if (cr.bookingIds.length === 0) continue
    const trip = await prisma.trip.create({
      data: {
        rideId: cr.rideId,
        status: TripStatus.PAYMENT_COMPLETED,
        otpVerified: true,
        startedAt: daysAgo(rand(1, 60)),
        completedAt: daysAgo(rand(0, 59)),
      },
    })

    // Driver participant
    await prisma.tripParticipant.create({
      data: { tripId: trip.id, userId: cr.driverId, isDriver: true },
    })

    // Passenger participants + payments
    for (const bookingId of cr.bookingIds) {
      const booking = await prisma.rideBooking.findUnique({ where: { id: bookingId } })
      if (!booking) continue

      await prisma.tripParticipant.create({
        data: { tripId: trip.id, userId: booking.userId, isDriver: false },
      })

      // Payment record
      await prisma.payment.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          tripId: trip.id,
          amount: cr.fare,
          method: pick([PaymentMethod.WALLET, PaymentMethod.CASH, PaymentMethod.UPI]),
          status: PaymentStatus.COMPLETED,
          createdAt: daysAgo(rand(1, 60)),
        },
      })
    }

    // A few chat messages per trip
    const msgCount = rand(0, 4)
    const ride = await prisma.ride.findUnique({ where: { id: cr.rideId }, include: { bookings: true } })
    if (ride && msgCount > 0) {
      const msgs = ['On my way!', 'Reached pickup point', 'Running 5 mins late', 'Almost there', 'Thanks for the ride!', 'Great ride 👍', 'See you tomorrow']
      for (let m = 0; m < msgCount; m++) {
        const sender = m % 2 === 0 ? cr.driverId : (ride.bookings[0]?.userId || cr.driverId)
        await prisma.chatMessage.create({
          data: {
            tripId: trip.id,
            senderId: sender,
            message: pick(msgs),
            createdAt: daysAgo(rand(1, 60)),
          },
        })
      }
    }

    tripCount++
  }

  console.log(`✅ ${tripCount} completed trips created`)

  // ── Ratings ───────────────────────────────────────────────────────────────
  let ratingCount = 0
  const completedRidesForRating = completedRides.slice(0, 80) // rate first 80
  for (const cr of completedRidesForRating) {
    for (const bookingId of cr.bookingIds) {
      const booking = await prisma.rideBooking.findUnique({ where: { id: bookingId } })
      if (!booking) continue
      // Passenger rates driver
      try {
        await prisma.rating.create({
          data: {
            raterId: booking.userId,
            rateeId: cr.driverId,
            rideId: cr.rideId,
            score: pick([3.5, 4.0, 4.5, 4.5, 5.0, 5.0, 5.0]),
            comment: pick(['Great driver!', 'On time', 'Smooth ride', 'Very professional', 'Would ride again', null, null]),
            createdAt: daysAgo(rand(1, 60)),
          },
        })
        ratingCount++
      } catch { /* skip duplicate */ }
    }
  }

  console.log(`✅ ${ratingCount} ratings created`)

  // ── Future rides (next 7 days) — PUBLISHED ────────────────────────────────
  const futureRides: string[] = []
  for (let day = 0; day <= 7; day++) {
    const ridesPerDay = rand(4, 8)
    for (let r = 0; r < ridesPerDay; r++) {
      const driverUser = pick(driverUsers)
      const vehicleId = driverVehicles[driverUser.id]
      const pickup = pick(LOCATIONS)
      let dest = pick(LOCATIONS)
      while (dest.address === pickup.address) dest = pick(LOCATIONS)

      const distKm = Math.round((Math.random() * 20 + 5) * 10) / 10
      const totalSeats = rand(2, 4)

      const ride = await prisma.ride.create({
        data: {
          organizationId: org.id,
          driverId: driverUser.id,
          vehicleId,
          pickupAddress: pickup.address,
          pickupLat: pickup.lat + (Math.random() - 0.5) * 0.01,
          pickupLng: pickup.lng + (Math.random() - 0.5) * 0.01,
          destAddress: dest.address,
          destLat: dest.lat + (Math.random() - 0.5) * 0.01,
          destLng: dest.lng + (Math.random() - 0.5) * 0.01,
          departureTime: setHour(daysFromNow(day), pick([8, 9, 10, 17, 18, 19]), pick([0, 15, 30])),
          availableSeats: totalSeats,
          totalSeats,
          farePerSeat: rand(80, 250),
          status: RideStatus.PUBLISHED,
          distanceKm: distKm,
          durationMin: Math.round(distKm * 3),
        },
      })
      futureRides.push(ride.id)
    }
  }

  console.log(`✅ ${futureRides.length} future rides published`)

  // ── Active booking for demo user (user@gotogether.com) ────────────────────
  // Find a future ride not driven by demo driver
  const bookableRide = await prisma.ride.findFirst({
    where: {
      organizationId: org.id,
      status: RideStatus.PUBLISHED,
      driverId: { not: driver.id },
      availableSeats: { gt: 0 },
      departureTime: { gte: daysFromNow(1) },
    },
  })

  if (bookableRide) {
    const booking = await prisma.rideBooking.create({
      data: { rideId: bookableRide.id, userId: emp.id, seats: 1, status: BookingStatus.CONFIRMED },
    })
    await prisma.ride.update({ where: { id: bookableRide.id }, data: { availableSeats: { decrement: 1 } } })
    const trip = await prisma.trip.create({
      data: { rideId: bookableRide.id, status: TripStatus.BOOKED },
    })
    await prisma.tripParticipant.create({ data: { tripId: trip.id, userId: bookableRide.driverId, isDriver: true } })
    await prisma.tripParticipant.create({ data: { tripId: trip.id, userId: emp.id, isDriver: false } })
    console.log(`✅ Demo booking created for user@gotogether.com (trip: ${trip.id})`)
    void booking
  }

  // ── Demo driver's upcoming ride ───────────────────────────────────────────
  const driverRide = await prisma.ride.create({
    data: {
      organizationId: org.id,
      driverId: driver.id,
      vehicleId: driverVehicles[driver.id],
      pickupAddress: 'Bopal, Ahmedabad',
      pickupLat: 23.0350,
      pickupLng: 72.4700,
      destAddress: 'Infocity, GIFT City, Gandhinagar',
      destLat: 23.1667,
      destLng: 72.6833,
      departureTime: setHour(daysFromNow(1), 9, 0),
      availableSeats: 2,
      totalSeats: 3,
      farePerSeat: 150,
      status: RideStatus.PUBLISHED,
      distanceKm: 22.5,
      durationMin: 45,
    },
  })

  // Book 1 passenger on driver's ride
  const passengerForDriver = empUsers[1]
  const driverRideBooking = await prisma.rideBooking.create({
    data: { rideId: driverRide.id, userId: passengerForDriver.id, seats: 1, status: BookingStatus.CONFIRMED },
  })
  await prisma.ride.update({ where: { id: driverRide.id }, data: { availableSeats: { decrement: 1 } } })
  const driverTrip = await prisma.trip.create({
    data: { rideId: driverRide.id, status: TripStatus.BOOKED },
  })
  await prisma.tripParticipant.create({ data: { tripId: driverTrip.id, userId: driver.id, isDriver: true } })
  await prisma.tripParticipant.create({ data: { tripId: driverTrip.id, userId: passengerForDriver.id, isDriver: false } })
  void driverRideBooking

  console.log(`✅ Demo driver ride created (trip: ${driverTrip.id})`)

  // ── Saved places for demo users ───────────────────────────────────────────
  await prisma.savedPlace.createMany({
    data: [
      { userId: emp.id, label: 'Home', address: 'Vastrapur Lake, Ahmedabad', lat: 23.0400, lng: 72.5300 },
      { userId: emp.id, label: 'Office', address: 'Infocity, GIFT City, Gandhinagar', lat: 23.1667, lng: 72.6833 },
      { userId: driver.id, label: 'Home', address: 'Bopal, Ahmedabad', lat: 23.0350, lng: 72.4700 },
      { userId: driver.id, label: 'Office', address: 'Infocity, GIFT City, Gandhinagar', lat: 23.1667, lng: 72.6833 },
    ],
  })

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: emp.id, title: 'Ride Booked!', body: 'Your ride for tomorrow has been confirmed.', isRead: false },
      { userId: emp.id, title: 'Payment Due', body: 'Please pay ₹150 for your last ride.', isRead: true },
      { userId: driver.id, title: 'New Booking', body: 'A passenger has booked your ride.', isRead: false },
      { userId: driver.id, title: 'Ride Completed', body: 'Your ride was completed. ₹150 credited.', isRead: true },
      { userId: admin.id, title: 'New Employee', body: '5 new employees joined this week.', isRead: false },
    ],
  })

  console.log('\n✅ Seed complete! Summary:')
  console.log(`  Users: ${1 + driverUsers.length + empUsers.length} (1 admin + ${driverUsers.length} drivers + ${empUsers.length} employees)`)
  console.log(`  Vehicles: ${driverUsers.length}`)
  console.log(`  Past rides: ${completedRides.length}`)
  console.log(`  Future rides: ${futureRides.length}`)
  console.log(`  Trips: ${tripCount + 2}`)
  console.log(`  Ratings: ${ratingCount}`)
  console.log('\n📋 Demo Accounts (password: Demo@1234):')
  console.log('  Admin:  admin@gotogether.com')
  console.log('  Driver: driver@gotogether.com')
  console.log('  User:   user@gotogether.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
