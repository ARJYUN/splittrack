"use client";

import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Coffee, Pizza, Car, Wallet, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppContext, Transaction } from "@/context/AppContext";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const { history } = useAppContext();

  const getIcon = (t: Transaction) => {
    if (t.type === 'payment') return Wallet;
    if (t.title.toLowerCase().includes('tea')) return Coffee;
    if (t.title.toLowerCase().includes('pizza')) return Pizza;
    if (t.title.toLowerCase().includes('cab')) return Car;
    return Receipt;
  };

  return (
    <PageTransition>
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <div className="p-2 bg-secondary rounded-full cursor-pointer">
          <Filter size={18} className="text-foreground" />
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search transactions..." 
          className="pl-10 h-12 bg-card border-none shadow-sm rounded-xl"
        />
      </div>

      <div className="space-y-3 pb-4">
        {history.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No recent activity.</div>
        ) : (
          history.map((item) => {
            const Icon = getIcon(item);
            return (
              <Card key={item.id} className="border-none shadow-sm bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      item.type === 'payment' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                    )}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      </div>
                      <div className="flex -space-x-2 mt-2">
                        {item.participants.map((p, i) => (
                          <Avatar key={i} className="w-5 h-5 border-2 border-card">
                            <AvatarFallback className="text-[8px] bg-secondary font-bold">{p}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "font-bold",
                      item.type === 'payment' ? 'text-success' : 'text-foreground'
                    )}>
                      ₹{item.amount}
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5 py-0 h-4 border-none mt-1 font-bold",
                      item.type === 'payment' ? 'bg-success/10 text-success' : 'bg-secondary text-secondary-foreground'
                    )}>
                      {item.type === 'payment' ? 'Settled' : 'Split'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}

