'use client';

import { LogIn } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
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
    });
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Budget Manager</CardTitle>
          <CardDescription>
            Sign in with Google to sync your bank notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin}>
            <LogIn className="mr-2 size-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
