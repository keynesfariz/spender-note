import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { budgetSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { saveSettings } from './actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const existingSettings = await db.select().from(budgetSettings).where(eq(budgetSettings.userId, user.id)).limit(1)
  const setting = existingSettings[0]

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget & Sync Settings</CardTitle>
          <CardDescription>
            Configure your monthly budget limits and how we find your bank emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">Monthly Budget Amount ($)</Label>
              <Input 
                id="monthlyAmount" 
                name="monthlyAmount" 
                type="number" 
                step="0.01" 
                required 
                defaultValue={setting?.monthlyAmount ? parseFloat(setting.monthlyAmount) : ''} 
                placeholder="e.g. 2000.00" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resetDayOfMonth">Reset Day of Month</Label>
              <Input 
                id="resetDayOfMonth" 
                name="resetDayOfMonth" 
                type="number" 
                min="1" 
                max="31" 
                required 
                defaultValue={setting?.resetDayOfMonth || 1} 
              />
              <p className="text-xs text-muted-foreground">The day of the month when your budget resets (e.g. 1 for the 1st).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderEmailFilter">Bank Notification Sender Email</Label>
              <Input 
                id="senderEmailFilter" 
                name="senderEmailFilter" 
                type="text" 
                required 
                defaultValue={setting?.senderEmailFilter || ''} 
                placeholder="e.g. alerts@chase.com" 
              />
              <p className="text-xs text-muted-foreground">We will only scan emails from this sender address for transactions.</p>
            </div>

            <Button type="submit" className="w-full">Save Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="POST">
            <Button variant="destructive" type="submit">Sign Out</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
