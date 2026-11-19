import { QuizRandomizer } from './quiz-randomizer.js';

describe('QuizRandomizer Engine', () => {
  describe('shuffle', () => {
    it('should preserve all elements and array length', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = QuizRandomizer.shuffle(original);
      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
    });

    it('should produce different permutations over multiple iterations', () => {
      const original = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const set = new Set<string>();
      for (let i = 0; i < 20; i++) {
        set.add(QuizRandomizer.shuffle(original).join(''));
      }
      expect(set.size).toBeGreaterThan(1);
    });

    it('should handle empty and single-element arrays', () => {
      expect(QuizRandomizer.shuffle([])).toEqual([]);
      expect(QuizRandomizer.shuffle([42])).toEqual([42]);
    });
  });

  describe('sample', () => {
    it('should pick exactly N distinct items', () => {
      const list = [10, 20, 30, 40, 50];
      const { items, isClamped } = QuizRandomizer.sample(list, 3);
      expect(items).toHaveLength(3);
      expect(isClamped).toBe(false);
      expect(new Set(items).size).toBe(3);
      items.forEach((item) => expect(list).toContain(item));
    });

    it('should clamp and return all items when requested count exceeds length', () => {
      const list = [1, 2, 3];
      const { items, isClamped } = QuizRandomizer.sample(list, 10);
      expect(items).toHaveLength(3);
      expect(isClamped).toBe(true);
      expect([...items].sort()).toEqual([1, 2, 3]);
    });

    it('should return all items when count is null or <= 0', () => {
      const list = ['a', 'b', 'c'];
      expect(QuizRandomizer.sample(list, 0).items).toHaveLength(3);
      expect(QuizRandomizer.sample(list, null).items).toHaveLength(3);
    });
  });

  describe('randomizeQuiz (generic engine)', () => {
    interface MockQuestion {
      id: string;
      content: string;
      shuffleOptions: boolean;
      options: Array<{ id: string; text: string }>;
    }

    const mockQuestions: MockQuestion[] = [
      {
        id: 'q1',
        content: 'Câu hỏi 1 (cho phép đảo đáp án)',
        shuffleOptions: true,
        options: [
          { id: 'opt1', text: 'Phương án 1' },
          { id: 'opt2', text: 'Phương án 2' },
          { id: 'opt3', text: 'Phương án 3' },
          { id: 'opt4', text: 'Phương án 4' },
        ],
      },
      {
        id: 'q2',
        content: 'Câu hỏi 2 (Cố định thứ tự: Tất cả các đáp án trên)',
        shuffleOptions: false,
        options: [
          { id: 'optA', text: 'Ý A' },
          { id: 'optB', text: 'Ý B' },
          { id: 'optC', text: 'Ý C' },
          { id: 'optD', text: 'Tất cả các đáp án trên' },
        ],
      },
      {
        id: 'q3',
        content: 'Câu hỏi 3 của môn bất kỳ trong tương lai',
        shuffleOptions: true,
        options: [
          { id: 'optX', text: 'Alpha' },
          { id: 'optY', text: 'Beta' },
        ],
      },
    ];

    it('should randomize without hardcoding subject or lesson', () => {
      const result = QuizRandomizer.randomizeQuiz(
        mockQuestions,
        (q) => q.options,
        (q) => q.shuffleOptions,
        2,
      );

      expect(result.questions).toHaveLength(2);
      expect(result.metadata.totalAvailable).toBe(3);
      expect(result.metadata.requestedCount).toBe(2);
      expect(result.metadata.servedCount).toBe(2);
      expect(result.metadata.isClamped).toBe(false);

      // Verify display keys are sequential A, B, C...
      for (const q of result.questions) {
        expect(q.options[0].displayKey).toBe('A');
        expect(q.options[1].displayKey).toBe('B');
      }
    });

    it('should NEVER shuffle options when shuffleOptions is false', () => {
      const fixedQ = mockQuestions.filter((q) => !q.shuffleOptions);
      // Run 30 times: The option order must remain strictly identical to original
      for (let i = 0; i < 30; i++) {
        const res = QuizRandomizer.randomizeQuiz(
          fixedQ,
          (q) => q.options,
          (q) => q.shuffleOptions,
        );
        const optionsText = res.questions[0].options.map((o) => o.option.text);
        expect(optionsText).toEqual([
          'Ý A',
          'Ý B',
          'Ý C',
          'Tất cả các đáp án trên',
        ]);
        expect(res.questions[0].options[3].displayKey).toBe('D');
      }
    });
  });
});

