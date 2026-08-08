import { PrismaClient, FuelType, RideStatus, TripStatus, BookingStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionReason } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = (n: number, h = 9) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d }
const daysFromNow = (n: number, h = 9) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d }

const LOCS = [
  { address: 'ISKCON Temple, Satellite, Ahmedabad',   lat: 23.0225, lng: 72.5714 },
  { address: 'Infocity, GIFT City, Gandhinagar',       lat: 23.1667, lng: 72.6833 },
  { address: 'SG Highway, Prahlad Nagar, Ahmedabad',  lat: 23.0300, lng: 72.5100 },
  { address: 'Bopal, Ahmedabad',                       lat: 23.0350, lng: 72.4700 },
  { address: 'Vastrapur Lake, Ahmedabad',              lat: 23.0400, lng: 72.5300 },
  { address: 'Navrangpura, Ahmedabad',                 lat: 23.0350, lng: 72.5600 },
  { address: 'Maninagar, Ahmedabad',                   lat: 22.9900, lng: 72.6100 },
  { address: 'Chandkheda, Ahmedabad',                  lat: 23.1100, lng: 72.5900 },
  { address: 'Gota, Ahmedabad',                        lat: 23.0900, lng: 72.5600 },
  { address: 'Thaltej, Ahmedabad',                     lat: 23.0500, lng: 72.5000 },
  { address: 'Bodakdev, Ahmedabad',                    lat: 23.0450, lng: 72.5150 },
  { address: 'Paldi, Ahmedabad',                       lat: 23.0100, lng: 72.5700 },
  { address: 'Naranpura, Ahmedabad',                   lat: 23.0600, lng: 72.5700 },
  { address: 'Vejalpur, Ahmedabad',                    lat: 22.9950, lng: 72.5400 },
  { address: 'Nikol, Ahmedabad',                       lat: 23.0500, lng: 72.6500 },
]

const VEHICLES = [
  { model: 'Maruti Swift',    seats: 4, fuel: FuelType.PETROL   },
  { model: 'Honda City',      seats: 4, fuel: FuelType.PETROL   },
  { model: 'Hyundai Creta',   seats: 5, fuel: FuelType.PETROL   },
  { model: 'Tata Nexon EV',   seats: 5, fuel: FuelType.ELECTRIC },
  { model: 'Maruti Ertiga',   seats: 6, fuel: FuelType.CNG      },
  { model: 'Hyundai i20',     seats: 4, fuel: FuelType.PETROL   },
  { model: 'Kia Seltos',      seats: 5, fuel: FuelType.PETROL   },
  { model: 'Tata Tiago CNG',  seats: 4, fuel: FuelType.CNG      },
]

const DEPTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales']
const NAMES = ['Vikram Desai','Karan Mehta','Rohan Joshi','Arjun Shah','Nikhil Patel',
               'Saurabh Modi','Yash Trivedi','Varun Bhatt','Mohit Parikh','Priya Sharma',
               'Neha Gupta','Ankit Singh','Pooja Verma','Rahul Kumar','Sneha Agarwal',
               'Divya Nair','Meera Iyer','Tanvi Kapoor','Harsh Malhotra','Simran Pandya']
const CHAT_MSGS = ['On my way!','Reached pickup','Running 5 mins late','Almost there','Thanks for the ride!','Great ride 👍','See you tomorrow','Parking at gate 2','I am at the entrance']

