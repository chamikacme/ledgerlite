import { getCategories } from "@/app/actions/categories";
import { CategoriesList } from "@/components/categories-list";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { PageHeader } from "@/components/page-header";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Categories"
        action={<CreateCategoryDialog />}
      />

      <CategoriesList categories={categories} />
    </div>
  );
}
