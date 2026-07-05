'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GeneratedRegexRules } from '@/lib/ai/parser-generator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function NewParserForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  const [sampleEmails, setSampleEmails] = useState<
    { subject: string; body: string; date: string }[]
  >([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);

  const [rules, setRules] = useState<GeneratedRegexRules | null>(null);

  // Fix Regex State
  const [fixingField, setFixingField] = useState<string | null>(null);
  const [expectedValue, setExpectedValue] = useState<string>('');

  const fetchSampleEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !senderEmail) {
      toast.error('Please enter both name and email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parsers/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      setSampleEmails(data.emails);
      setStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRules = async () => {
    const selectedEmail = sampleEmails[selectedEmailIndex];
    if (!selectedEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parsers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBody: selectedEmail.body }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate rules');
      }

      setRules(data.rules);
      setStep(3);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFixRule = async (field: keyof GeneratedRegexRules) => {
    if (!expectedValue) return;

    const selectedEmail = sampleEmails[selectedEmailIndex];

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parsers/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailBody: selectedEmail.body,
          field,
          expectedValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fix rule');
      }

      setRules((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: data.regex };
      });

      setFixingField(null);
      setExpectedValue('');
      toast.success('Rule updated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!rules) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parsers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          senderEmail,
          regexRules: rules,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save parser');
      }

      toast.success('Parser created successfully');
      router.push('/settings');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract value using current regex
  const testExtraction = (regexStr: string | null): string => {
    if (!regexStr) return 'N/A';
    try {
      const selectedEmail = sampleEmails[selectedEmailIndex];
      const match = selectedEmail.body.match(new RegExp(regexStr, 'i'));
      return match ? match[1] || match[0] : 'Not found';
    } catch {
      return 'Invalid Regex';
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step Indicators */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {s}
            </div>
            {s < 3 && (
              <div
                className={`ml-4 h-1 w-12 ${step > s ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>
              Enter the basic details for your custom bank parser.
            </CardDescription>
          </CardHeader>
          <form onSubmit={fetchSampleEmails}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Parser Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Bank Parser"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Bank Sender Email</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. alerts@bank.com"
                  required
                />
                <p className="text-muted-foreground text-xs">
                  We will fetch the latest emails from this sender to use as
                  samples.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Fetch Sample Emails
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Sample Email</CardTitle>
            <CardDescription>
              Choose an email to use as the template for the AI to learn from.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {sampleEmails.map((email, idx) => (
                <div
                  key={idx}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${selectedEmailIndex === idx ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedEmailIndex(idx)}>
                  <div className="font-medium">{email.subject}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(email.date).toLocaleString()}
                  </div>
                  <div className="bg-muted/30 text-muted-foreground mt-2 max-h-32 overflow-y-auto rounded p-2 font-mono text-sm whitespace-pre-wrap">
                    {email.body}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={generateRules} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate AI Rules
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && rules && (
        <Card>
          <CardHeader>
            <CardTitle>Review Extracted Data</CardTitle>
            <CardDescription>
              Verify that the AI correctly extracted the required fields. If a
              field is wrong, click Fix.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {Object.entries(rules).map(([key, regexStr]) => (
                <div key={key} className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold capitalize">{key}</Label>
                    {fixingField !== key ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFixingField(key)}>
                        Fix Error
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFixingField(null)}>
                        Cancel
                      </Button>
                    )}
                  </div>

                  {fixingField === key ? (
                    <div className="mt-2 flex items-center space-x-2">
                      <Input
                        value={expectedValue}
                        onChange={(e) => setExpectedValue(e.target.value)}
                        placeholder="Enter the exact correct text for this field..."
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleFixRule(key as keyof GeneratedRegexRules)
                        }
                        disabled={isSubmitting || !expectedValue}>
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Update Rule'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-md p-2 font-mono text-sm">
                      {testExtraction(regexStr)}
                    </div>
                  )}
                  <div className="text-muted-foreground mt-1 text-xs">
                    Regex: {regexStr || 'None'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Parser
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
