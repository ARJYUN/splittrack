"use client";

import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const SPENDING_DATA = [
  { name: "Jan", amount: 1200 },
  { name: "Feb", amount: 1900 },
  { name: "Mar", amount: 800 },
  { name: "Apr", amount: 2400 },
  { name: "May", amount: 1600 },
  { name: "Jun", amount: 3200 },
];

export default function StatsPage() {
  return (
    <PageTransition>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your spending overview</p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
            <div className="text-xl font-bold">₹11,100</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Recovered</div>
            <div className="text-xl font-bold text-success">₹8,450</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPENDING_DATA}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{ fill: 'var(--secondary)' }} 
                  contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="amount" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm mb-20">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-medium">Food & Dining</span>
            </div>
            <span className="text-sm font-bold">₹4,200</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm font-medium">Travel</span>
            </div>
            <span className="text-sm font-bold">₹2,800</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm font-medium">Entertainment</span>
            </div>
            <span className="text-sm font-bold">₹1,500</span>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