async function main() {
  console.log('🌱 Seeding GoTogether...')

  // ── Safe wipe — exact FK dependency order ─────────────────────────────
  // Leaf nodes first (no other table references them)
  await prisma.payment.deleteMany()            // refs: User, RideBooking, Trip
  await prisma.walletTransaction.deleteMany()  // refs: Wallet
  await prisma.chatMessage.deleteMany()        // refs: Trip, User
  await prisma.tripLocation.deleteMany()       // refs: Trip
  await prisma.tripParticipant.deleteMany()    // refs: Trip, User
  await prisma.trip.deleteMany()               // refs: Ride
  await prisma.rideBooking.deleteMany()        // refs: Ride, User
  await prisma.ride.deleteMany()               // refs: Org, User, Vehicle
  await prisma.rating.deleteMany()             // refs: User
  await prisma.savedPlace.deleteMany()         // refs: User
  await prisma.notification.deleteMany()       // refs: User
  await prisma.wallet.deleteMany()             // refs: User
  await prisma.vehicle.deleteMany()            // refs: Org, User
  await prisma.employeeProfile.deleteMany()    // refs: User
  await prisma.user.deleteMany()               // refs: Org
  await prisma.organizationSettings.deleteMany()
  await prisma.organization.deleteMany()
  console.log('✅ DB wiped')

  // ── Org ───────────────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: { id: 'org-1', name: 'GoTogether Corp', address: 'Ahmedabad, Gujarat', industry: 'Technology', adminEmail: 'admin@gotogether.com' },
  })
  await prisma.organizationSettings.create({
    data: { organizationId: org.id, fuelCostPerLiter: 105, costPerKm: 6 },
  })

  const hash = await bcrypt.hash('Demo@1234', 12)

  // ── Demo users ────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { id: 'user-admin-1', organizationId: org.id, email: 'admin@gotogether.com', name: 'Admin User', phone: '9000000001', passwordHash: hash, role: 'ADMIN' },
  })
  const driver = await prisma.user.create({
    data: { id: 'user-driver-1', organizationId: org.id, email: 'driver@gotogether.com', name: 'Raj Patel', phone: '9000000002', passwordHash: hash,
      profile: { create: { department: 'Engineering', manager: 'Admin User', location: 'Bopal' } } },
  })
  const emp = await prisma.user.create({
    data: { id: 'user-emp-1', organizationId: org.id, email: 'user@gotogether.com', name: 'Aman Shah', phone: '9000000003', passwordHash: hash,
      profile: { create: { department: 'Product', manager: 'Admin User', location: 'Vastrapur' } } },
  })

  // ── Extra users (10 drivers + 10 employees) ───────────────────────────────
  const extraDrivers: { id: string }[] = []
  const extraEmps: { id: string }[] = []

  for (let i = 0; i < 10; i++) {
    const u = await prisma.user.create({
      data: { organizationId: org.id, email: `driver${i + 2}@gotogether.com`, name: NAMES[i], phone: `90000${String(200 + i).padStart(5,'0')}`, passwordHash: hash,
        profile: { create: { department: pick(DEPTS), manager: 'Admin User', location: pick(LOCS).address.split(',')[0] } } },
    })
    extraDrivers.push(u)
  }
  for (let i = 0; i < 10; i++) {
    const u = await prisma.user.create({
      data: { organizationId: org.id, email: `emp${i + 2}@gotogether.com`, name: NAMES[10 + i], phone: `90000${String(300 + i).padStart(5,'0')}`, passwordHash: hash,
        profile: { create: { department: pick(DEPTS), manager: 'Admin User', location: pick(LOCS).address.split(',')[0] } } },
    })
    extraEmps.push(u)
  }

  const allDrivers = [driver, ...extraDrivers]
  const allPassengers = [emp, ...extraEmps]

  console.log(`✅ ${allDrivers.length + allPassengers.length + 1} users created`)

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const vehicleMap: Record<string, string> = {}
  let reg = 1000
  for (const d of allDrivers) {
    const vm = pick(VEHICLES)
    const v = await prisma.vehicle.create({
      data: { organizationId: org.id, userId: d.id, model: vm.model, registration: `GJ01AB${reg++}`, seats: vm.seats, fuelType: vm.fuel, color: pick(['White','Silver','Black','Red','Blue']) },
    })
    vehicleMap[d.id] = v.id
  }
  console.log(`✅ ${allDrivers.length} vehicles created`)

  // ── Wallets ───────────────────────────────────────────────────────────────
  const walletMap: Record<string, string> = {}

  // Admin wallet
  const adminWallet = await prisma.wallet.create({ data: { userId: admin.id, balance: 5000 } })
  walletMap[admin.id] = adminWallet.id

  // Driver demo wallet
  const driverWallet = await prisma.wallet.create({ data: { userId: driver.id, balance: 3200 } })
  walletMap[driver.id] = driverWallet.id

  // Emp demo wallet
  const empWallet = await prisma.wallet.create({ data: { userId: emp.id, balance: 1500 } })
  walletMap[emp.id] = empWallet.id

  for (const u of [...extraDrivers, ...extraEmps]) {
    const w = await prisma.wallet.create({ data: { userId: u.id, balance: rand(300, 2500) } })
    walletMap[u.id] = w.id
  }

  // ── Helper: create one completed trip ────────────────────────────────────
  async function makeCompletedTrip(driverId: string, passengerId: string, dayBack: number) {
    const pickup = pick(LOCS)
    let dest = pick(LOCS)
    while (dest.address === pickup.address) dest = pick(LOCS)
    const distKm = Math.round((rand(5, 25) + Math.random()) * 10) / 10
    const fare = rand(80, 280)
    const depTime = daysAgo(dayBack, pick([8, 9, 10, 17, 18, 19]))

    const ride = await prisma.ride.create({
      data: {
        organizationId: org.id, driverId, vehicleId: vehicleMap[driverId],
        pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng,
        destAddress: dest.address, destLat: dest.lat, destLng: dest.lng,
        departureTime: depTime, availableSeats: 0, totalSeats: rand(2, 4),
        farePerSeat: fare, status: RideStatus.COMPLETED,
        distanceKm: distKm, durationMin: Math.round(distKm * 3),
      },
    })

    const booking = await prisma.rideBooking.create({
      data: { rideId: ride.id, userId: passengerId, seats: 1, status: BookingStatus.COMPLETED },
    })

    const completedAt = daysAgo(dayBack - 1, rand(9, 20))
    const trip = await prisma.trip.create({
      data: { rideId: ride.id, status: TripStatus.PAYMENT_COMPLETED, otpVerified: true, startedAt: depTime, completedAt },
    })

    await prisma.tripParticipant.createMany({
      data: [
        { tripId: trip.id, userId: driverId, isDriver: true },
        { tripId: trip.id, userId: passengerId, isDriver: false },
      ],
    })

    await prisma.payment.create({
      data: {
        userId: passengerId, bookingId: booking.id, tripId: trip.id,
        amount: fare, method: pick([PaymentMethod.WALLET, PaymentMethod.CASH, PaymentMethod.UPI]),
        status: PaymentStatus.COMPLETED, createdAt: completedAt,
      },
    })

    // Wallet transactions
    const dWalletId = walletMap[driverId]
    const pWalletId = walletMap[passengerId]
    if (dWalletId) {
      await prisma.walletTransaction.create({
        data: { walletId: dWalletId, type: TransactionType.CREDIT, reason: TransactionReason.RIDE_EARNING, amount: fare, note: `Earning: ${pickup.address.split(',')[0]} → ${dest.address.split(',')[0]}`, createdAt: completedAt },
      })
    }
    if (pWalletId) {
      await prisma.walletTransaction.create({
        data: { walletId: pWalletId, type: TransactionType.DEBIT, reason: TransactionReason.RIDE_PAYMENT, amount: fare, note: `Ride: ${pickup.address.split(',')[0]} → ${dest.address.split(',')[0]}`, createdAt: completedAt },
      })
    }

    // Chat message (50% chance)
    if (Math.random() > 0.5) {
      await prisma.chatMessage.create({
        data: { tripId: trip.id, senderId: passengerId, message: pick(CHAT_MSGS), createdAt: depTime },
      })
    }

    // Rating (70% chance)
    if (Math.random() > 0.3) {
      try {
        await prisma.rating.create({
          data: { raterId: passengerId, rateeId: driverId, rideId: ride.id, score: pick([3.5, 4.0, 4.5, 4.5, 5.0, 5.0]), createdAt: completedAt },
        })
      } catch { /* skip duplicate */ }
    }

    return trip.id
  }

  // ── 100 past trips for demo driver (as driver) ────────────────────────────
  console.log('⏳ Creating 100 trips for driver@gotogether.com...')
  for (let i = 1; i <= 100; i++) {
    const passenger = pick(allPassengers)
    await makeCompletedTrip(driver.id, passenger.id, i)
  }
  console.log('✅ 100 driver trips done')

  // ── 100 past trips for demo emp (as passenger) ────────────────────────────
  console.log('⏳ Creating 100 trips for user@gotogether.com...')
  for (let i = 1; i <= 100; i++) {
    const driverUser = pick(extraDrivers)
    await makeCompletedTrip(driverUser.id, emp.id, i)
  }
  console.log('✅ 100 emp trips done')

  // ── 50 extra trips among other users (for admin dashboard stats) ──────────
  console.log('⏳ Creating 50 extra trips for stats...')
  for (let i = 1; i <= 50; i++) {
    const d = pick(extraDrivers)
    const p = pick(allPassengers.filter(x => x.id !== d.id))
    await makeCompletedTrip(d.id, p.id, rand(1, 90))
  }
  console.log('✅ 50 extra trips done')

  // ── Future rides (next 7 days, searchable) ────────────────────────────────
  let futureCount = 0
  for (let day = 1; day <= 7; day++) {
    for (let r = 0; r < rand(5, 8); r++) {
      const d = pick(allDrivers)
      const pickup = pick(LOCS)
      let dest = pick(LOCS)
      while (dest.address === pickup.address) dest = pick(LOCS)
      const distKm = Math.round((rand(5, 25) + Math.random()) * 10) / 10
      const totalSeats = rand(2, 4)
      await prisma.ride.create({
        data: {
          organizationId: org.id, driverId: d.id, vehicleId: vehicleMap[d.id],
          pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng,
          destAddress: dest.address, destLat: dest.lat, destLng: dest.lng,
          departureTime: daysFromNow(day, pick([8, 9, 10, 17, 18, 19])),
          availableSeats: totalSeats, totalSeats,
          farePerSeat: rand(80, 250), status: RideStatus.PUBLISHED,
          distanceKm: distKm, durationMin: Math.round(distKm * 3),
        },
      })
      futureCount++
    }
  }
  console.log(`✅ ${futureCount} future rides published`)

  // ── Demo driver's upcoming ride (with 1 passenger booked) ────────────────
  const driverRide = await prisma.ride.create({
    data: {
      organizationId: org.id, driverId: driver.id, vehicleId: vehicleMap[driver.id],
      pickupAddress: 'Bopal, Ahmedabad', pickupLat: 23.0350, pickupLng: 72.4700,
      destAddress: 'Infocity, GIFT City, Gandhinagar', destLat: 23.1667, destLng: 72.6833,
      departureTime: daysFromNow(1, 9), availableSeats: 2, totalSeats: 3,
      farePerSeat: 150, status: RideStatus.PUBLISHED, distanceKm: 22.5, durationMin: 45,
    },
  })
  const driverRideBooking = await prisma.rideBooking.create({
    data: { rideId: driverRide.id, userId: extraEmps[0].id, seats: 1, status: BookingStatus.CONFIRMED },
  })
  await prisma.ride.update({ where: { id: driverRide.id }, data: { availableSeats: { decrement: 1 } } })
  const driverUpcomingTrip = await prisma.trip.create({
    data: { rideId: driverRide.id, status: TripStatus.BOOKED },
  })
  await prisma.tripParticipant.createMany({
    data: [
      { tripId: driverUpcomingTrip.id, userId: driver.id, isDriver: true },
      { tripId: driverUpcomingTrip.id, userId: extraEmps[0].id, isDriver: false },
    ],
  })
  void driverRideBooking

  // ── Demo emp's upcoming booking ───────────────────────────────────────────
  const empBookableRide = await prisma.ride.findFirst({
    where: { organizationId: org.id, status: RideStatus.PUBLISHED, driverId: { not: driver.id }, availableSeats: { gt: 0 }, departureTime: { gte: daysFromNow(1) } },
  })
  if (empBookableRide) {
    const empBooking = await prisma.rideBooking.create({
      data: { rideId: empBookableRide.id, userId: emp.id, seats: 1, status: BookingStatus.CONFIRMED },
    })
    await prisma.ride.update({ where: { id: empBookableRide.id }, data: { availableSeats: { decrement: 1 } } })
    const empTrip = await prisma.trip.create({ data: { rideId: empBookableRide.id, status: TripStatus.BOOKED } })
    await prisma.tripParticipant.createMany({
      data: [
        { tripId: empTrip.id, userId: empBookableRide.driverId, isDriver: true },
        { tripId: empTrip.id, userId: emp.id, isDriver: false },
      ],
    })
    void empBooking
  }

  // ── Saved places ──────────────────────────────────────────────────────────
  await prisma.savedPlace.createMany({
    data: [
      { userId: emp.id,    label: 'Home',   address: 'Vastrapur Lake, Ahmedabad',    lat: 23.0400, lng: 72.5300 },
      { userId: emp.id,    label: 'Office', address: 'Infocity, GIFT City, Gandhinagar', lat: 23.1667, lng: 72.6833 },
      { userId: driver.id, label: 'Home',   address: 'Bopal, Ahmedabad',             lat: 23.0350, lng: 72.4700 },
      { userId: driver.id, label: 'Office', address: 'Infocity, GIFT City, Gandhinagar', lat: 23.1667, lng: 72.6833 },
    ],
  })

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: emp.id,    title: 'Ride Booked!',    body: 'Your ride for tomorrow is confirmed.',  isRead: false },
      { userId: emp.id,    title: 'Payment Due',     body: 'Please pay ₹150 for your last ride.',   isRead: true  },
      { userId: driver.id, title: 'New Booking',     body: 'A passenger booked your ride.',         isRead: false },
      { userId: driver.id, title: 'Ride Completed',  body: '₹150 credited to your wallet.',         isRead: true  },
      { userId: admin.id,  title: 'Weekly Report',   body: '250 trips completed this week.',        isRead: false },
    ],
  })

  console.log('\n✅ Seed complete!')
  console.log('  driver@gotogether.com → 100 past trips (as driver)')
  console.log('  user@gotogether.com   → 100 past trips (as passenger)')
  console.log('  Extra users           → 50 more trips for stats')
  console.log(`  Future rides          → ${futureCount}`)
  console.log('\n📋 Demo Accounts (password: Demo@1234):')
  console.log('  Admin:  admin@gotogether.com')
  console.log('  Driver: driver@gotogether.com')
  console.log('  User:   user@gotogether.com')
}

main().catch(console.error).finally(() => prisma.$disconnect())
