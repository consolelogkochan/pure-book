import { Button } from '../Button';
import type { PaginationInfo } from '../../types';

interface Props {
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ pagination, onPageChange }: Props) => {
  if (!pagination || pagination.last_page <= 1) return null;

  return (
    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
      <div className="text-sm text-slate-600 font-bold">
        全 {pagination.total} 件中 {pagination.current_page} ページ目
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(pagination.current_page - 1)}
          disabled={pagination.current_page === 1}
          colorClass="bg-blue-500 border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          前へ
        </Button>
        <Button
          onClick={() => onPageChange(pagination.current_page + 1)}
          disabled={pagination.current_page === pagination.last_page}
          colorClass="bg-blue-500 border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          次へ
        </Button>
      </div>
    </div>
  );
};
