"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { executeShortcut } from "@/app/actions/shortcuts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap } from "lucide-react";

interface Shortcut {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  fromAccount: {
    id: number;
    name: string;
  };
  toAccount: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  } | null;
}

interface QuickTransactionProps {
  shortcuts: Shortcut[];
  onSuccess?: () => void;
}

export function QuickTransaction({ shortcuts, onSuccess }: QuickTransactionProps) {
  const [selectedShortcut, setSelectedShortcut] = useState<Shortcut | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleExecute() {
    if (!selectedShortcut || !amount) {
      toast.error("Please select a shortcut and enter an amount");
      return;
    }

    setLoading(true);
    try {
      await executeShortcut(
        selectedShortcut.id,
        parseFloat(amount),
        description || selectedShortcut.name
      );
      toast.success("Transaction created successfully!");
      setAmount("");
      setDescription("");
      setSelectedShortcut(null);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create transaction");
    } finally {
      setLoading(false);
    }
  }

  if (shortcuts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-10">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No shortcuts yet</p>
            <p className="text-sm">Create shortcuts in the Shortcuts page to quickly create transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedShortcut) {
    return (
      <div className="grid gap-3">
        {shortcuts.map((shortcut) => (
          <Card
            key={shortcut.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedShortcut(shortcut)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{shortcut.icon || "⚡"}</div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{shortcut.name}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 mt-1">
                    <span className="truncate">{shortcut.fromAccount.name}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{shortcut.toAccount.name}</span>
                  </CardDescription>
                  {shortcut.category && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {shortcut.category.name}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{selectedShortcut.icon || "⚡"}</div>
            <div className="flex-1">
              <CardTitle className="text-base">{selectedShortcut.name}</CardTitle>
              <CardDescription className="text-xs flex items-center gap-1 mt-1">
                <span>{selectedShortcut.fromAccount.name}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{selectedShortcut.toAccount.name}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-2xl h-14"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder={selectedShortcut.name}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setSelectedShortcut(null)}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleExecute}
            disabled={loading || !amount}
          >
            {loading ? "Creating..." : "Create Transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
}
