"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportData, importData } from "@/app/actions/backup";
import { toast } from "sonner";
import { Download, Upload, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DataManagement() {
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgerlite-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportOpen(true);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      await importData(json);
      toast.success("Data restored successfully");
      setImportOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Reload to reflect changes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore data. Invalid file format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Backup your data to a JSON file or restore from a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExport} disabled={loading} variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <div className="flex-1">
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>
        </div>

        <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Warning: Irreversible Action
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will <strong>permanently delete all your current data</strong> (transactions, accounts, settings, etc.) and replace it with the data from the backup file. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport} className="bg-destructive hover:bg-destructive/90">
                {loading ? "Restoring..." : "Yes, Restore Data"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
