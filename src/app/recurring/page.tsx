import { getRecurringTransactions } from "@/app/actions/recurring";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { RecurringPageClient } from "@/components/recurring-page-client";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RecurringPage(props: Props) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  const search = (searchParams.search as string) || "";
  const sortBy = (searchParams.sortBy as string) || "createdAt";
  const sortOrder = (searchParams.sortOrder as "asc" | "desc") || "desc";

  const { data: recurringTransactions, meta } = await getRecurringTransactions(page, pageSize, search, sortBy, sortOrder);
  const accounts = await getAccounts();
  const categories = await getCategories();

  return (
    <RecurringPageClient
      recurringTransactions={recurringTransactions}
      accounts={accounts}
      categories={categories}
      meta={meta}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
