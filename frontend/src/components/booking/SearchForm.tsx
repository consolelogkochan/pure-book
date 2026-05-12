import type { UseFormReturn } from 'react-hook-form';
import type { SearchFormData } from '../../types';

interface Props {
  form: UseFormReturn<SearchFormData>;
  isSearching: boolean;
  onSearch: (data: SearchFormData) => Promise<void>;
}

export const SearchForm = ({ form, isSearching, onSearch }: Props) => {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSearch)} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg border">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">予約照会番号</label>
        <input
          {...register('booking_reference', { required: '予約番号を入力してください' })}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          placeholder="例: BKG-XXXXX"
        />
        {errors.booking_reference && <p className="text-red-500 text-xs mt-1">{errors.booking_reference.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">ご登録メールアドレス</label>
        <input
          {...register('email', { required: 'メールアドレスを入力してください' })}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          placeholder="例: taro@example.com"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className={`w-full py-2 rounded font-bold text-white transition ${
          isSearching ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSearching ? '検索中...' : '予約を検索する'}
      </button>
    </form>
  );
};
