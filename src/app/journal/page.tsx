import { getJournalEntries } from "@/app/actions/journal";
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Journal (Audit Log)</h1>
      <div className="rounded-md border bg-card">
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
                <TableCell>{format(entry.date, "PPP")}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.accountName}</TableCell>
                <TableCell className="text-right">
                  {entry.type === "debit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : ""}
                </TableCell>
                <TableCell className="text-right">
                  {entry.type === "credit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
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
