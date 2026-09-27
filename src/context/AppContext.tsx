"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getFriendsDb, getHistoryDb, addExpenseDb, settleAllDb, settleExpenseDb, addFriendDb } from "@/actions/dbActions";

export type Expense = {
  id: string;
  title: string;
  amount: number;
};

export type Friend = {
  id: string;
  name: string;
  initial: string;
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
};

type AppContextType = {
  friends: Friend[];
  history: Transaction[];
  isLoading: boolean;
  addExpense: (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>) => Promise<void>;
  settleExpense: (friendId: string, expenseId: string) => Promise<void>;
  settleAll: (friendId: string) => Promise<void>;
  addFriend: (name: string) => Promise<void>;
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

  const addExpense = async (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>) => {
    // Optimistic UI could go here, but let's just await for true consistency
    await addExpenseDb(title, amount, participantIds, splitMethod, customAmounts);
    await loadData();
  };

  const settleExpense = async (friendId: string, expenseId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    const exp = friend.expenses.find(e => e.id === expenseId);
    if (!exp) return;
    
    await settleExpenseDb(friendId, exp.amount);
    await loadData();
  };

  const settleAll = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend || friend.pending <= 0) return;
    
    await settleAllDb(friendId, friend.pending);
    await loadData();
  };

  const addFriend = async (name: string) => {
    await addFriendDb(name);
    await loadData();
  };

  return (
    <AppContext.Provider value={{ friends, history, isLoading, addExpense, settleExpense, settleAll, addFriend }}>
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
