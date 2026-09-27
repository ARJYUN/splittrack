"use client";

import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";



import { useAppContext } from "@/context/AppContext";

export default function StatsPage() {
  const { history } = useAppContext();

  const totalSpent = history.filter(h => h.type === "expense").reduce((sum, h) => sum + h.amount, 0);
  const totalRecovered = history.filter(h => h.type === "payment").reduce((sum, h) => sum + h.amount, 0);

  // Group by month
  const monthlyData: Record<string, number> = {};
  history.filter(h => h.type === "expense").forEach(h => {
    const month = new Date(h.date).toLocaleString('default', { month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + h.amount;
  });

  const chartData = Object.keys(monthlyData).length > 0 
    ? Object.entries(monthlyData).map(([name, amount]) => ({ name, amount }))
    : [{ name: "No data", amount: 0 }];

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
            <div className="text-xl font-bold">₹{totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Recovered</div>
            <div className="text-xl font-bold text-success">₹{totalRecovered.toFixed(2)}</div>
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
              <BarChart data={chartData}>
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
          {totalSpent === 0 ? (
            <div className="text-sm text-muted-foreground">No spending yet.</div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">General Expenses</span>
              </div>
              <span className="text-sm font-bold">₹{totalSpent.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
