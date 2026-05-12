import { useBookingSearch } from '../hooks/useBookingSearch';
import { SearchForm } from '../components/booking/SearchForm';
import { BookingResultCard } from '../components/booking/BookingResultCard';
import { CancelModal } from '../components/booking/CancelModal';
import { CancelCompleteView } from '../components/booking/CancelCompleteView';

export const BookingSearch = () => {
  const {
    form,
    searchResult,
    showPayment,
    isModalOpen,
    isCancelled,
    isSearching,
    errorMessage,
    onSearch,
    handleCancel,
    handlePaymentSuccess,
    openPaymentForm,
    closePaymentForm,
    openCancelModal,
    closeCancelModal,
  } = useBookingSearch();

  if (isCancelled) {
    return <CancelCompleteView />;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-8 relative">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">予約の確認・キャンセル</h2>

      <SearchForm
        form={form}
        isSearching={isSearching}
        onSearch={onSearch}
      />

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {searchResult && (
        <BookingResultCard
          booking={searchResult}
          showPayment={showPayment}
          onShowPayment={openPaymentForm}
          onHidePayment={closePaymentForm}
          onPaymentSuccess={handlePaymentSuccess}
          onCancelRequest={openCancelModal}
        />
      )}

      {isModalOpen && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={closeCancelModal}
        />
      )}
    </div>
  );
};
