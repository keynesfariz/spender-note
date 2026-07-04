'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  amount: {
    label: "Amount ($)",
    color: "hsl(var(--primary))",
  },
}

export function ExpensesChart({ transactions }: { transactions: { category: string; amount: string; type: string }[] }) {
  // Aggregate expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const amt = parseFloat(t.amount)
      if (!acc[t.category]) {
        acc[t.category] = 0
      }
      acc[t.category] += amt
      return acc
    }, {} as Record<string, number>)

  const data = Object.keys(expensesByCategory).map(category => ({
    category,
    amount: expensesByCategory[category],
  })).sort((a, b) => b.amount - a.amount)

  if (data.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No expense data to chart.</div>
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full mt-4">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="category" 
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `$${value}`} 
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
