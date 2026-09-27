"use server";

import { prisma } from "@/lib/prisma";

// In a real app we'd get this from auth session
const MOCK_USER_EMAIL = "test@splittrack.com";

async function getOrCreateUser() {
  let user = await prisma.user.findUnique({ where: { email: MOCK_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: MOCK_USER_EMAIL,
        name: "Arjun",
      }
    });
  }
  return user;
}

export async function getFriendsDb() {
  const user = await getOrCreateUser();
  const friends = await prisma.friend.findMany({
    where: { userId: user.id },
    include: {
      expenseShares: {
        include: { expense: true }
      },
      payments: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return friends.map(f => {
    // Calculate pending from shares and payments
    const totalShares = f.expenseShares.reduce((sum, share) => sum + Number(share.share), 0);
    const totalPayments = f.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = totalShares - totalPayments;
    let remainingPayments = totalPayments;
    
    // Sort shares oldest first to settle oldest debts first
    const shares = [...f.expenseShares].sort((a, b) => new Date(a.expense.date).getTime() - new Date(b.expense.date).getTime());
    
    const unsettledExpenses = [];
    
    for (const s of shares) {
      const shareAmount = Number(s.share);
      if (remainingPayments >= shareAmount - 0.01) { // 0.01 for floating point safety
        // Fully settled
        remainingPayments -= shareAmount;
      } else if (remainingPayments > 0) {
        // Partially settled
        unsettledExpenses.push({
          id: s.expense.id,
          title: s.expense.title,
          amount: Number((shareAmount - remainingPayments).toFixed(2))
        });
        remainingPayments = 0;
      } else {
        // Fully unsettled
        unsettledExpenses.push({
          id: s.expense.id,
          title: s.expense.title,
          amount: shareAmount
        });
      }
    }
    
    // Reverse so newest unsettled are on top
    unsettledExpenses.reverse();

    return {
      id: f.id,
      name: f.name,
      initial: f.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      pending: Number(pending.toFixed(2)),
      expenses: unsettledExpenses
    };
  });
}

export async function getHistoryDb() {
  const user = await getOrCreateUser();
  
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    include: { participants: { include: { friend: true } } },
    orderBy: { date: 'desc' },
    take: 50
  });

  const payments = await prisma.payment.findMany({
    where: { friend: { userId: user.id } },
    include: { friend: true },
    orderBy: { date: 'desc' },
    take: 50
  });

  // Combine and sort
  const history = [
    ...expenses.map(e => ({
      id: e.id,
      type: "expense" as const,
      title: e.title,
      amount: Number(e.amount),
      date: e.date.toISOString(),
      participants: e.participants.map(p => p.friend ? p.friend.name.substring(0, 2).toUpperCase() : 'ME')
    })),
    ...payments.map(p => ({
      id: p.id,
      type: "payment" as const,
      title: `Settled up by ${p.friend.name}`,
      amount: Number(p.amount),
      date: p.date.toISOString(),
      participants: [p.friend.name.substring(0, 2).toUpperCase()]
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return history;
}

export async function addExpenseDb(title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>, date: string) {
  const user = await getOrCreateUser();

  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      userId: user.id,
      date: new Date(date)
    }
  });

  for (const pid of participantIds) {
    let share = 0;
    if (splitMethod === "equal") {
      share = amount / participantIds.length;
    } else {
      share = customAmounts[pid] || 0;
    }
    if (share > 0) {
      await prisma.expenseParticipant.create({
        data: {
          expenseId: expense.id,
          friendId: pid === 'me' ? null : pid,
          share
        }
      });
    }
  }
}

export async function settleAllDb(friendId: string, pendingAmount: number) {
  if (pendingAmount <= 0) return;
  await prisma.payment.create({
    data: {
      friendId,
      amount: pendingAmount,
      method: "cash",
    }
  });
}

export async function settleExpenseDb(friendId: string, amount: number) {
  await prisma.payment.create({
    data: {
      friendId,
      amount,
      method: "cash",
    }
  });
}

export async function addFriendDb(name: string) {
  const user = await getOrCreateUser();
  await prisma.friend.create({
    data: {
      name,
      userId: user.id
    }
  });
}

export async function deleteExpenseDb(id: string) {
  await prisma.expense.delete({
    where: { id }
  });
}

export async function deletePaymentDb(id: string) {
  await prisma.payment.delete({
    where: { id }
  });
}
