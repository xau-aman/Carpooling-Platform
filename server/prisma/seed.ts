import { PrismaClient, FuelType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GoTogether...')

  // Wipe all data
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

  for (const userId of [admin.id, driver.id, emp.id]) {
    await prisma.wallet.create({ data: { userId, balance: 500 } })
  }

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
