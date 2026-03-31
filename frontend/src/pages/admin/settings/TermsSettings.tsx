import { Button } from '../../../components/Button';

export const TermsSettings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">規約・キャンセルポリシー設定</h2>
      <textarea className="w-full border rounded px-4 py-3 h-48 resize-y" defaultValue={"1. キャンセルは24時間前まで..."} />
      
      <Button colorClass="bg-slate-800 hover:bg-slate-700 py-3 px-8 shadow-sm">
        規約を保存する
      </Button>
    </div>
  );
};