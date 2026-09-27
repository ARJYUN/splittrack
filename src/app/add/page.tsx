"use client";

import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Coffee, Pizza, Croissant, Car, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { name: "Tea", icon: Coffee, amount: 60 },
  { name: "Snacks", icon: Pizza, amount: 150 },
  { name: "Bakery", icon: Croissant, amount: 200 },
  { name: "Cab", icon: Car, amount: 350 },
];

const FRIENDS = [
  { id: "me", name: "Me (Arjun)", initial: "M" },
  { id: "1", name: "Rahul", initial: "R" },
  { id: "2", name: "Adarsh", initial: "A" },
  { id: "3", name: "Abhinav", initial: "AB" },
];

export default function AddExpense() {
  const { addExpense } = useAppContext();
  
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>(["me", "1", "2", "3"]);
  const [splitMethod, setSplitMethod] = useState("equal");
  const [isSuccess, setIsSuccess] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  const parsedAmount = parseFloat(amount) || 0;
  const equalShare = selectedFriends.length > 0 ? parsedAmount / selectedFriends.length : 0;

  const handleTemplateClick = (tpl: any) => {
    setExpenseName(tpl.name);
    setAmount(tpl.amount.toString());
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => 
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleCustomAmountChange = (id: string, val: string) => {
    setCustomAmounts(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const handleSave = () => {
    addExpense(expenseName, parsedAmount, selectedFriends, splitMethod, customAmounts);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setExpenseName("");
      setAmount("");
      setCustomAmounts({});
    }, 2500);
  };

  if (isSuccess) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-success/20 p-6 rounded-full text-success mb-4"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold"
        >
          Expense Added!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mt-2"
        >
          Balances have been updated.
        </motion.p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
      </header>

      {/* Templates */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.name}
            onClick={() => handleTemplateClick(tpl)}
            className="flex flex-col items-center gap-2 p-3 bg-card rounded-2xl border border-border shadow-sm min-w-[80px] hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
              <tpl.icon size={20} />
            </div>
            <span className="text-[11px] font-medium">{tpl.name}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6 mt-2">
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input 
                placeholder="What was it for?" 
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="bg-secondary/50 border-none h-12 text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50 border-none h-14 text-3xl font-bold font-mono"
              />
            </div>
            <div className="space-y-1.5 flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <div className="font-medium">{format(new Date(), "MMM dd, yyyy")}</div>
              </div>
              <div className="text-right">
                <Label className="text-muted-foreground">Paid By</Label>
                <div className="font-medium text-primary">Me</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <Label className="mb-3 block text-base font-semibold">Participants</Label>
          <div className="grid grid-cols-4 gap-3">
            {FRIENDS.map((friend) => {
              const isSelected = selectedFriends.includes(friend.id);
              return (
                <div 
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className={cn(
                      "w-12 h-12 border-2 transition-all", 
                      isSelected ? "border-primary shadow-md shadow-primary/20 scale-105" : "border-transparent opacity-60 grayscale"
                    )}>
                      <AvatarFallback className="bg-secondary font-bold text-sm">{friend.initial}</AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className={cn("text-[10px] font-medium text-center truncate w-full", !isSelected && "text-muted-foreground")}>
                    {friend.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="mb-3 block text-base font-semibold">Split Method</Label>
          <Tabs defaultValue="equal" value={splitMethod} onValueChange={setSplitMethod} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-secondary/50">
              <TabsTrigger value="equal" className="rounded-lg">Equal</TabsTrigger>
              <TabsTrigger value="custom" className="rounded-lg">Custom</TabsTrigger>
              <TabsTrigger value="percent" className="rounded-lg">%</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={splitMethod}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                {splitMethod === "equal" && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-col items-center justify-center py-6">
                      <div className="text-3xl font-bold font-mono text-primary">₹{equalShare.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-1">per person ({selectedFriends.length} people)</div>
                    </CardContent>
                  </Card>
                )}
                
                {splitMethod === "custom" && (
                  <div className="space-y-3">
                    {selectedFriends.map((id) => {
                      const f = FRIENDS.find(x => x.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-secondary">{f?.initial}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{f?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹</span>
                            <Input 
                              type="number" 
                              className="w-20 h-8 text-right bg-secondary/50 border-none font-mono" 
                              value={customAmounts[id] !== undefined ? customAmounts[id] : ""}
                              onChange={(e) => handleCustomAmountChange(id, e.target.value)}
                              placeholder={equalShare.toFixed(2)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>

        <Button 
          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          disabled={!expenseName || !amount || selectedFriends.length === 0}
          onClick={handleSave}
        >
          Save Expense
        </Button>
      </div>
    </PageTransition>
  );
}
