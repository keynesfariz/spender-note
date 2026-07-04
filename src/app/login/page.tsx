'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Budget Manager</CardTitle>
          <CardDescription>
            Sign in with Google to sync your bank notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
