"use client";

import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, IndianRupee, History, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function Dashboard() {
  const { friends, settleExpense, settleAll, deleteTransaction } = useAppContext();

  const handleSettleExpense = (friendId: string, expenseId: string) => {
    settleExpense(friendId, expenseId);
  };

  const handleSettleAll = (friendId: string) => {
    settleAll(friendId);
  };

  const totalPending = friends.reduce((acc, curr) => acc + curr.pending, 0);

  return (
    <PageTransition>
      <header className="mb-6 pt-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      </header>

      {/* Simplified Total Card */}
      <Card className="bg-primary text-primary-foreground border-none shadow-md mb-8 rounded-3xl">
        <CardContent className="p-6">
          <div className="text-primary-foreground/80 text-sm font-medium mb-1">Total You Are Owed</div>
          <div className="text-5xl font-bold flex items-center">
            <IndianRupee size={36} className="mr-1 opacity-80" />
            {totalPending}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">Pending Balances</h2>
      </div>

      <div className="space-y-5">
        <AnimatePresence mode="popLayout">
          {friends.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 text-muted-foreground flex flex-col items-center"
            >
              <CheckCircle2 size={48} className="text-success mb-3 opacity-50" />
              <p>You are all settled up!</p>
            </motion.div>
          ) : (
            friends.map((friend) => (
              <motion.div
                key={friend.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-border shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-border bg-background shadow-sm">
                          <AvatarFallback className="font-bold text-foreground text-lg">
                            {friend.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-semibold text-xl">{friend.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-0.5">Total Owed</div>
                        <div className="font-bold text-destructive text-2xl tracking-tight">₹{friend.pending}</div>
                      </div>
                    </div>
                    
                    {/* Friend-wise Expense Breakdown */}
                    <div className="p-4 bg-background space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider mb-3">
                        <History size={12} /> Unpaid Expenses
                      </div>
                      
                      <div className="space-y-2">
                        <AnimatePresence>
                          {friend.expenses.map((expense) => (
                            <motion.div 
                              key={expense.id} 
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0, scale: 0.95 }}
                              className="flex justify-between items-center p-3 rounded-2xl bg-secondary/30 border border-border/50"
                            >
                              <div className="flex flex-col">
                                <span className="text-foreground font-semibold text-sm">{expense.title}</span>
                                <span className="font-mono text-destructive font-medium text-sm">₹{expense.amount}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-9 rounded-xl bg-success/10 text-success hover:bg-success hover:text-success-foreground border-success/30 font-semibold transition-colors"
                                  onClick={() => handleSettleExpense(friend.id, expense.id)}
                                >
                                  <Check className="mr-1.5 h-4 w-4" />
                                  Settle
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  onClick={() => deleteTransaction(expense.id, "expense")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {friend.expenses.length > 1 && (
                        <div className="pt-3 mt-1">
                          <Button 
                            variant="ghost"
                            className="w-full rounded-xl text-muted-foreground hover:bg-success/10 hover:text-success font-semibold h-11"
                            onClick={() => handleSettleAll(friend.id)}
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Settle All for {friend.name}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
