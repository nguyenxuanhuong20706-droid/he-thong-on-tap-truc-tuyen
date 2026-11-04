import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { LessonCard } from './components/LessonCard';
import { QuestionCard } from './components/QuestionCard';
import { ResultModal } from './components/ResultModal';
import { ConfirmModal } from './components/ConfirmModal';
import { lessons } from './data/lessons';
import { questions } from './data/questions';
import type { OptionKey, QuizResult } from './types/quiz';
import { BarChart3, CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'quiz'>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('bai-1');
  const [userAnswers, setUserAnswers] = useState<Record<number, OptionKey>>({});
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active lesson
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  }, [selectedLessonId]);

  // Questions for current lesson
  const currentQuestions = useMemo(() => {
    return questions.filter((q) => q.lessonId === selectedLessonId);
  }, [selectedLessonId]);

  // Quiz statistics
  const result: QuizResult = useMemo(() => {
    let correct = 0;
    let wrong = 0;

    currentQuestions.forEach((q) => {
      const answer = userAnswers[q.id];
      if (answer) {
        if (answer === q.correctAnswer) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });

    const total = currentQuestions.length;
    const unanswered = total - (correct + wrong);
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      totalQuestions: total,
      percentage,
    };
  }, [currentQuestions, userAnswers]);

  // Handle selecting an option
  const handleSelectOption = (questionId: number, optionKey: OptionKey) => {
    setUserAnswers((prev) => {
      // Prevent overwriting if already answered
      if (prev[questionId]) return prev;
      return {
        ...prev,
        [questionId]: optionKey,
      };
    });
  };

  // Trigger summary
  const handleTriggerSummary = () => {
    if (result.unansweredCount > 0) {
      setIsConfirmOpen(true);
    } else {
      setIsResultOpen(true);
    }
  };

  // Reset quiz
  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsResultOpen(false);
    setIsConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate home
  const handleGoHome = () => {
    setIsResultOpen(false);
    setIsConfirmOpen(false);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select lesson
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setUserAnswers({});
    setCurrentView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show toast for coming soon
  const handleComingSoon = () => {
    setToastMessage('Nội dung bài học đang được cập nhật!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {currentView === 'home' ? (
          // ================= TRANG CHỦ =================
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Header
              title="Ôn tập Lịch sử Đảng Cộng sản Việt Nam"
              subtitle="Chọn bài để bắt đầu ôn tập"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onSelect={handleSelectLesson}
                  onComingSoon={handleComingSoon}
                />
              ))}
            </div>
          </div>
        ) : (
          // ================= TRANG LUYỆN TẬP =================
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Header
              title={`Bài ${currentLesson.number} — ${currentLesson.title}`}
              badge={`${currentQuestions.length} câu hỏi trắc nghiệm`}
              showBack={true}
              onBack={handleGoHome}
            />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question List (Left) */}
              <div className="lg:col-span-8 space-y-6">
                {currentQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    selectedOption={userAnswers[question.id] || null}
                    onSelectOption={handleSelectOption}
                  />
                ))}
              </div>

              {/* Sidebar Action (Right) */}
              <div className="lg:col-span-4 sticky top-6 z-10 space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
                  {/* Summary Button matching Image 2 */}
                  <button
                    type="button"
                    onClick={handleTriggerSummary}
                    className="w-full bg-gradient-to-r from-[#5d5fef] to-[#7c3aed] hover:from-[#4f51e0] hover:to-[#6d28d9] active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                    <span>Tổng kết kết quả</span>
                  </button>

                  {/* Progress summary info */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>
                        Đã làm:{' '}
                        <strong className="text-slate-800">
                          {result.totalQuestions - result.unansweredCount}
                        </strong>{' '}
                        / {result.totalQuestions}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                      title="Làm lại từ đầu"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Làm lại</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        unansweredCount={result.unansweredCount}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          setIsResultOpen(true);
        }}
      />

      {/* Result Modal */}
      <ResultModal
        isOpen={isResultOpen}
        result={result}
        onHome={handleGoHome}
        onRetry={handleResetQuiz}
      />
    </div>
  );
}
