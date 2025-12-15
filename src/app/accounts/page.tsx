import { getPaginatedAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { AccountsList } from "@/components/accounts-list";
import { CreateAccountDialog } from "@/components/create-account-dialog";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AccountsPage(props: Props) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const search = (searchParams.search as string) || "";
  const sortBy = (searchParams.sortBy as string) || "updatedAt";
  const sortOrder = (searchParams.sortOrder as "asc" | "desc") || "desc";

  const { data: accounts, meta } = await getPaginatedAccounts(page, pageSize, search, sortBy, sortOrder);
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts and credit cards"
        action={<CreateAccountDialog categories={categories} />}
      />

      <AccountsList 
        accounts={accounts} 
        categories={categories} 
        meta={meta}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}
