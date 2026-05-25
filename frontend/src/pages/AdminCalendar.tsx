import { useRef } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventCreateForm } from '../components/admin/EventCreateForm';
import { EventEditForm } from '../components/admin/EventEditForm';
import { useAdminCalendar } from '../hooks/useAdminCalendar';

export const AdminCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);

  const {
    selectedBooking,
    storeSettings,
    menus,
    hiddenDays,
    isLoading,
    fetchFailed,
    menusFetchFailed,
    fetchEvents,
    handleSelect,
    handleEventClick,
    handleSuccess,
    closeDrawer,
  } = useAdminCalendar({
    refetchEvents: () => calendarRef.current?.getApi().refetchEvents(),
  });

  return (
    <AdminLayout>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">

        <div className="flex-1 p-4 overflow-auto">
          <div className="min-w-200 h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500">カレンダーを読み込み中...</div>
            ) : fetchFailed ? (
              <div className="flex items-center justify-center h-full text-red-500">データの取得に失敗しました。ページを再読み込みしてください。</div>
            ) : storeSettings ? (
              // @ts-expect-error FullCalendar の型定義と React 18 の型の不一致
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                locale="ja"
                allDaySlot={false}
                slotMinTime={storeSettings.open_time}
                slotMaxTime={storeSettings.close_time}
                hiddenDays={hiddenDays}
                events={fetchEvents}
                selectable={true}
                select={handleSelect}
                eventClick={handleEventClick}
                height="100%"
              />
            ) : null}
          </div>
        </div>

        {/* オーバーレイ */}
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            selectedBooking ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={closeDrawer}
        />

        {/* ドロワー */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            selectedBooking ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">
              {selectedBooking?.isNew ? '新規予約の登録' : '予約詳細・編集'}
            </h3>
            <button
              onClick={closeDrawer}
              className="text-slate-400 hover:text-slate-600 transition font-bold"
            >
              ✕ 閉じる
            </button>
          </div>

          {menusFetchFailed && (
            <div className="mx-4 mt-3 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
              メニューの取得に失敗しました。ページを再読み込みしてください。
            </div>
          )}

          {selectedBooking && (
            selectedBooking.isNew
              ? <EventCreateForm selectedBooking={selectedBooking} menus={menus} onSuccess={handleSuccess} />
              : <EventEditForm selectedBooking={selectedBooking} menus={menus} onSuccess={handleSuccess} />
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
