"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    // Separate specific vs general payments
    const specificPayments = f.payments.filter(p => p.expenseId);
    const generalPayments = f.payments.filter(p => !p.expenseId);
    
    let remainingGeneralPayments = generalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Sort shares oldest first to settle oldest debts first
    const shares = [...f.expenseShares].sort((a, b) => {
      const timeDiff = new Date(a.expense.date).getTime() - new Date(b.expense.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      // Stable sort fallback so expenses on the same day don't randomly swap places
      return a.expense.id.localeCompare(b.expense.id);
    });
    
    const processedExpenses = [];
    
    for (const s of shares) {
      const shareAmount = Number(s.share);
      
      const specificForThis = specificPayments.filter(p => p.expenseId === s.expense.id).reduce((sum, p) => sum + Number(p.amount), 0);
      let remainingForThis = shareAmount - specificForThis;
      if (remainingForThis < 0) remainingForThis = 0;

      if (remainingGeneralPayments >= remainingForThis - 0.01) { 
        // Fully settled
        remainingGeneralPayments -= remainingForThis;
        processedExpenses.push({
          id: s.expense.id,
          title: s.expense.title,
          amount: shareAmount,
          remainingAmount: 0,
          isSettled: true,
          imageUrl: s.expense.imageUrl
        });
      } else if (remainingGeneralPayments > 0) {
        // Partially settled
        processedExpenses.push({
          id: s.expense.id,
          title: s.expense.title,
          amount: shareAmount,
          remainingAmount: Number((remainingForThis - remainingGeneralPayments).toFixed(2)),
          isSettled: false,
          imageUrl: s.expense.imageUrl
        });
        remainingGeneralPayments = 0;
      } else {
        // Unsettled
        processedExpenses.push({
          id: s.expense.id,
          title: s.expense.title,
          amount: shareAmount,
          remainingAmount: Number(remainingForThis.toFixed(2)),
          isSettled: remainingForThis <= 0.01,
          imageUrl: s.expense.imageUrl
        });
      }
    }
    
    // Reverse so newest are on top
    processedExpenses.reverse();

    return {
      id: f.id,
      name: f.name,
      initial: f.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      avatar: f.avatar,
      pending: Number(pending.toFixed(2)),
      expenses: processedExpenses
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
      participants: e.participants.map(p => p.friend ? p.friend.name.substring(0, 2).toUpperCase() : 'ME'),
      imageUrl: e.imageUrl
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

export async function addExpenseDb(title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>, date: string, imageUrl?: string) {
  const user = await getOrCreateUser();

  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      userId: user.id,
      date: new Date(date),
      imageUrl
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
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function settleAllDb(friendId: string, pendingAmount: number) {
  if (pendingAmount <= 0) return;
  
  // Recalculate true pending amount to prevent double clicks creating negative balances
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
    include: { expenseShares: true, payments: true }
  });
  if (friend) {
    const totalShares = friend.expenseShares.reduce((sum, share) => sum + Number(share.share), 0);
    const totalPayments = friend.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const actualPending = totalShares - totalPayments;
    
    if (actualPending <= 0) return; // Already fully settled
    if (pendingAmount > actualPending) {
      pendingAmount = actualPending; // Clamp to actual pending
    }
  }

  await prisma.payment.create({
    data: {
      friendId,
      amount: pendingAmount,
      method: "cash",
    }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function settleExpenseDb(friendId: string, amount: number, expenseId?: string) {
  if (expenseId) {
    const friend = await prisma.friend.findUnique({
      where: { id: friendId },
      include: {
        expenseShares: true,
        payments: true
      }
    });
    if (friend) {
      const share = friend.expenseShares.find(s => s.expenseId === expenseId);
      if (share) {
        const specificPayments = friend.payments
          .filter(p => p.expenseId === expenseId)
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining = Number(share.share) - specificPayments;
        
        if (remaining <= 0) {
          // Already fully settled, avoid duplicate payments from UI double-clicks
          return;
        }
        if (amount > remaining) {
          amount = remaining; // Clamp to prevent negative pending balance
        }
      }
    }
  }

  await prisma.payment.create({
    data: {
      friendId,
      expenseId,
      amount,
      method: "cash",
    }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function addFriendDb(name: string, avatar?: string) {
  const user = await getOrCreateUser();
  await prisma.friend.create({
    data: {
      name,
      avatar,
      userId: user.id
    }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function deleteExpenseDb(id: string) {
  await prisma.expense.delete({
    where: { id }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function deletePaymentDb(id: string) {
  await prisma.payment.delete({
    where: { id }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}

export async function deleteFriendDb(id: string) {
  await prisma.friend.delete({
    where: { id }
  });
  revalidatePath("/");
  revalidatePath("/friends");
}
