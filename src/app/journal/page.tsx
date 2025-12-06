import { getJournalEntries } from "@/app/actions/journal";
import { getUserSettings } from "@/app/actions/accounts";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function JournalPage() {
  const entries = await getJournalEntries();
  const settings = await getUserSettings();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Journal (Audit Log)" />
      
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{format(entry.date, "PPP")}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.accountName}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {entry.type === "debit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: settings?.currency || "LKR",
                      })
                    : ""}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {entry.type === "credit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: settings?.currency || "LKR",
                      })
                    : ""}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No journal entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
