import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

import type { Metadata } from 'next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { getAvailableParsers } from '@/lib/parsers/registry';
import { PageLayout } from '@/components/PageLayout';
import { createClient } from '@/lib/supabase/server';
import { Checkbox } from '@/components/ui/checkbox';
import { customParserFlag } from '@/lib/flags';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { budgetSettings } from '@/db/schema';
import { saveSettings } from './actions';
import { db } from '@/db';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const existingSettings = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, user.id))
    .limit(1);
  const setting = existingSettings[0];

  const availableParsers = await getAvailableParsers(user.id);
  const activeParsers = setting?.activeParsers || [];

  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country') || 'US';
  const countryCurrencyMap: Record<string, string> = {
    US: 'USD',
    ID: 'IDR',
    GB: 'GBP',
    EU: 'EUR', // Note: EU isn't a country code, but some proxies might use it. DE, FR, IT etc use EUR.
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    NL: 'EUR',
    JP: 'JPY',
    SG: 'SGD',
    AU: 'AUD',
  };
  const inferredCurrency = countryCurrencyMap[country] || 'USD';
  const currentCurrency = setting?.currency || inferredCurrency;
  const parserMode = process.env.PARSER_MODE || 'regex';

  const formKey = setting
    ? `${setting.monthlyAmount}-${setting.resetDayOfMonth}-${currentCurrency}-${activeParsers.join(',')}-${setting.aiCustomEmails?.join(',')}`
    : 'new';

  const showCustomParser = await customParserFlag();

  return (
    <PageLayout
      metadata={metadata}
      actions={
        showCustomParser ? (
          <Link
            href="/settings/parsers/new"
            className={buttonVariants({ variant: 'default' })}>
            Create Custom Parser
          </Link>
        ) : undefined
      }>
      <Card>
        <CardHeader>
          <CardTitle>Budget & Sync Settings</CardTitle>
          <CardDescription>
            Configure your monthly budget limits and how we find your bank
            emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={formKey} action={saveSettings} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={currentCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="IDR">IDR (Rp)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="SGD">SGD (S$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">
                Monthly Budget Amount ({currentCurrency})
              </Label>
              <Input
                id="monthlyAmount"
                name="monthlyAmount"
                type="number"
                step="0.01"
                required
                defaultValue={
                  setting?.monthlyAmount
                    ? parseFloat(setting.monthlyAmount)
                    : ''
                }
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
              <p className="text-muted-foreground text-xs">
                The day of the month when your budget resets (e.g. 1 for the
                1st).
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Active Bank Parsers</Label>
                {parserMode === 'ai' && (
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    AI Mode Enabled
                  </span>
                )}
              </div>

              {parserMode === 'ai' && (
                <div className="border-primary/20 bg-primary/5 text-primary rounded-md border p-4 text-sm">
                  AI Parser is currently active. Supported emails will be
                  processed using AI.
                </div>
              )}

              <div className="bg-muted/20 space-y-2 rounded-md border p-4">
                {availableParsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No custom parsers available yet.
                  </p>
                ) : (
                  availableParsers.map((parser) => (
                    <div
                      key={parser.id}
                      className="flex items-center space-x-2">
                      <Checkbox
                        id={`parser-${parser.id}`}
                        name="activeParsers"
                        value={parser.id}
                        defaultChecked={activeParsers.includes(parser.id!)}
                      />
                      <label
                        htmlFor={`parser-${parser.id}`}
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {parser.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Select the banks you want to automatically sync transactions
                from. We will scan emails from their respective notification
                addresses.
              </p>

              {parserMode === 'ai' && (
                <div className="mt-6 space-y-2">
                  <Label htmlFor="aiCustomEmails">
                    Custom AI Email Targets
                  </Label>
                  <Input
                    id="aiCustomEmails"
                    name="aiCustomEmails"
                    placeholder="alerts@bank.com, info@wallet.com"
                    defaultValue={(setting?.aiCustomEmails || []).join(', ')}
                  />
                  <p className="text-muted-foreground text-xs">
                    Enter a comma-separated list of additional email addresses
                    for the AI to parse.
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
