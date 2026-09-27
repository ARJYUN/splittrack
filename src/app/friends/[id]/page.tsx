"use client";

import { PageTransition } from "@/components/PageTransition";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDownToLine, Plus, Coffee, Wallet, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { use } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function FriendDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { friends, settleAll } = useAppContext();
  const router = useRouter();

  const friend = friends.find(f => f.id === id);

  if (!friend) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Friend not found or fully settled up.</p>
        <Button className="mt-4" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const handleSettleUp = () => {
    settleAll(friend.id);
    router.push("/");
  };

  return (
    <PageTransition>
      <header className="mb-6">
        <Link href="/friends" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{friend.initial}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{friend.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline" className={cn(
                "border-none px-2 py-0.5",
                friend.pending > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
              )}>
                Owes ₹{friend.pending}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button 
          className="h-12 rounded-xl shadow-sm bg-success hover:bg-success/90 text-success-foreground"
          disabled={friend.pending === 0}
          onClick={handleSettleUp}
        >
          <ArrowDownToLine className="mr-2" size={18} />
          Settle All
        </Button>
        <Button className="h-12 rounded-xl shadow-sm" variant="outline" onClick={() => router.push("/add")}>
          <Plus className="mr-2" size={18} />
          Add Expense
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ledger History</h2>
        <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground">
          <ArrowRightLeft size={14} className="mr-1" />
          Export
        </Button>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {friend.expenses.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground ml-10">No pending expenses.</div>
        ) : (
          friend.expenses.map((t) => (
            <div key={t.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Coffee size={16} className="text-primary" />
              </div>
              <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border-none shadow-sm bg-card">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="font-bold font-mono text-destructive">
                    +₹{t.amount}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </PageTransition>
  );
}
