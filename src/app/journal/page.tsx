import { getJournalEntries } from "@/app/actions/journal";
import { PageHeader } from "@/components/page-header";
import { JournalList } from "@/components/journal-list";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function JournalPage(props: Props) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const search = (searchParams.search as string) || "";
  const from = searchParams.from ? new Date(searchParams.from as string) : undefined;
  const to = searchParams.to ? new Date(searchParams.to as string) : undefined;
  const sortBy = (searchParams.sortBy as string) || "date";
  const sortOrder = (searchParams.sortOrder as "asc" | "desc") || "desc";

  const { data: entries, meta } = await getJournalEntries(
       page,
       pageSize,
       search,
       from,
       to,
       sortBy,
       sortOrder
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Journal (Audit Log)" />
      
      <JournalList 
        entries={entries}
        meta={meta}
        search={search}
        from={from}
        to={to}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}

