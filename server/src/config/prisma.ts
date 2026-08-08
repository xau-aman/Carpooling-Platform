import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function connectWithRetry(retries = 5, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
      return
    } catch {
      console.log(`⏳ DB connecting... attempt ${i + 1}/${retries}`)
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs))
    }
  }
  console.error('❌ Could not connect to database after retries')
}

// Reconnect silently on Neon idle connection drop
process.on('unhandledRejection', async (reason) => {
  const msg = String(reason)
  if (msg.includes('kind: Closed') || msg.includes('connection closed') || msg.includes('ECONNRESET')) {
    try { await prisma.$connect() } catch { /* will retry on next query */ }
  }
})
