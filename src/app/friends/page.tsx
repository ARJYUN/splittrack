"use client";

import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";

export default function FriendsPage() {
  const { friends, addFriend } = useAppContext();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      addFriend(newFriendName.trim());
      setNewFriendName("");
      setIsAddOpen(false);
    }
  };

  return (
    <PageTransition>
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
            <UserPlus size={18} />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[90%] rounded-xl">
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                placeholder="Friend's Name"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddFriend} className="w-full">Add Friend</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search friends..." 
          className="pl-10 h-12 bg-card border-none shadow-sm rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3 pb-8">
        {filteredFriends.map((friend) => (
          <Link key={friend.id} href={`/friends/${friend.id}`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group bg-card/80 backdrop-blur-sm cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-border/50">
                    <AvatarFallback className={cn(
                      "font-semibold text-white",
                      friend.pending > 0 ? 'bg-destructive/80' : 'bg-success/80'
                    )}>
                      {friend.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{friend.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {friend.expenses.length} expenses
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={cn(
                      "font-bold text-sm",
                      friend.pending > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {friend.pending === 0 ? 'Settled' : `₹${friend.pending}`}
                    </div>
                    {friend.pending > 0 && (
                      <div className="text-[10px] text-muted-foreground">Owes you</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredFriends.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No friends found matching "{search}"
          </div>
        )}
      </div>
    </PageTransition>
  );
}
