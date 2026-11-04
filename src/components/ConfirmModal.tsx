import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  unansweredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  unansweredCount,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Chưa hoàn thành câu hỏi!
        </h3>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Bạn còn <strong className="text-rose-500 font-bold">{unansweredCount}</strong> câu chưa trả lời. Bạn có chắc chắn muốn xem tổng kết kết quả ngay bây giờ không?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Làm tiếp
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5d5fef] to-[#7c3aed] hover:from-[#4f51e0] hover:to-[#6d28d9] shadow-md shadow-indigo-500/20 transition-all"
          >
            Tổng kết ngay
          </button>
        </div>
      </div>
    </div>
  );
};

