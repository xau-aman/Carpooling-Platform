import { PrismaClient, FuelType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GoTogether...')

  // Wipe all transactional data first
  await prisma.payment.deleteMany()
  await prisma.walletTransaction.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.tripParticipant.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.rideBooking.deleteMany()
  await prisma.ride.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.savedPlace.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organizationSettings.deleteMany()
  await prisma.organization.deleteMany()

  const org = await prisma.organization.create({
    data: {
      id: 'org-1',
      name: 'GoTogether Corp',
      address: 'India',
      industry: 'Technology',
      adminEmail: 'admin@gotogether.com',
    },
  })

  await prisma.organizationSettings.create({
    data: { organizationId: org.id, fuelCostPerLiter: 105, costPerKm: 6 },
  })

  const hash = await bcrypt.hash('Demo@1234', 12)

  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-1',
      organizationId: org.id,
      email: 'admin@gotogether.com',
      name: 'Admin',
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
      profile: { create: { department: 'Engineering', manager: 'Admin', location: 'Ahmedabad' } },
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
      profile: { create: { department: 'Product', manager: 'Admin', location: 'Ahmedabad' } },
    },
  })

  // Wallets with zero balance
  for (const userId of [admin.id, driver.id, emp.id]) {
    await prisma.wallet.create({ data: { userId, balance: 0 } })
  }

  // Driver vehicle
  await prisma.vehicle.create({
    data: {
      organizationId: org.id,
      userId: driver.id,
      model: 'Maruti Swift',
      registration: 'GJ01AB1234',
      seats: 4,
      fuelType: FuelType.PETROL,
      color: 'White',
    },
  })

  console.log('✅ Seed complete!')
  console.log('\n📋 Demo Accounts (password: Demo@1234):')
  console.log('  Admin:  admin@gotogether.com')
  console.log('  Driver: driver@gotogether.com')
  console.log('  User:   user@gotogether.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

async function main() {
  console.log('🌱 Seeding WorkZen...')

  // ── Organization — Odoo ────────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: 'org-odoo-1' },
    update: { name: 'Odoo', adminEmail: 'admin@odoo.com', address: 'Sector V, Salt Lake, Kolkata, West Bengal' },
    create: {
      id: 'org-odoo-1',
      name: 'Odoo',
      address: 'Sector V, Salt Lake, Kolkata, West Bengal',
      industry: 'Technology',
      adminEmail: 'admin@odoo.com',
    },
  })

  await prisma.organizationSettings.upsert({
    where: { organizationId: org1.id },
    update: {},
    create: {
      organizationId: org1.id,
      fuelCostPerLiter: 105,
      costPerKm: 6,
      defaultCarpoolPolicy: 'Employees must carpool for distances > 5km',
    },
  })

  const hash = await bcrypt.hash('Demo@1234', 12)

  // ── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@odoo.com' },
    update: {},
    create: {
      id: 'user-admin-1',
      organizationId: org1.id,
      email: 'admin@odoo.com',
      name: 'Admin User',
      phone: '9000000001',
      passwordHash: hash,
      role: 'ADMIN',
    },
  })

  const driver = await prisma.user.upsert({
    where: { email: 'raj@odoo.com' },
    update: {},
    create: {
      id: 'user-driver-1',
      organizationId: org1.id,
      email: 'raj@odoo.com',
      name: 'Raj Patel',
      phone: '9000000002',
      passwordHash: hash,
      profile: { create: { department: 'Engineering', manager: 'Admin User', location: 'Kolkata' } },
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'aman@odoo.com' },
    update: {},
    create: {
      id: 'user-emp-1',
      organizationId: org1.id,
      email: 'aman@odoo.com',
      name: 'Aman Shah',
      phone: '9000000003',
      passwordHash: hash,
      profile: { create: { department: 'Product', manager: 'Admin User', location: 'Kolkata' } },
    },
  })

  const emp2 = await prisma.user.upsert({
    where: { email: 'priya@odoo.com' },
    update: {},
    create: {
      id: 'user-emp-2',
      organizationId: org1.id,
      email: 'priya@odoo.com',
      name: 'Priya Mehta',
      phone: '9000000004',
      passwordHash: hash,
      profile: { create: { department: 'Design', manager: 'Admin User', location: 'Kolkata' } },
    },
  })

  // ── Wallets ────────────────────────────────────────────────────────────
  for (const userId of [admin.id, driver.id, employee.id, emp2.id]) {
    await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: userId === employee.id ? 1240 : 500 },
    })
  }

  // ── Vehicles ───────────────────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.upsert({
    where: { organizationId_registration: { organizationId: org1.id, registration: 'GJ01AB1234' } },
    update: {},
    create: {
      id: 'vehicle-1',
      organizationId: org1.id,
      userId: driver.id,
      model: 'Maruti Swift Dzire',
      registration: 'GJ01AB1234',
      seats: 4,
      fuelType: FuelType.PETROL,
      color: 'White',
    },
  })

  await prisma.vehicle.upsert({
    where: { organizationId_registration: { organizationId: org1.id, registration: 'GJ05CD5678' } },
    update: {},
    create: {
      organizationId: org1.id,
      userId: emp2.id,
      model: 'Honda City',
      registration: 'GJ05CD5678',
      seats: 4,
      fuelType: FuelType.PETROL,
      color: 'Silver',
    },
  })

  // ── Rides ──────────────────────────────────────────────────────────────
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const ride1 = await prisma.ride.upsert({
    where: { id: 'ride-demo-1' },
    update: {},
    create: {
      id: 'ride-demo-1',
      organizationId: org1.id,
      driverId: driver.id,
      vehicleId: vehicle1.id,
      pickupAddress: 'Howrah Station, Howrah, Kolkata',
      pickupLat: 22.5839,
      pickupLng: 88.3424,
      destAddress: 'Odoo India, Sector V, Salt Lake, Kolkata',
      destLat: 22.5726,
      destLng: 88.4319,
      departureTime: tomorrow,
      availableSeats: 3,
      totalSeats: 3,
      farePerSeat: 120,
      status: RideStatus.PUBLISHED,
      distanceKm: 12.4,
      durationMin: 32,
    },
  })

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  dayAfter.setHours(8, 30, 0, 0)

  await prisma.ride.upsert({
    where: { id: 'ride-demo-2' },
    update: {},
    create: {
      id: 'ride-demo-2',
      organizationId: org1.id,
      driverId: emp2.id,
      vehicleId: (await prisma.vehicle.findFirst({ where: { userId: emp2.id } }))!.id,
      pickupAddress: 'Park Street, Kolkata',
      pickupLat: 22.5514,
      pickupLng: 88.3527,
      destAddress: 'Odoo India, Sector V, Salt Lake, Kolkata',
      destLat: 22.5726,
      destLng: 88.4319,
      departureTime: dayAfter,
      availableSeats: 2,
      totalSeats: 2,
      farePerSeat: 100,
      status: RideStatus.PUBLISHED,
      distanceKm: 10.8,
      durationMin: 28,
    },
  })

  // ── Past completed trip ────────────────────────────────────────────────
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 3)
  pastDate.setHours(9, 0, 0, 0)

  const pastRide = await prisma.ride.upsert({
    where: { id: 'ride-past-1' },
    update: {},
    create: {
      id: 'ride-past-1',
      organizationId: org1.id,
      driverId: driver.id,
      vehicleId: vehicle1.id,
      pickupAddress: 'Howrah Station, Howrah, Kolkata',
      pickupLat: 22.5839,
      pickupLng: 88.3424,
      destAddress: 'Odoo India, Sector V, Salt Lake, Kolkata',
      destLat: 22.5726,
      destLng: 88.4319,
      departureTime: pastDate,
      availableSeats: 0,
      totalSeats: 3,
      farePerSeat: 120,
      status: RideStatus.COMPLETED,
      distanceKm: 12.4,
      durationMin: 32,
    },
  })

  const pastTrip = await prisma.trip.upsert({
    where: { rideId: pastRide.id },
    update: {},
    create: {
      id: 'trip-past-1',
      rideId: pastRide.id,
      status: 'PAYMENT_COMPLETED',
      startedAt: pastDate,
      completedAt: new Date(pastDate.getTime() + 34 * 60000),
    },
  })

  for (const { userId, isDriver } of [{ userId: driver.id, isDriver: true }, { userId: employee.id, isDriver: false }]) {
    await prisma.tripParticipant.upsert({
      where: { tripId_userId: { tripId: pastTrip.id, userId } },
      update: {},
      create: { tripId: pastTrip.id, userId, isDriver },
    })
  }

  const pastBooking = await prisma.rideBooking.upsert({
    where: { rideId_userId: { rideId: pastRide.id, userId: employee.id } },
    update: {},
    create: { rideId: pastRide.id, userId: employee.id, seats: 1, status: 'COMPLETED' },
  })

  await prisma.payment.upsert({
    where: { bookingId: pastBooking.id },
    update: {},
    create: {
      userId: employee.id,
      bookingId: pastBooking.id,
      tripId: pastTrip.id,
      amount: 120,
      method: 'WALLET',
      status: 'COMPLETED',
    },
  })

  // ── Ratings ────────────────────────────────────────────────────────────
  await prisma.rating.upsert({
    where: { raterId_rideId: { raterId: employee.id, rideId: pastRide.id } },
    update: {},
    create: { raterId: employee.id, rateeId: driver.id, rideId: pastRide.id, score: 4.9, comment: 'Great driver!' },
  })

  // ── Saved Places ───────────────────────────────────────────────────────
  await prisma.savedPlace.upsert({
    where: { id: 'place-home-1' },
    update: {},
    create: { id: 'place-home-1', userId: employee.id, label: 'Home', address: 'Howrah Station, Howrah, Kolkata', lat: 22.5839, lng: 88.3424 },
  })
  await prisma.savedPlace.upsert({
    where: { id: 'place-office-1' },
    update: {},
    create: { id: 'place-office-1', userId: employee.id, label: 'Office', address: 'Odoo India, Sector V, Salt Lake, Kolkata', lat: 22.5726, lng: 88.4319 },
  })

  // ── Upcoming trip ──────────────────────────────────────────────────────
  const upcomingTrip = await prisma.trip.upsert({
    where: { rideId: ride1.id },
    update: {},
    create: { id: 'trip-upcoming-1', rideId: ride1.id, status: 'BOOKED' },
  })

  for (const { userId, isDriver } of [{ userId: driver.id, isDriver: true }, { userId: employee.id, isDriver: false }]) {
    await prisma.tripParticipant.upsert({
      where: { tripId_userId: { tripId: upcomingTrip.id, userId } },
      update: {},
      create: { tripId: upcomingTrip.id, userId, isDriver },
    })
  }

  await prisma.rideBooking.upsert({
    where: { rideId_userId: { rideId: ride1.id, userId: employee.id } },
    update: {},
    create: { rideId: ride1.id, userId: employee.id, seats: 1, status: 'CONFIRMED' },
  })

  await prisma.ride.update({ where: { id: ride1.id }, data: { availableSeats: 2 } })

  // ── Wallet transactions ────────────────────────────────────────────────
  const empWallet = await prisma.wallet.findUnique({ where: { userId: employee.id } })
  if (empWallet) {
    const txCount = await prisma.walletTransaction.count({ where: { walletId: empWallet.id } })
    if (txCount === 0) {
      await prisma.walletTransaction.createMany({
        data: [
          { walletId: empWallet.id, type: 'CREDIT', reason: 'RECHARGE', amount: 500, note: 'Wallet recharge' },
          { walletId: empWallet.id, type: 'CREDIT', reason: 'RECHARGE', amount: 1000, note: 'Wallet recharge' },
          { walletId: empWallet.id, type: 'DEBIT', reason: 'RIDE_PAYMENT', amount: 120, note: 'Ride payment' },
          { walletId: empWallet.id, type: 'CREDIT', reason: 'REFUND', amount: 120, note: 'Refund' },
          { walletId: empWallet.id, type: 'DEBIT', reason: 'RIDE_PAYMENT', amount: 260, note: 'Ride payment' },
        ],
      })
    }
  }

  console.log('✅ Seed complete!')
  console.log('\n📋 Demo Accounts (password: Demo@1234):')
  console.log('  Admin:    admin@odoo.com')
  console.log('  Driver:   raj@odoo.com')
  console.log('  Employee: aman@odoo.com')
  console.log('  Employee: priya@odoo.com')
  console.log('  Org:      Odoo (Kolkata)')
  console.log('  Office:   Sector V, Salt Lake, Kolkata')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
