import type { ReactNode } from 'react';

// 伊崎さんの推論を「型（Type）」として定義します
interface ButtonProps {
  children: ReactNode;  // 推論1: ボタン内のテキスト
  colorClass?: string;  // 推論2: ボタンの色（? は「指定されなくてもOK」の意味）
  onClick?: () => void; // 推論3: 押した時の処理
}

export const Button = ({ 
  children, 
  colorClass = 'bg-blue-600 hover:bg-blue-700', // 色の指定がない場合のデフォルト値
  onClick 
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      // Tailwindのクラスを組み合わせて、ベースの形＋外から来た色 を合体させます
      className={`text-white font-bold py-2 px-4 rounded-md transition duration-200 ${colorClass}`}
    >
      {children}
    </button>
  );
};