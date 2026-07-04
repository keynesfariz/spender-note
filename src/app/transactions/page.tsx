import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { transactions, wallets } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userTransactions = await db.select({
    id: transactions.id,
    amount: transactions.amount,
    type: transactions.type,
    category: transactions.category,
    date: transactions.date,
    remark: transactions.remark,
    walletLabel: wallets.label,
  })
    .from(transactions)
    .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date))
    .limit(100)

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Recent Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Remark / Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions found. Sync from your dashboard to get started.
                  </TableCell>
                </TableRow>
              ) : (
                userTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{tx.remark || 'N/A'}</TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell>{tx.walletLabel || 'Unknown'}</TableCell>
                    <TableCell className="text-right flex items-center justify-end font-semibold">
                      {tx.type === 'expense' ? (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                          ${parseFloat(tx.amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                          ${parseFloat(tx.amount).toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
