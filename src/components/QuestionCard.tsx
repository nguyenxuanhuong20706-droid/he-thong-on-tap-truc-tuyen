import React, { useState, useEffect } from 'react';
import type { QuizQuestion, QuizReviewItem } from '../services/api';

interface QuestionCardProps {
  question: QuizQuestion;
  displayNumber?: number;
  selectedKey?: string | string[] | null;
  onSelectOption?: (questionId: string, optionId: string, displayKey?: string) => void;
  onAnswerText?: (questionId: string, text: string) => void;
  review?: QuizReviewItem;
  isSubmitted?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  displayNumber,
  selectedKey,
  onSelectOption,
  onAnswerText,
  review,
  isSubmitted = false,
}) => {
  const displayNum = displayNumber ?? question.displayNumber ?? question.questionNumber;
  const qType = review?.questionType || question.questionType || 'SINGLE_CHOICE';

  const isMultiple =
    qType === 'MULTIPLE_CHOICE' ||
    question.content.toLowerCase().includes('chọn 2 đáp án') ||
    question.content.toLowerCase().includes('chọn 02 đáp án') ||
    question.content.toLowerCase().includes('chọn 3 đáp án') ||
    question.content.toLowerCase().includes('chọn 03 đáp án') ||
    question.content.toLowerCase().includes('chọn hai đáp');

  // Nhận diện dạng câu hỏi Kéo thả phân loại Đa Cột / Đa Khung
  const multiColumnData = React.useMemo(() => {
    const pairs = question.metadata?.pairs || review?.metadata?.pairs;
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return null;
    const lefts: string[] = [];
    for (const p of pairs) {
      if (p.left && !lefts.includes(p.left)) {
        lefts.push(p.left);
      }
    }
    if (lefts.length < 2) return null;

    const rawTokensList: string[] =
      question.metadata?.tokens ||
      review?.metadata?.tokens ||
      pairs.map((p: any) => p.right).filter(Boolean);

    const uniqueTokens: string[] = [];
    for (const t of rawTokensList) {
      if (t && !uniqueTokens.includes(t)) {
        uniqueTokens.push(t);
      }
    }

    return {
      columns: lefts,
      pairs: pairs,
      tokens: uniqueTokens,
    };
  }, [question.metadata, review?.metadata]);

  const isMultiColumn = Boolean(multiColumnData) || qType === 'MULTI_COLUMN_DRAG_DROP';
  const isFillBlank = qType === 'FILL_BLANKS';
  const isMatching = (qType === 'MATCHING' || qType === 'DRAG_DROP') && !isMultiColumn;
  const isTrueFalse = qType === 'TRUE_FALSE_GROUP';

  // State evaluation (either from final submission or live verification)
  const hasEvaluated = Boolean(isSubmitted || (review && review.isCorrect !== undefined));
  const isCorrectResult = Boolean(review?.isCorrect);

  // Split Passage (Đề bài) vs Question (Câu hỏi)
  const rawPassage = question.metadata?.passage || review?.metadata?.passage || null;
  let passageText = rawPassage ? rawPassage.trim() : null;
  let rawContent = question.content.trim();

  // If passage is not in metadata but prepended with double newline
  if (!passageText && rawContent.includes('\n\n')) {
    const parts = rawContent.split('\n\n');
    passageText = parts.slice(0, -1).join('\n\n').trim();
    rawContent = parts[parts.length - 1].trim();
  }

  // Parse image and clean content if present (loại bỏ tiền tố cứng số câu cũ để số hiển thị liên tục 1..N)
  const imgMatch = rawContent.match(/\[img:(.*?)\]/);
  const rawImgSrc = imgMatch ? imgMatch[1] : null;
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const imgSrc = rawImgSrc
    ? rawImgSrc.startsWith('http')
      ? rawImgSrc
      : `${baseUrl}/${rawImgSrc.replace(/^\//, '')}`
    : null;

  const cleanContent = rawContent
    .replace(/\[img:(.*?)\]/g, '')
    .replace(/^(?:câu|question|bài)\s*\d+[:.]\s*/i, '')
    .trim();

  // Convert selectedKey to array of selected keys/IDs (hỗ trợ cả review mode khi nộp bài)
  const selectedList: string[] = React.useMemo(() => {
    const src = selectedKey || review?.selectedOptionIds || review?.selectedKey;
    if (!src) return [];
    if (Array.isArray(src)) return src;
    if (typeof src === 'string') {
      if (src.includes(',')) {
        return src.split(',').map((s) => s.trim());
      }
      return [src];
    }
    return [];
  }, [selectedKey, review?.selectedOptionIds, review?.selectedKey]);

  // Text Answer for FILL_BLANKS
  const initialText = React.useMemo(() => {
    if (review?.textAnswer) return review.textAnswer;
    if (selectedList.length > 0) return selectedList[0];
    return '';
  }, [review?.textAnswer, selectedList]);

  const [inputText, setInputText] = useState(initialText);

  useEffect(() => {
    setInputText(initialText);
  }, [initialText]);

  // State cho MULTI_COLUMN_DRAG_DROP (Kéo thả phân loại đa cột)
  const parseAssignments = (): Record<string, string[]> => {
    if (!multiColumnData) return {};
    const map: Record<string, string[]> = {};
    for (const col of multiColumnData.columns) {
      map[col] = [];
    }

    const rawSrc = selectedKey || review?.selectedKey || review?.textAnswer;
    if (!rawSrc) return map;

    const rawStr = Array.isArray(rawSrc) ? rawSrc.join(' | ') : String(rawSrc);
    if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawStr);
        for (const col of multiColumnData.columns) {
          if (Array.isArray(parsed[col])) {
            map[col] = parsed[col];
          }
        }
        return map;
      } catch {
        // ignore
      }
    }

    const parts = rawStr.split('|').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('->')) {
        const [col, tok] = part.split('->').map((s) => s.trim());
        const targetCol =
          multiColumnData.columns.find((c) => c.toLowerCase() === col.toLowerCase()) || col;
        if (!map[targetCol]) map[targetCol] = [];
        if (tok && !map[targetCol].includes(tok)) {
          map[targetCol].push(tok);
        }
      }
    }
    return map;
  };

  const [columnAssignments, setColumnAssignments] = useState<Record<string, string[]>>(parseAssignments);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedPoolToken, setSelectedPoolToken] = useState<string | null>(null);

  useEffect(() => {
    setColumnAssignments(parseAssignments());
  }, [selectedKey, review?.selectedKey, review?.textAnswer, multiColumnData]);

  // Khi câu hỏi chưa làm (như khi bắt đầu làm lại câu sai / làm lượt mới), đưa mọi ô input và kéo thả về rỗng hoàn toàn
  useEffect(() => {
    if (!hasEvaluated && !selectedKey) {
      setInputText('');
      setSlottedTokens([]);
      setTfSelections({});
      setSelectedPoolToken(null);
      if (multiColumnData) {
        const fresh: Record<string, string[]> = {};
        for (const col of multiColumnData.columns) fresh[col] = [];
        setColumnAssignments(fresh);
      }
    }
  }, [hasEvaluated, selectedKey, question.id, multiColumnData]);

  // Token ngân hàng trong kho chưa được gán vào cột
  const assignedTokensSet = React.useMemo(() => {
    const set = new Set<string>();
    if (!multiColumnData) return set;
    for (const col of multiColumnData.columns) {
      for (const tok of columnAssignments[col] || []) {
        set.add(tok);
      }
    }
    return set;
  }, [multiColumnData, columnAssignments]);

  const poolTokens = React.useMemo(() => {
    if (!multiColumnData) return [];
    return multiColumnData.tokens.filter((tok) => !assignedTokensSet.has(tok));
  }, [multiColumnData, assignedTokensSet]);

  const moveTokenToCol = (token: string, targetCol: string, fromCol?: string) => {
    if (hasEvaluated || !multiColumnData) return;
    setColumnAssignments((prev) => {
      const next: Record<string, string[]> = {};
      for (const col of multiColumnData.columns) {
        next[col] = [...(prev[col] || [])];
      }
      if (fromCol && next[fromCol]) {
        next[fromCol] = next[fromCol].filter((t) => t !== token);
      }
      if (!next[targetCol].includes(token)) {
        next[targetCol].push(token);
      }
      return next;
    });
    setSelectedPoolToken(null);
  };

  const returnTokenToPool = (token: string, fromCol: string) => {
    if (hasEvaluated || !multiColumnData) return;
    setColumnAssignments((prev) => {
      const next: Record<string, string[]> = {};
      for (const col of multiColumnData.columns) {
        next[col] = [...(prev[col] || [])];
      }
      if (next[fromCol]) {
        next[fromCol] = next[fromCol].filter((t) => t !== token);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, token: string, fromCol?: string) => {
    if (hasEvaluated) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ token, fromCol }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnCol = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (hasEvaluated) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.token) {
        moveTokenToCol(data.token, targetCol, data.fromCol);
      }
    } catch {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) moveTokenToCol(raw, targetCol);
    }
  };

  const handleConfirmMultiColumn = () => {
    if (hasEvaluated || !multiColumnData) return;
    const pairsList: string[] = [];
    for (const col of multiColumnData.columns) {
      for (const tok of columnAssignments[col] || []) {
        pairsList.push(`${col} -> ${tok}`);
      }
    }
    const serialized = pairsList.join(' | ');
    onAnswerText && onAnswerText(question.id, serialized);
  };

  // State cho TRUE_FALSE_GROUP
  const [tfSelections, setTfSelections] = useState<Record<string, 'Đúng' | 'Sai'>>(() => {
    const map: Record<string, 'Đúng' | 'Sai'> = {};
    if (selectedList && selectedList.length > 0) {
      for (const item of selectedList) {
        if (item.includes(':')) {
          const [optId, val] = item.split(':');
          if (val === 'Đúng' || val === 'Sai') {
            map[optId] = val;
          }
        } else {
          // Legacy support: optionId means 'Đúng'
          map[item] = 'Đúng';
        }
      }
    }
    return map;
  });

  const handleSelectTF = (optId: string, val: 'Đúng' | 'Sai') => {
    if (hasEvaluated) return;
    const next = { ...tfSelections, [optId]: val };
    setTfSelections(next);

    // Lưu ngay lựa chọn từng câu
    const encodedSelections = Object.entries(next).map(([id, choice]) => `${id}:${choice}`);
    onSelectOption && onSelectOption(question.id, encodedSelections.join(','));
  };

  const handleConfirmInput = () => {
    if (hasEvaluated || !inputText.trim()) return;
    onAnswerText && onAnswerText(question.id, inputText.trim());
  };

  // For MATCHING / Word Ordering:
  const rawTokens: string[] = React.useMemo(() => {
    if (question.metadata?.tokens && Array.isArray(question.metadata.tokens)) {
      return question.metadata.tokens;
    }
    if (review?.metadata?.tokens && Array.isArray(review.metadata.tokens)) {
      return review.metadata.tokens;
    }
    if (question.content.includes('/')) {
      const promptPart = question.content.includes(':')
        ? question.content.split(':')[1]
        : question.content;
      return promptPart.split('/').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [question.metadata, review?.metadata, question.content]);

  // Selected tokens in order for MATCHING
  const [slottedTokens, setSlottedTokens] = useState<number[]>([]);

  const availableTokens = React.useMemo(() => {
    const used = new Set(slottedTokens);
    return rawTokens.map((token, idx) => ({
      index: idx,
      text: token,
      isUsed: used.has(idx),
    }));
  }, [rawTokens, slottedTokens]);

  const handleSlotToken = (index: number) => {
    if (hasEvaluated) return;
    const next = [...slottedTokens, index];
    setSlottedTokens(next);

    // Khi người dùng kéo thả phương án cuối cùng thì tự động gửi kiểm tra Đúng / Sai luôn
    if (next.length === rawTokens.length) {
      const assembledText = next.map((i) => rawTokens[i]).join(' ');
      onAnswerText && onAnswerText(question.id, assembledText);
    }
  };

  const handleUnslotToken = (slotIdx: number) => {
    if (hasEvaluated) return;
    const next = slottedTokens.filter((_, idx) => idx !== slotIdx);
    setSlottedTokens(next);
  };

  // Correct Answer Text for Display
  const correctAnswerDisplay =
    review?.correctKey ||
    question.correctKey ||
    question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.text || o.key)
      .join(', ') ||
    '';

  return (
    <div
      id={`question-${displayNum}`}
      className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] transition-all text-left"
    >
      {/* Top Header: Badge Câu X và vị trí hiển thị "Đáp án đúng: ..." nếu sai */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-purple-500/20">
            Câu {displayNum}
          </span>

          {isMultiple && (
            <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Chọn nhiều đáp án
            </span>
          )}

          {isMultiColumn && (
            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Kéo thả vào cột tương ứng
            </span>
          )}
        </div>

        {/* Vị trí góc phải ngang hàng với Câu X: Đối với phương án Input hoặc Matching, khi Sai thì hiển thị Đáp án đúng tại đây (không icon) */}
        {isFillBlank && hasEvaluated && !isCorrectResult && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-fadeIn">
            Đáp án đúng: <strong className="underline ml-0.5">{correctAnswerDisplay}</strong>
          </span>
        )}

        {isMatching && hasEvaluated && !isCorrectResult && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-fadeIn">
            Đáp án chuẩn: <strong className="underline ml-0.5">{correctAnswerDisplay}</strong>
          </span>
        )}
      </div>

      {/* Embedded Question Image if available */}
      {imgSrc && (
        <div className="mb-4 text-center">
          <img
            src={imgSrc}
            alt="Hình minh họa câu hỏi"
            className="max-h-80 max-w-full rounded-2xl mx-auto border border-purple-100 shadow-sm object-contain bg-slate-50 p-1.5"
            loading="lazy"
          />
        </div>
      )}

      {/* ĐỀ BÀI (Passage / Context) - Khung góc bo tròn, phông chữ bình thường (KHÔNG in đậm) */}
      {passageText && (
        <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-700 font-normal text-sm sm:text-base leading-relaxed whitespace-pre-line shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          {passageText}
        </div>
      )}

      {/* CÂU HỎI CHÍNH - In đậm nổi bật */}
      <h3 className="text-slate-900 font-bold text-base sm:text-lg leading-relaxed mb-5 whitespace-pre-line">
        {cleanContent}
      </h3>

      {/* ========================================================================= */}
      {/* DẠNG 1: INPUT (Nhập đáp án) */}
      {/* ========================================================================= */}
      {isFillBlank && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              disabled={hasEvaluated}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmInput();
              }}
              placeholder="Nhập câu trả lời của bạn..."
              className={`flex-1 px-4 py-3 rounded-2xl border text-sm transition-all shadow-sm focus:outline-none ${
                hasEvaluated
                  ? isCorrectResult
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                    : 'border-rose-400 bg-rose-50/50 text-rose-950 font-semibold'
                  : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-slate-800 bg-slate-50/50 font-medium'
              }`}
            />

            {/* Nút: Chưa xác nhận -> "Xác nhận"; Đã xác nhận -> hiển thị "Đúng" / "Sai" (không icon) */}
            {!hasEvaluated ? (
              <button
                type="button"
                onClick={handleConfirmInput}
                disabled={!inputText.trim()}
                className="px-5 py-3 rounded-2xl font-bold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-sm shadow-purple-600/20 active:scale-95 cursor-pointer transition-all flex items-center justify-center select-none"
              >
                Xác nhận
              </button>
            ) : (
              <div
                className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center cursor-default select-none transition-all ${
                  isCorrectResult
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-rose-600 text-white shadow-rose-600/20'
                }`}
              >
                {isCorrectResult ? 'Đúng' : 'Sai'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DẠNG 2: KÉO THẢ / SẮP XẾP TỪ (Word Ordering) */}
      {/* ========================================================================= */}
      {isMatching && (
        <div className="space-y-4">
          {/* Khung lắp ghép câu */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all duration-200 min-h-[64px] flex flex-wrap items-center gap-2 ${
              hasEvaluated
                ? isCorrectResult
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-rose-300 bg-rose-50/40'
                : 'border-purple-200 bg-purple-50/40'
            }`}
          >
            {slottedTokens.length === 0 ? (
              <span className="text-slate-400 text-xs sm:text-sm italic select-none">
                {hasEvaluated
                  ? '(Chưa sắp xếp câu trả lời)'
                  : 'Bấm chọn các từ bên dưới theo thứ tự để ghép thành câu...'}
              </span>
            ) : (
              slottedTokens.map((tokIdx, slotIdx) => (
                <button
                  key={`${tokIdx}-${slotIdx}`}
                  type="button"
                  disabled={hasEvaluated}
                  onClick={() => handleUnslotToken(slotIdx)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 select-none ${
                    hasEvaluated
                      ? isCorrectResult
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20 cursor-default'
                        : 'bg-rose-500 text-white shadow-rose-500/20 cursor-default'
                      : 'bg-purple-600 text-white shadow-purple-500/20 hover:bg-purple-700 active:scale-95 cursor-pointer'
                  }`}
                  title={hasEvaluated ? undefined : 'Bấm để gỡ từ này'}
                >
                  {rawTokens[tokIdx]}
                </button>
              ))
            )}
          </div>

          {/* Ngân hàng từ: Không có nút "Đặt lại", không có icon */}
          {!hasEvaluated && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ngân hàng từ:
              </div>

              <div className="flex flex-wrap gap-2">
                {availableTokens.map((tok) => (
                  <button
                    key={tok.index}
                    type="button"
                    disabled={tok.isUsed}
                    onClick={() => handleSlotToken(tok.index)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 border select-none ${
                      tok.isUsed
                        ? 'border-slate-200 bg-slate-100 text-slate-300 opacity-30 cursor-not-allowed scale-95'
                        : 'border-purple-200 bg-white text-slate-700 hover:border-purple-500 hover:text-purple-700 hover:shadow-sm active:scale-95 cursor-pointer'
                    }`}
                  >
                    {tok.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DẠNG 3: TRUE_FALSE_GROUP (Nhóm nhận định Đúng/Sai) */}
      {/* ========================================================================= */}
      {isTrueFalse && (
        <div className="space-y-3">
          {question.options.map((option) => {
            const currentChoice = tfSelections[option.id];
            const isOptCorrect = review
              ? (review.options?.find((ro) => ro.id === option.id)?.isCorrect ?? option.isCorrect)
              : option.isCorrect;
            const expectedVal = isOptCorrect ? 'Đúng' : 'Sai';

            return (
              <div
                key={option.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all"
              >
                <div className="flex-1 text-sm font-medium text-slate-800 leading-relaxed">
                  {option.text}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={hasEvaluated}
                    onClick={() => handleSelectTF(option.id, 'Đúng')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                      hasEvaluated
                        ? currentChoice === 'Đúng'
                          ? expectedVal === 'Đúng'
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-rose-600 text-white shadow-rose-500/20'
                          : expectedVal === 'Đúng'
                          ? 'border border-emerald-500 text-emerald-700 bg-emerald-50'
                          : 'opacity-40 border border-slate-200 text-slate-400'
                        : currentChoice === 'Đúng'
                        ? 'bg-purple-600 text-white shadow-purple-500/20'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-400'
                    }`}
                  >
                    Đúng
                  </button>

                  <button
                    type="button"
                    disabled={hasEvaluated}
                    onClick={() => handleSelectTF(option.id, 'Sai')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                      hasEvaluated
                        ? currentChoice === 'Sai'
                          ? expectedVal === 'Sai'
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-rose-600 text-white shadow-rose-500/20'
                          : expectedVal === 'Sai'
                          ? 'border border-emerald-500 text-emerald-700 bg-emerald-50'
                          : 'opacity-40 border border-slate-200 text-slate-400'
                        : currentChoice === 'Sai'
                        ? 'bg-purple-600 text-white shadow-purple-500/20'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-400'
                    }`}
                  >
                    Sai
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DẠNG 3.6: MULTI_COLUMN_DRAG_DROP (Kéo thả phân loại đa cột / đa khung) */}
      {/* ========================================================================= */}
      {isMultiColumn && multiColumnData && (
        <div className="space-y-6">
          {/* Ngân hàng thẻ (Draggable Items Pool) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Kho thẻ đáp án ({poolTokens.length} thẻ còn lại):
              </span>
              {!hasEvaluated && selectedPoolToken && (
                <span className="text-xs text-purple-600 font-semibold animate-pulse">
                  Đã chọn 1 thẻ — Bấm vào cột muốn thả
                </span>
              )}
            </div>

            {poolTokens.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                (Đã xếp toàn bộ thẻ vào các cột. Bạn có thể kéo thẻ ngược lại kho nếu muốn đổi vị trí)
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {poolTokens.map((token) => {
                  const isSelected = selectedPoolToken === token;
                  // Nếu đã chấm điểm mà thẻ này vẫn nằm trong kho: kiểm tra xem có phải là thẻ bị bỏ quên không
                  const expectedCol = hasEvaluated
                    ? multiColumnData.pairs.find(
                        (p: any) => p.right.trim().toLowerCase() === token.trim().toLowerCase()
                      )?.left
                    : null;

                  return (
                    <div
                      key={token}
                      draggable={!hasEvaluated}
                      onDragStart={(e) => handleDragStart(e, token)}
                      onClick={() => {
                        if (hasEvaluated) return;
                        setSelectedPoolToken(isSelected ? null : token);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all select-none duration-150 ${
                        hasEvaluated
                          ? expectedCol
                            ? 'border-2 border-dashed border-rose-400 bg-rose-50 text-rose-700 font-semibold cursor-default'
                            : 'border border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-default'
                          : isSelected
                          ? 'border-2 border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm ring-2 ring-purple-600/20 scale-102 cursor-pointer'
                          : 'border border-purple-200 bg-white text-slate-800 hover:border-purple-400 hover:text-purple-700 hover:shadow-xs active:scale-98 cursor-grab active:cursor-grabbing'
                      }`}
                      title={hasEvaluated ? (expectedCol ? `Bị bỏ sót! Đáng lẽ thuộc: ${expectedCol}` : undefined) : 'Kéo thả hoặc click để chọn'}
                    >
                      {token}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Các cột mục tiêu ($N$ cột) */}
          <div
            className={`grid grid-cols-1 ${
              multiColumnData.columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
            } gap-4`}
          >
            {multiColumnData.columns.map((col) => {
              const assigned = columnAssignments[col] || [];
              const isOver = dragOverCol === col;

              return (
                <div
                  key={col}
                  onDragOver={(e) => {
                    if (!hasEvaluated) {
                      e.preventDefault();
                      setDragOverCol(col);
                    }
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDropOnCol(e, col)}
                  onClick={() => {
                    if (!hasEvaluated && selectedPoolToken) {
                      moveTokenToCol(selectedPoolToken, col);
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col min-h-[220px] ${
                    isOver
                      ? 'border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20'
                      : 'border-slate-200/90 bg-slate-50/30'
                  }`}
                >
                  {/* Tiêu đề cột */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {col}
                    </h4>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {assigned.length}
                    </span>
                  </div>

                  {/* Vùng thả các thẻ trong cột */}
                  <div className="flex-1 flex flex-col gap-2">
                    {assigned.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4 text-center">
                        <span className="text-xs text-slate-400 italic select-none">
                          {hasEvaluated ? '(Không có thẻ nào)' : 'Kéo và thả các đáp án vào đây'}
                        </span>
                      </div>
                    ) : (
                      assigned.map((token) => {
                        const isCorrectPlacement = multiColumnData.pairs.some(
                          (p: any) =>
                            p.left.trim().toLowerCase() === col.trim().toLowerCase() &&
                            p.right.trim().toLowerCase() === token.trim().toLowerCase()
                        );

                        return (
                          <div
                            key={token}
                            draggable={!hasEvaluated}
                            onDragStart={(e) => handleDragStart(e, token, col)}
                            className={`p-3 rounded-xl border text-xs sm:text-sm transition-all select-none duration-150 flex items-center justify-between gap-2 shadow-xs ${
                              hasEvaluated
                                ? isCorrectPlacement
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                                  : 'border-rose-400 bg-rose-50 text-rose-950 font-semibold'
                                : 'border-purple-200 bg-white text-slate-800 hover:border-purple-400 cursor-grab active:cursor-grabbing'
                            }`}
                          >
                            <span className="flex-1 leading-snug">{token}</span>
                            {!hasEvaluated && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  returnTokenToPool(token, col);
                                }}
                                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center text-xs shrink-0 cursor-pointer transition-colors"
                                title="Trả thẻ về kho"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hàng điều khiển: Nút Xác nhận (khi làm bài) / Trạng thái Đúng-Sai (khi đã chấm) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 italic">
              {hasEvaluated
                ? isCorrectResult
                  ? 'Hoàn thành chính xác toàn bộ các cột!'
                  : 'Có đáp án chưa xếp đúng cột. Xem bảng đối chiếu chuẩn bên dưới.'
                : '* Kéo thẻ vào các cột phù hợp, có thể bỏ lẻ thẻ nếu không chắc chắn. Nhấn Xác nhận để chấm điểm.'}
            </span>

            {!hasEvaluated ? (
              <button
                type="button"
                onClick={handleConfirmMultiColumn}
                className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-sm shadow-purple-600/20 cursor-pointer transition-all flex items-center justify-center select-none"
              >
                Xác nhận
              </button>
            ) : (
              <div
                className={`px-6 py-2 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center cursor-default select-none transition-all ${
                  isCorrectResult
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-rose-600 text-white shadow-rose-600/20'
                }`}
              >
                {isCorrectResult ? 'Đúng' : 'Sai'}
              </div>
            )}
          </div>

          {/* TẦNG 2: BẢNG CHUẨN ĐỐI CHIẾU (Chỉ xuất hiện khi làm SAI) */}
          {hasEvaluated && !isCorrectResult && (
            <div className="mt-6 pt-5 border-t border-slate-200/90 animate-fadeIn">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bảng đối chiếu đáp án chuẩn theo từng cột:
                </span>
              </div>
              <div
                className={`grid grid-cols-1 ${
                  multiColumnData.columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                } gap-4`}
              >
                {multiColumnData.columns.map((col) => {
                  const correctItems = multiColumnData.pairs
                    .filter((p: any) => p.left === col)
                    .map((p: any) => p.right);

                  return (
                    <div
                      key={col}
                      className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/90 shadow-sm"
                    >
                      <div className="text-xs sm:text-sm font-bold text-emerald-950 mb-3 pb-2 border-b border-emerald-200/70">
                        {col}
                      </div>
                      <div className="flex flex-col gap-2">
                        {correctItems.map((item: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 sm:p-3 rounded-xl bg-white border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-medium shadow-xs"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DẠNG 4: SINGLE_CHOICE / MULTIPLE_CHOICE (Hình 1 & 2) */}
      {/* ========================================================================= */}
      {!isFillBlank && !isMatching && !isMultiColumn && !isTrueFalse && (
        <div className="space-y-3">
          {question.options.map((option) => {
            const displayLetter = option.displayKey || option.key;
            const isSelected =
              selectedList.includes(option.id) ||
              selectedList.includes(displayLetter);

            const isOptionCorrect =
              Boolean(
                review?.options?.find((ro) => ro.id === option.id)?.isCorrect
              ) ||
              (review as any)?.correctOptionId === option.id ||
              ((review as any)?.correctOptionIds && (review as any).correctOptionIds.includes(option.id)) ||
              Boolean(option.isCorrect);

            let containerClass = 'border-slate-200/90 bg-white text-slate-700';
            let letterClass = 'bg-slate-100 text-slate-600';
            let badgeRight = null;

            if (hasEvaluated) {
              if (isSelected) {
                if (isOptionCorrect) {
                  containerClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                  letterClass = 'bg-emerald-600 text-white';
                } else {
                  containerClass = 'border-rose-400 bg-rose-50 text-rose-950 font-medium';
                  letterClass = 'bg-rose-600 text-white';
                }
              } else if (isOptionCorrect) {
                containerClass = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-medium';
                letterClass = 'bg-emerald-600 text-white';
                badgeRight = (
                  <span className="ml-auto inline-block text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full shrink-0">
                    Đáp án đúng
                  </span>
                );
              } else {
                containerClass = 'border-slate-100 bg-slate-50/40 text-slate-400 opacity-60';
                letterClass = 'bg-slate-100 text-slate-400';
              }
            } else {
              // Live Practicing / Answering Mode
              if (isSelected) {
                containerClass =
                  'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold shadow-sm ring-2 ring-purple-600/20';
                letterClass = 'bg-purple-600 text-white';
              } else {
                containerClass +=
                  ' hover:border-purple-400 hover:bg-purple-50/20 hover:text-slate-900 cursor-pointer';
              }
            }

            return (
              <button
                key={option.id || option.key}
                type="button"
                disabled={hasEvaluated}
                onClick={() =>
                  onSelectOption && onSelectOption(question.id, option.id, displayLetter)
                }
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex items-center gap-3.5 ${containerClass} ${
                  hasEvaluated ? 'cursor-default' : ''
                }`}
              >
                {/* Key Letter Badge: Luôn hiển thị A, B, C, D theo đúng thứ tự hiển thị */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${letterClass}`}
                >
                  {displayLetter}
                </div>

                {/* Text */}
                <span className="text-sm font-medium flex-1">{option.text}</span>

                {/* Badge text if correct (no icon) */}
                {badgeRight}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
