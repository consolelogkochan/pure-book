import type { ReactNode } from 'react';

// 「型（Type）」として定義します
interface ButtonProps {
  children: ReactNode;  // ボタン内のテキスト
  colorClass?: string;  // ボタンの色（? は「指定されなくてもOK」の意味）
  onClick?: () => void; // 押した時の処理
  type?: 'button' | 'submit' | 'reset'; // ボタンの種類
  disabled?: boolean;                   // 無効化フラグ
}

export const Button = ({ 
  children, 
  colorClass = 'bg-blue-600 hover:bg-blue-700', // 色の指定がない場合のデフォルト値
  onClick,
  type = 'button',     // ▼ デフォルトは 'button'（他画面への影響なし）
  disabled = false     // ▼ デフォルトは false（押せる状態） 
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      // Tailwindのクラスを組み合わせて、ベースの形＋外から来た色 を合体させます
      className={`text-white font-bold py-2 px-4 rounded-md transition duration-200 ${colorClass}`}
    >
      {children}
    </button>
  );
};