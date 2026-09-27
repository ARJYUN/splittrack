"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  addExpense: (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>) => void;
  settleExpense: (friendId: string, expenseId: string) => void;
  settleAll: (friendId: string) => void;
};

const INITIAL_FRIENDS: Friend[] = [
  { 
    id: "1", name: "Rahul", initial: "R", pending: 180, 
    expenses: [{ id: "e1", title: "Tea & Snacks", amount: 60 }, { id: "e2", title: "Shawarma", amount: 120 }] 
  },
  { 
    id: "2", name: "Adarsh", initial: "A", pending: 220, 
    expenses: [{ id: "e3", title: "Cab", amount: 150 }, { id: "e4", title: "Bakery", amount: 70 }] 
  },
  { 
    id: "3", name: "Abhinav", initial: "AB", pending: 140, 
    expenses: [{ id: "e5", title: "Dinner", amount: 140 }] 
  },
];

const INITIAL_HISTORY: Transaction[] = [
  { id: "h1", type: "expense", title: "Dinner", amount: 140, date: new Date().toISOString(), participants: ["AB"] }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedFriends = localStorage.getItem("splittrack_friends");
    const storedHistory = localStorage.getItem("splittrack_history");
    if (storedFriends) setFriends(JSON.parse(storedFriends));
    else setFriends(INITIAL_FRIENDS);
    
    if (storedHistory) setHistory(JSON.parse(storedHistory));
    else setHistory(INITIAL_HISTORY);
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("splittrack_friends", JSON.stringify(friends));
      localStorage.setItem("splittrack_history", JSON.stringify(history));
    }
  }, [friends, history, isLoaded]);

  const addExpense = (title: string, amount: number, participantIds: string[], splitMethod: string, customAmounts: Record<string, number>) => {
    const newHistory: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "expense",
      title,
      amount,
      date: new Date().toISOString(),
      participants: participantIds.map(id => {
        if (id === 'me') return 'M';
        const f = friends.find(f => f.id === id);
        return f ? f.initial : '?';
      })
    };

    setHistory(prev => [newHistory, ...prev]);

    setFriends(prev => {
      let updatedFriends = [...prev];
      
      participantIds.forEach(pid => {
        if (pid === "me") return;
        
        const fIndex = updatedFriends.findIndex(f => f.id === pid);
        if (fIndex !== -1) {
          const friend = updatedFriends[fIndex];
          
          let share = 0;
          if (splitMethod === "equal") {
            share = amount / participantIds.length;
          } else {
            share = customAmounts[pid] || 0;
          }

          if (share > 0) {
            const newExp = { id: Math.random().toString(36).substr(2, 9), title, amount: Number(share.toFixed(2)) };
            updatedFriends[fIndex] = {
              ...friend,
              expenses: [...friend.expenses, newExp],
              pending: Number((friend.pending + share).toFixed(2))
            };
          }
        } else {
           // If friend doesn't exist in active array, we would normally fetch them from DB.
           // For mock, we ignore if not found in INITIAL array.
        }
      });
      return updatedFriends;
    });
  };

  const settleExpense = (friendId: string, expenseId: string) => {
    setFriends(prev => prev.map(f => {
      if (f.id === friendId) {
        const exp = f.expenses.find(e => e.id === expenseId);
        if (exp) {
          setHistory(h => [{
            id: Math.random().toString(36).substr(2, 9),
            type: "payment",
            title: `Settled ${exp.title} from ${f.name}`,
            amount: exp.amount,
            date: new Date().toISOString(),
            participants: [f.initial]
          }, ...h]);
        }
        const updated = f.expenses.filter(e => e.id !== expenseId);
        const pending = updated.reduce((sum, e) => sum + e.amount, 0);
        return { ...f, expenses: updated, pending: Number(pending.toFixed(2)) };
      }
      return f;
    }));
  };

  const settleAll = (friendId: string) => {
    setFriends(prev => prev.map(f => {
      if (f.id === friendId) {
        setHistory(h => [{
          id: Math.random().toString(36).substr(2, 9),
          type: "payment",
          title: `Fully settled up by ${f.name}`,
          amount: f.pending,
          date: new Date().toISOString(),
          participants: [f.initial]
        }, ...h]);
        return { ...f, expenses: [], pending: 0 };
      }
      return f;
    }));
  };

  return (
    <AppContext.Provider value={{ friends, history, addExpense, settleExpense, settleAll }}>
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
