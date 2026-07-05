import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

function getSafeRedirect(path: string | null): string {
  if (!path) return '/';

  try {
    // If it's an absolute URL or protocol-relative (e.g. //evil.com),
    // URL will parse it relative to the dummy base, but it will change the host/origin.
    const url = new URL(path, 'http://localhost');
    if (url.origin !== 'http://localhost') {
      return '/';
    }
  } catch {
    return '/';
  }

  // Ensure it starts with a single '/' and not '//' or '/\'
  if (
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/\\')
  ) {
    return path;
  }

  return '/';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL (validated for open redirects)
  const next = getSafeRedirect(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
