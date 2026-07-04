'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { addWallet } from './actions';

export function AddWalletForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('debit');

  const handleSubmit = async (formData: FormData) => {
    formData.set('type', type);
    await addWallet(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Wallet
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Wallet</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="label">Wallet Name</Label>
            <Input
              id="label"
              name="label"
              required
              placeholder="e.g. Chase Checking"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value || 'debit')}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit / Checking</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">
              {type === 'credit' ? 'Current Debt Balance' : 'Current Balance'}
            </Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              step="0.01"
              required
              defaultValue="0"
            />
          </div>

          {type === 'credit' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  name="creditLimit"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statementDayOfMonth">
                  Statement Day of Month
                </Label>
                <Input
                  id="statementDayOfMonth"
                  name="statementDayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            Create Wallet
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
