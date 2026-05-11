import { AdminLayout } from '../layouts/AdminLayout';
import { SearchForm } from '../components/admin/SearchForm';
import { BookingTable } from '../components/admin/BookingTable';
import { Pagination } from '../components/admin/Pagination';
import { useAdminSearch } from '../hooks/useAdminSearch';

export const AdminSearch = () => {
  const {
    form,
    displayResults,
    menus,
    isLoading,
    pagination,
    onSubmit,
    handleDownloadCsv,
    handleStatusChange,
    handlePageChange,
  } = useAdminSearch();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SearchForm
          form={form}
          menus={menus}
          isLoading={isLoading}
          onSubmit={onSubmit}
          onDownloadCsv={handleDownloadCsv}
        />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <BookingTable
            results={displayResults}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
          />
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
};
