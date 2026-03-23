import type { ChangeEvent } from 'react';

interface InputProps {
  label: string;      // 入力欄の上のラベル（「お名前」など）
  type?: string;      // textやemailなど
  value: string;      // 現在入力されている値
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; // 文字が打たれた時の処理
  placeholder?: string; // うっすら表示されるヒント
}

export const Input = ({ label, type = 'text', value, onChange, placeholder }: InputProps) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-blue-500 transition"
      />
    </div>
  );
};