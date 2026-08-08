import { prisma } from '../config/prisma'
import { TransactionType, TransactionReason } from '@prisma/client'

export const getWallet = (userId: string) =>
  prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
  })

export const rechargeWallet = async (userId: string, amount: number) =>
  prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    })
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: TransactionType.CREDIT, reason: TransactionReason.RECHARGE, amount, note: 'Wallet recharge' },
    })
    return wallet
  }, { timeout: 30000 })

export const creditWallet = async (userId: string, amount: number, note: string) =>
  prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    })
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: TransactionType.CREDIT, reason: TransactionReason.RIDE_EARNING, amount, note },
    })
    return wallet
  }, { timeout: 30000 })

export const deductWallet = async (userId: string, amount: number, note: string) =>
  prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < amount) throw new Error('Insufficient balance')
    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    })
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: TransactionType.DEBIT, reason: TransactionReason.RIDE_PAYMENT, amount, note },
    })
    return updated
  }, { timeout: 30000 })
