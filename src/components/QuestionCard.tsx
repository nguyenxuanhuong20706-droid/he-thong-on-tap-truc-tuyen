import React from 'react';
import type { OptionKey, Question } from '../types/quiz';
import { Check, X } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedOption: OptionKey | null;
  onSelectOption: (questionId: number, optionKey: OptionKey) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  onSelectOption,
}) => {
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === question.correctAnswer;

  const handleOptionClick = (key: OptionKey) => {
    // If already answered, locked!
    if (isAnswered) return;
    onSelectOption(question.id, key);
  };

  return (
    <div
      id={`question-${question.questionNumber}`}
      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] transition-all"
    >
      {/* Top Header: Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block bg-[#5d5fef] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-indigo-500/20">
          Câu {question.questionNumber}
        </span>

        {isAnswered && (
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isCorrect ? 'Chính xác' : 'Chưa đúng'}
          </span>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-slate-900 font-bold text-base sm:text-lg leading-relaxed mb-5">
        {question.question}
      </h3>

      {/* Options List */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.key;
          const isOptionCorrect = option.key === question.correctAnswer;

          let containerClass = 'border-slate-200/90 bg-white text-slate-700';
          let letterClass = 'bg-slate-100 text-slate-600';
          let icon = null;

          if (isAnswered) {
            if (isSelected) {
              if (isOptionCorrect) {
                // User chose correctly
                containerClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-sm';
                letterClass = 'bg-emerald-500 text-white';
                icon = <Check className="w-5 h-5 text-emerald-600 shrink-0 ml-auto" />;
              } else {
                // User chose wrong
                containerClass = 'border-rose-400 bg-rose-50/70 text-rose-950 shadow-sm';
                letterClass = 'bg-rose-500 text-white';
                icon = <X className="w-5 h-5 text-rose-600 shrink-0 ml-auto" />;
              }
            } else if (isOptionCorrect) {
              // This is the correct answer that user missed
              containerClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-sm';
              letterClass = 'bg-emerald-500 text-white';
              icon = <Check className="w-5 h-5 text-emerald-600 shrink-0 ml-auto" />;
            } else {
              // Neither chosen nor correct
              containerClass = 'border-slate-100 bg-slate-50/40 text-slate-400 opacity-60';
              letterClass = 'bg-slate-100 text-slate-400';
            }
          } else {
            // Hover styling before answer
            containerClass += ' hover:border-[#5d5fef] hover:bg-indigo-50/20 hover:text-slate-900 cursor-pointer';
          }

          return (
            <button
              key={option.key}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionClick(option.key)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex items-center gap-3.5 ${containerClass} ${
                isAnswered ? 'cursor-default' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${letterClass}`}
              >
                {option.key}
              </div>
              <span className="text-sm sm:text-base leading-snug font-medium flex-1">
                {option.text}
              </span>
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
