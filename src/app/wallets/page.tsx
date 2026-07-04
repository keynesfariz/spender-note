import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { wallets } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Wallet as WalletIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AddWalletForm } from './add-wallet-form'

export default async function WalletsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userWallets = await db.select().from(wallets).where(eq(wallets.userId, user.id))

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Manage Wallets</h1>
        </div>
        <AddWalletForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userWallets.map(w => (
          <Card key={w.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                {w.type === 'credit' ? <CreditCard className="w-5 h-5 mr-2 text-red-500" /> : <WalletIcon className="w-5 h-5 mr-2 text-green-500" />}
                {w.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(w.balance).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {w.type === 'credit' ? 'Debt Balance' : 'Available Balance'}
              </p>
              {w.type === 'credit' && (
                <div className="mt-4 pt-4 border-t text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span>{w.creditLimit ? `$${parseFloat(w.creditLimit).toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statement Day:</span>
                    <span>{w.statementDayOfMonth || 'N/A'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {userWallets.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            You haven't added any wallets yet. Click the button above to add one.
          </div>
        )}
      </div>
    </div>
  )
}
