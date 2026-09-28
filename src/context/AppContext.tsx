"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getFriendsDb, getHistoryDb, addExpenseDb, settleAllDb, settleExpenseDb, addFriendDb } from "@/actions/dbActions";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  isSettled?: boolean;
  remainingAmount?: number;
  imageUrl?: string | null;
};

export type Friend = {
  id: string;
  name: string;
  initial: string;
  avatar?: string | null;
  expenses: Expense[];
  pending: number;
};

export type Transaction = {
  id: string;
  type: "expense" | "payment";
  title: string;
  amount: number;
  date: string;
  participants: string[];
  imageUrl?: string | null;
};

type AppContextType = {
  friends: Friend[];
  history: Transaction[];
  isLoading: boolean;
  addExpense: (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>, date: string, imageUrl?: string) => Promise<void>;
  settleExpense: (friendId: string, expenseId: string) => Promise<void>;
  settleAll: (friendId: string) => Promise<void>;
  addFriend: (name: string, avatar?: string) => Promise<void>;
  deleteFriend: (friendId: string) => Promise<void>;
  deleteTransaction: (id: string, type: "expense" | "payment") => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [f, h] = await Promise.all([getFriendsDb(), getHistoryDb()]);
      setFriends(f);
      setHistory(h as Transaction[]);
    } catch (error) {
      console.error("Failed to load DB data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addExpense = async (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>, date: string, imageUrl?: string) => {
    // Optimistic UI could go here, but let's just await for true consistency
    await addExpenseDb(title, amount, participantIds, splitMethod, customAmounts, date, imageUrl);
    await loadData();
  };

  const settleExpense = async (friendId: string, expenseId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    const exp = friend.expenses.find(e => e.id === expenseId);
    if (!exp) return;
    
    await settleExpenseDb(friendId, exp.remainingAmount ?? exp.amount, expenseId);
    await loadData();
  };

  const settleAll = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend || friend.pending <= 0) return;
    
    await settleAllDb(friendId, friend.pending);
    await loadData();
  };

  const addFriend = async (name: string, avatar?: string) => {
    await addFriendDb(name, avatar);
    await loadData();
  };

  const deleteFriend = async (friendId: string) => {
    const { deleteFriendDb } = await import('@/actions/dbActions');
    await deleteFriendDb(friendId);
    await loadData();
  };

  const deleteTransaction = async (id: string, type: "expense" | "payment") => {
    if (type === "expense") {
      const { deleteExpenseDb } = await import('@/actions/dbActions');
      await deleteExpenseDb(id);
    } else {
      const { deletePaymentDb } = await import('@/actions/dbActions');
      await deletePaymentDb(id);
    }
    await loadData();
  };

  return (
    <AppContext.Provider value={{ friends, history, isLoading, addExpense, settleExpense, settleAll, addFriend, deleteFriend, deleteTransaction }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
