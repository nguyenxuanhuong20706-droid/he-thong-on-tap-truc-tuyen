import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  api,
  type QuizAttemptHistoryItem,
  type QuizAttemptDetailResponse,
} from '../services/api';

interface HistoryViewProps {
  onBack?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = () => {
  const [history, setHistory] = useState<QuizAttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Attempt detail modal for review
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getQuizHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải lịch sử làm bài');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.deleteQuizHistory();
      setHistory([]);
      setIsConfirmDeleteOpen(false);
      setSuccessMsg(res.message || 'Đã xóa sạch toàn bộ lịch sử thi khỏi hệ thống!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa lịch sử làm bài');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (attemptId: string) => {
    try {
      setIsLoadingDetail(true);
      setError(null);
      const detail = await api.getQuizAttemptDetail(attemptId);
      setSelectedAttempt(detail);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải chi tiết bài làm');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn text-left">
      {/* Top Controls: Nút xóa lịch sử (Bỏ nút về danh sách theo hình 1) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lịch Sử Làm Bài
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bấm vào từng bài để xem lại chi tiết câu đúng, câu sai và câu chưa làm
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Xóa toàn bộ lịch sử thi khỏi hệ thống và giao diện"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Xóa lịch sử</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-center justify-between animate-fadeIn">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải lịch sử làm bài...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-base">Chưa có lượt làm bài nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Lịch sử đã được dọn sạch hoặc bạn chưa làm bài thi nào.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item.id)}
              className="group bg-white rounded-2xl p-5 shadow-sm border border-purple-100 hover:border-purple-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-1.5 flex-1">
                {/* Hình 3: Hiển thị định dạng: Tên môn — Bài ... */}
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                  {item.subjectTitle} — {item.lessonTitle}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.correctCount} Đúng
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                    <XCircle className="w-3.5 h-3.5" /> {item.wrongCount} Sai
                  </span>
                  {item.unansweredCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      <AlertTriangle className="w-3.5 h-3.5" /> {item.unansweredCount} Chưa làm
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {item.timeSpentSeconds}s
                  </span>
                  <span className="text-slate-400">
                    • {new Date(item.completedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-700">
                    {item.score} <span className="text-xs font-semibold text-slate-400">/ 10</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {Math.round((item.correctCount / (item.totalQuestions || 1)) * 100)}% chính xác
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-600 group-hover:text-white text-purple-700 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL: CONFIRM DELETE ALL HISTORY ==================== */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 animate-scaleUp text-left">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h4 className="font-extrabold text-slate-900 text-lg">
                Xác nhận xóa lịch sử làm bài
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn <strong>xóa sạch toàn bộ lịch sử thi</strong> khỏi hệ thống và giao diện?
              Hành động này sẽ xóa vĩnh viễn dữ liệu điểm số và bài thi của bạn khỏi Database.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleClearHistory}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: REVIEW ATTEMPT DETAIL ==================== */}
      {(selectedAttempt || isLoadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-scaleUp text-left">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full uppercase">
                  Chi tiết bài làm
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-1">
                  {selectedAttempt?.subjectTitle} — {selectedAttempt?.lessonTitle}
                </h3>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Bar */}
            {selectedAttempt && (
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    ✅ {selectedAttempt.correctCount} Đúng
                  </span>
                  <span className="text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                    ❌ {selectedAttempt.wrongCount} Sai
                  </span>
                  {selectedAttempt.unansweredCount > 0 && (
                    <span className="text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                      ⚠️ {selectedAttempt.unansweredCount} Chưa làm
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-purple-900">
                  Điểm số: {selectedAttempt.score} / 10 ({Math.round((selectedAttempt.correctCount / selectedAttempt.totalQuestions) * 100)}%)
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isLoadingDetail ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Đang tải chi tiết các câu hỏi...</p>
                </div>
              ) : selectedAttempt ? (
                selectedAttempt.answers.map((ans, idx) => {
                  const hasAnswered = Boolean(ans.selectedKey);
                  return (
                    <div
                      key={ans.questionId}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                          Câu {idx + 1}
                        </span>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            !hasAnswered
                              ? 'bg-amber-100 text-amber-800'
                              : ans.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {!hasAnswered
                            ? 'Chưa làm'
                            : ans.isCorrect
                            ? 'Đúng'
                            : `Sai (Đáp án: ${ans.correctKey})`}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed">
                        {ans.content.replace(/^(?:câu|question|bài)\s*\d+[:.]\s*/i, '')}
                      </p>

                      <div className="space-y-2 pt-1">
                        {ans.options.map((opt) => {
                          const isUserPicked = ans.selectedKey === opt.key;
                          const isRight = opt.isCorrect || opt.key === ans.correctKey;

                          let optClass = 'border-slate-200 bg-white text-slate-700';
                          let tag = null;

                          if (isUserPicked) {
                            if (ans.isCorrect) {
                              optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                              tag = <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Bạn chọn đúng</span>;
                            } else {
                              optClass = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                              tag = <span className="ml-auto text-xs font-bold text-rose-700 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Bạn chọn sai</span>;
                            }
                          } else if (isRight) {
                            optClass = 'border-emerald-400 bg-emerald-50/60 text-emerald-900 font-semibold';
                            tag = <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Đáp án đúng</span>;
                          } else {
                            optClass = 'border-slate-100 bg-slate-50/40 text-slate-400 opacity-60';
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`p-3 rounded-xl border flex items-center gap-3 text-xs sm:text-sm ${optClass}`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isUserPicked || isRight ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {opt.key}
                              </div>
                              <span className="flex-1">{opt.text}</span>
                              {tag}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Đóng xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
