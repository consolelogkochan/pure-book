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
    isSaving,
    isDownloading,
    pagination,
    message,
    messageType,
    onSubmit,
    handleDownloadCsv,
    handleStatusChange,
    handlePageChange,
  } = useAdminSearch();

  return (
    <AdminLayout>
      <div className="space-y-6">

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <SearchForm
          form={form}
          menus={menus}
          isLoading={isLoading}
          isDownloading={isDownloading}
          onSubmit={onSubmit}
          onDownloadCsv={handleDownloadCsv}
        />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <BookingTable
            results={displayResults}
            isLoading={isLoading}
            isSaving={isSaving}
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
