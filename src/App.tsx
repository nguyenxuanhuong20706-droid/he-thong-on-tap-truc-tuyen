import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SubjectCard } from './components/SubjectCard';
import { LessonCard } from './components/LessonCard';
import { QuestionCard } from './components/QuestionCard';
import { ResultModal } from './components/ResultModal';
import { ConfirmModal } from './components/ConfirmModal';
import { HistoryView } from './components/HistoryView';
import { AdminPortal } from './components/AdminPortal';
import { AuthView } from './components/AuthView';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  api,
  type SubjectItem,
  type SubjectDetail,
  type LessonDetail,
  type QuizData,
  type QuizSubmitResult,
} from './services/api';
import {
  CheckCircle2,
  Send,
  BookOpen,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<
    'subjects' | 'lessons' | 'quiz' | 'history' | 'admin'
  >('subjects');

  // Subjects & Lessons State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDetail | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);

  // Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);
  const [liveChecks, setLiveChecks] = useState<
    Record<string, { isCorrect: boolean; correctKey: string; explanation: string | null }>
  >({});
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [hasRetriedWrong, setHasRetriedWrong] = useState<boolean>(false);

  // Modals & UI States
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  // Load all subjects when user is authenticated
  const loadSubjects = async () => {
    try {
      setIsLoadingContent(true);
      setErrorMessage(null);
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi tải danh sách môn học');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Khởi tạo danh sách môn và phục hồi bài làm dở (chỉ chạy 1 lần khi tải trang/F5)
  useEffect(() => {
    if (!isAuthenticated) return;
    loadSubjects();

    if (!hasCheckedResume) {
      setHasCheckedResume(true);
      const activeQuizSession = sessionStorage.getItem('ontap_active_quiz');
      if (activeQuizSession) {
        (async () => {
          try {
            const { lessonId, subjectSlug } = JSON.parse(activeQuizSession);
            if (subjectSlug) {
              const subjectDetail = await api.getSubject(subjectSlug);
              setSelectedSubject(subjectDetail);
              const foundLesson = subjectDetail.lessons?.find((l: any) => l.id === lessonId);
              if (foundLesson) setSelectedLesson(foundLesson);
            }
            const activeAttempt = await api.getActiveAttempt(lessonId);
            if (activeAttempt) {
              setQuizData(activeAttempt);
              if (activeAttempt.draftAnswers) {
                setUserAnswers((activeAttempt.draftAnswers as Record<string, string[]>) || {});
              }
              setCurrentView('quiz');
            } else {
              sessionStorage.removeItem('ontap_active_quiz');
            }
          } catch {
            sessionStorage.removeItem('ontap_active_quiz');
          }
        })();
      }
    }
  }, [isAuthenticated, hasCheckedResume]);

  // RBAC & State Guard: Whenever authentication status or user role changes,
  // ensure non-admin users can NEVER remain in or access the admin portal view.
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('subjects');
      setSelectedSubject(null);
      setSelectedLesson(null);
      setQuizData(null);
      setUserAnswers({});
      setQuizResult(null);
      setIsReviewMode(false);
    } else if (user?.role !== 'ADMIN' && currentView === 'admin') {
      setCurrentView('subjects');
    }
  }, [isAuthenticated, user?.role, currentView]);

  const handleLogout = async () => {
    setCurrentView('subjects');
    setSelectedSubject(null);
    setSelectedLesson(null);
    setQuizData(null);
    setUserAnswers({});
    setQuizResult(null);
    setIsReviewMode(false);
    await logout();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. SELECT SUBJECT
  const handleSelectSubject = async (subject: SubjectItem) => {
    if (!subject.hasAccess && user?.role !== 'ADMIN') {
      showToast('Bạn chưa được cấp quyền truy cập môn học này. Vui lòng liên hệ Quản trị viên.');
      return;
    }

    try {
      setIsLoadingContent(true);
      setErrorMessage(null);
      const detail = await api.getSubject(subject.slug);
      setSelectedSubject(detail);
      setCurrentView('lessons');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Lỗi mở môn học');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 2. SELECT LESSON -> START QUIZ (Tận dụng Quiz Randomization Engine)
  const handleSelectLesson = async (lesson: LessonDetail) => {
    if (lesson.status === 'coming_soon' || lesson.questionCount === 0) {
      showToast('Bài học này đang được chuẩn bị câu hỏi, vui lòng chọn bài khác!');
      return;
    }

    try {
      setIsLoadingContent(true);
      setErrorMessage(null);
      // Gọi startQuiz để lấy hoặc phục hồi lượt làm với snapshot xáo trộn
      const data = await api.startQuiz(lesson.id, undefined, false);
      setQuizData(data);
      setSelectedLesson(lesson);

      // Phục hồi draft câu trả lời trực tiếp theo Option UUID
      if (data.draftAnswers) {
        setUserAnswers((data.draftAnswers as Record<string, string[]>) || {});
      } else {
        setUserAnswers({});
      }
      setLiveChecks({});
      setQuizResult(null);
      setIsReviewMode(false);
      setHasRetriedWrong(false);
      setQuizStartTime(Date.now());
      setCurrentView('quiz');

      if (selectedSubject) {
        sessionStorage.setItem(
          'ontap_active_quiz',
          JSON.stringify({ lessonId: lesson.id, subjectSlug: selectedSubject.slug })
        );
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Lỗi tải bài trắc nghiệm');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 3. ANSWER OPTION (Live verification & Autosave Draft to backend bằng Option UUID)
  const handleSelectOption = async (questionId: string, optionId: string, _displayKey?: string) => {
    if (isReviewMode) return;
    const q = quizData?.questions.find((x) => x.id === questionId);
    const isMulti =
      q?.questionType === 'MULTIPLE_CHOICE' ||
      q?.content.toLowerCase().includes('chọn 2 đáp án') ||
      q?.content.toLowerCase().includes('chọn 02 đáp án') ||
      q?.content.toLowerCase().includes('chọn 3 đáp án') ||
      q?.content.toLowerCase().includes('chọn 03 đáp án') ||
      q?.content.toLowerCase().includes('chọn hai đáp');

    let nextIds: string[] = [];
    if (isMulti) {
      const currentIds = userAnswers[questionId] || [];
      if (currentIds.includes(optionId)) {
        // Toggle OFF (deselect)
        nextIds = currentIds.filter((id) => id !== optionId);
      } else {
        // Toggle ON (select)
        nextIds = [...currentIds, optionId];
      }
    } else {
      // Single choice
      nextIds = [optionId];
    }

    setUserAnswers((prev) => {
      if (nextIds.length === 0) {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      }
      return { ...prev, [questionId]: nextIds };
    });

    // Tự động lưu bản nháp câu trả lời vào database bằng Option UUID chuẩn
    if (quizData?.attemptId) {
      api.saveDraftAnswer(quizData.attemptId, questionId, nextIds);
    }

    // Live Instant Feedback:
    if (quizData?.lesson?.id) {
      const targetCount =
        (q?.metadata as any)?.targetCount ||
        (q?.content.toLowerCase().includes('chọn 3') || q?.content.toLowerCase().includes('chọn 03')
          ? 3
          : 2);

      if (isMulti) {
        // Khi người học chọn đủ số lượng yêu cầu (targetCount) thì tự động chấm ngay lập tức
        if (nextIds.length === targetCount) {
          try {
            const check = await api.checkAnswer(quizData.lesson.id, questionId, nextIds.join(','));
            setLiveChecks((prev) => ({
              ...prev,
              [questionId]: check,
            }));
          } catch (err) {
            console.warn('Lỗi kiểm tra live answer cho Multiple Choice:', err);
          }
        }
      } else {
        // Single Choice hoặc True/False Group
        try {
          const check = await api.checkAnswer(quizData.lesson.id, questionId, optionId);
          setLiveChecks((prev) => ({
            ...prev,
            [questionId]: check,
          }));
        } catch {
          // Ignore live check failure
        }
      }
    }
  };

  // 3.1. ANSWER TEXT / WORD ORDER (Cho FILL_BLANKS và MATCHING)
  const handleAnswerText = async (questionId: string, text: string) => {
    if (isReviewMode) return;
    const cleanText = text.trim();
    setUserAnswers((prev) => {
      if (!cleanText) {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      }
      return { ...prev, [questionId]: [cleanText] };
    });

    if (quizData?.attemptId) {
      try {
        api.saveDraftAnswer(quizData.attemptId, questionId, cleanText ? [cleanText] : []);
      } catch (err) {
        console.warn('Lỗi lưu nháp câu trả lời text:', err);
      }
    }

    // Live Instant Feedback: Kiểm tra Đúng / Sai ngay lập tức
    if (cleanText && quizData?.lesson?.id) {
      try {
        const check = await api.checkAnswer(quizData.lesson.id, questionId, cleanText);
        setLiveChecks((prev) => ({
          ...prev,
          [questionId]: check,
        }));
      } catch (err) {
        console.warn('Lỗi kiểm tra live answer:', err);
      }
    }
  };

  // 4. SUBMIT QUIZ
  const answeredCount = useMemo(() => {
    return Object.values(userAnswers).filter((arr) => Array.isArray(arr) && arr.length > 0).length;
  }, [userAnswers]);

  const totalQuizCount = quizData?.totalQuestions || 0;
  const unansweredCount = Math.max(0, totalQuizCount - answeredCount);

  const handleTriggerSubmit = () => {
    if (unansweredCount > 0) {
      setIsConfirmOpen(true);
    } else {
      executeSubmitQuiz();
    }
  };

  const executeSubmitQuiz = async () => {
    if (!quizData) return;
    try {
      setIsLoadingContent(true);
      setIsConfirmOpen(false);
      const timeSpent = Math.max(1, Math.round((Date.now() - quizStartTime) / 1000));

      // userAnswers đã lưu trữ chính xác Option UUIDs (cho trắc nghiệm) hoặc text (cho điền từ)
      const answersPayload: Record<string, string[]> = { ...userAnswers };

      const res = await api.submitQuiz(
        quizData.lesson.id,
        answersPayload,
        timeSpent,
        quizData.attemptId
      );
      sessionStorage.removeItem('ontap_active_quiz');
      setQuizResult(res);
      if (res.hasRetriedWrong) {
        setHasRetriedWrong(true);
      }
      setIsResultOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Lỗi chấm điểm bài thi');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 5. RETRY QUIZ (Làm lại bài với bộ đề xáo trộn ngẫu nhiên hoàn toàn mới - "Làm lượt mới")
  const handleRetryQuiz = async () => {
    const targetLessonId = selectedLesson?.id || quizData?.lesson?.id;
    if (targetLessonId) {
      try {
        setIsLoadingContent(true);
        // forceNew: true để sinh attempt mới với thứ tự câu hỏi và đáp án ngẫu nhiên mới
        const data = await api.startQuiz(targetLessonId, undefined, true);
        setQuizData(data);
        sessionStorage.setItem(
          'ontap_active_quiz',
          JSON.stringify({
            lessonId: targetLessonId,
            subjectSlug: selectedSubject?.slug || quizData?.subject?.slug || '',
          })
        );
      } catch (err: any) {
        showToast(err.message || 'Lỗi tải lại bài thi');
      } finally {
        setIsLoadingContent(false);
      }
    }
    setHasRetriedWrong(false);
    setUserAnswers({});
    setLiveChecks({});
    setQuizResult(null);
    setIsReviewMode(false);
    setIsResultOpen(false);
    setIsConfirmOpen(false);
    setQuizStartTime(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5.1 RETRY ONLY WRONG OR UNANSWERED QUESTIONS (Tối đa 1 lần / lượt gốc, quản lý an toàn qua Backend)
  const handleRetryWrongOnly = async () => {
    if (!quizData || !quizResult) return;
    const targetAttemptId = quizResult.attemptId || quizData.attemptId;
    if (!targetAttemptId) return;

    try {
      setIsLoadingContent(true);
      const retryQuizData = await api.retryAttempt(targetAttemptId);
      setQuizData(retryQuizData);
      setHasRetriedWrong(true);
      setUserAnswers({});
      setLiveChecks({});
      setQuizResult(null);
      setIsReviewMode(false);
      setIsResultOpen(false);
      setIsConfirmOpen(false);
      setQuizStartTime(Date.now());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Lỗi khởi tạo lượt làm lại câu sai');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 6. REVIEW QUIZ
  const handleReviewQuiz = () => {
    setIsResultOpen(false);
    setIsReviewMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Questions displayed: In review mode, displays all N questions from quizResult.review in original order
  const displayedQuestions = useMemo(() => {
    if (isReviewMode && quizResult?.review && quizResult.review.length > 0) {
      return quizResult.review.map((r, index) => ({
        id: r.questionId,
        questionNumber: r.displayNumber || (index + 1),
        displayNumber: r.displayNumber || (index + 1),
        content: r.questionContent,
        questionType: r.questionType as any,
        explanation: r.explanation || undefined,
        metadata: r.metadata,
        options: r.options || [],
      }));
    }
    return quizData?.questions || [];
  }, [isReviewMode, quizResult, quizData]);

  // Count active subjects for user
  const grantedSubjectsCount = useMemo(() => {
    return subjects.filter((s) => s.hasAccess).length;
  }, [subjects]);

  // Filter visible subjects: Learner only sees granted subjects; Admin sees all
  const visibleSubjects = useMemo(() => {
    if (user?.role === 'ADMIN') return subjects;
    return subjects.filter((s) => s.hasAccess);
  }, [subjects, user?.role]);

  // If Auth loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-purple-700">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm text-slate-600">Đang khởi tạo phiên làm việc an toàn...</p>
      </div>
    );
  }

  // If Unauthenticated -> AuthView
  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-purple-100 selection:text-purple-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        title={
          currentView === 'subjects'
            ? 'Danh Sách Môn Học'
            : currentView === 'lessons'
            ? (selectedSubject?.title || 'Danh Sách Bài Học')
            : currentView === 'quiz'
            ? (quizData?.lesson?.title || selectedLesson?.title || 'Làm Bài Thi')
            : currentView === 'history'
            ? 'Lịch Sử Làm Bài'
            : undefined
        }
        subtitle={
          currentView === 'quiz'
            ? `Tổng cộng ${quizData?.totalQuestions || 0} câu hỏi — Chấm điểm trực tiếp trên hệ thống`
            : undefined
        }
        showBack={currentView === 'lessons' || currentView === 'quiz'}
        backText={currentView === 'quiz' ? 'Danh sách bài' : 'Danh sách môn'}
        onBack={() => {
          sessionStorage.removeItem('ontap_active_quiz');
          if (currentView === 'quiz') {
            if (selectedSubject) {
              setCurrentView('lessons');
            } else if (quizData?.subject?.slug) {
              api.getSubject(quizData.subject.slug).then((subj) => {
                setSelectedSubject(subj);
                setCurrentView('lessons');
              }).catch(() => {
                setCurrentView('subjects');
              });
            } else {
              setCurrentView('subjects');
            }
          } else if (currentView === 'lessons') {
            setSelectedSubject(null);
            setCurrentView('subjects');
          }
        }}
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={(view) => {
          sessionStorage.removeItem('ontap_active_quiz');
          if (view === 'admin' && user?.role !== 'ADMIN') {
            setCurrentView('subjects');
            return;
          }
          if (view === 'subjects') {
            setSelectedSubject(null);
            setCurrentView('subjects');
            loadSubjects();
          } else {
            setCurrentView(view);
          }
        }}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-20">
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-600 underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* User has 0 granted subjects banner */}
        {user?.role === 'USER' && currentView === 'subjects' && grantedSubjectsCount === 0 && !isLoadingContent && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-3xl flex items-start gap-3.5 shadow-sm">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                Tài khoản chưa được cấp quyền môn học nào
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                Hệ thống hoạt động theo mô hình quản trị nội bộ. Tài khoản của bạn hiện có <strong>0 môn học</strong> được mở khóa.
                Vui lòng liên hệ trực tiếp với <strong>Quản trị viên (Admin)</strong> để được cấp quyền các môn học ôn thi.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: SUBJECTS LIST */}
        {currentView === 'subjects' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSubjects.map((sub) => (
                <SubjectCard
                  key={sub.id}
                  subject={sub}
                  onEnter={handleSelectSubject}
                />
              ))}
            </div>

            {visibleSubjects.length === 0 && !isLoadingContent && (
              <div className="text-center py-16 bg-white rounded-3xl border border-purple-100 p-8">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">Chưa có môn học nào được mở khóa</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LESSONS LIST */}
        {currentView === 'lessons' && selectedSubject && (
          <div className="space-y-6 animate-fadeIn">
            {/* Lesson Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedSubject.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={{
                    id: lesson.id,
                    number: lesson.lessonNumber,
                    title: lesson.title,
                    questionCount: lesson.questionCount,
                    status: lesson.status,
                  }}
                  onSelect={() => handleSelectLesson(lesson)}
                  onComingSoon={() =>
                    showToast('Bài học này đang chuẩn bị ngân hàng câu hỏi!')
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: QUIZ VIEW */}
        {currentView === 'quiz' && quizData && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            {/* Status bar */}
            <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-purple-100 shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Đã làm: {answeredCount}/{totalQuizCount} câu
                  </span>
                </div>

                {isReviewMode && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    Chế độ xem lại bài làm
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isReviewMode ? (
                  <button
                    onClick={handleTriggerSubmit}
                    disabled={isLoadingContent}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nộp bài</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRetryQuiz}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Làm lượt mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* Questions List: Số thứ tự hiển thị luôn liên tục 1..N (displayNumber = index + 1) */}
            <div className="space-y-6">
              {displayedQuestions.map((q, index) => {
                const reviewItem = quizResult?.review.find(
                  (r) => r.questionId === q.id,
                );
                return (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    displayNumber={q.displayNumber || (index + 1)}
                    selectedKey={userAnswers[q.id] || null}
                    onSelectOption={handleSelectOption}
                    onAnswerText={handleAnswerText}
                    review={reviewItem || (liveChecks[q.id] as any)}
                    isSubmitted={isReviewMode}
                  />
                );
              })}
            </div>

            {/* Bottom Submit Button */}
            {!isReviewMode && (
              <div className="pt-6 text-center">
                <button
                  onClick={handleTriggerSubmit}
                  disabled={isLoadingContent}
                  className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-purple-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Hoàn tất & Nộp bài</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: HISTORY */}
        {currentView === 'history' && (
          <HistoryView onBack={() => setCurrentView('subjects')} />
        )}

        {/* VIEW 5: ADMIN PORTAL (Strictly guarded for ADMIN role) */}
        {currentView === 'admin' && user?.role === 'ADMIN' && (
          <AdminPortal onClose={() => setCurrentView('subjects')} />
        )}
      </main>

      {/* Confirmation Modal before Submit */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        unansweredCount={unansweredCount}
        onConfirm={executeSubmitQuiz}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Result Modal after Backend Grading */}
      {quizResult && (
        <ResultModal
          isOpen={isResultOpen}
          result={{
            correctCount: quizResult.correctCount,
            wrongCount: quizResult.wrongCount,
            unansweredCount: quizResult.unansweredCount,
            totalQuestions: quizResult.totalQuestions,
            percentage: quizResult.percentage,
          }}
          canRetryWrong={!hasRetriedWrong && !quizResult.hasRetriedWrong}
          onHome={() => {
            setIsResultOpen(false);
            setCurrentView('lessons');
          }}
          onRetry={handleRetryQuiz}
          onReview={handleReviewQuiz}
          onRetryWrong={handleRetryWrongOnly}
        />
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        <p>Hệ Thống Ôn Tập Trực Tuyến &bull; Bảo mật với NestJS & PostgreSQL</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
