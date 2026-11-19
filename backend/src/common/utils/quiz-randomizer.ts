import * as crypto from 'crypto';

export interface RandomizedOption<T> {
  displayKey: string; // 'A' | 'B' | 'C' | 'D'
  option: T;
}

export interface RandomizedQuestion<Q, O> {
  displayNumber: number;
  question: Q;
  options: RandomizedOption<O>[];
}

export interface RandomizeResult<Q, O> {
  questions: RandomizedQuestion<Q, O>[];
  metadata: {
    totalAvailable: number;
    requestedCount: number | null;
    servedCount: number;
    isClamped: boolean;
  };
}

export class QuizRandomizer {
  /**
   * Thuật toán Fisher–Yates (Knuth) Shuffle an toàn mật mã sử dụng crypto.randomInt
   */
  static shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Lấy mẫu ngẫu nhiên không lặp lại N phần tử
   */
  static sample<T>(
    array: readonly T[],
    count?: number | null,
  ): { items: T[]; isClamped: boolean } {
    if (count === undefined || count === null || count <= 0) {
      return { items: this.shuffle(array), isClamped: false };
    }
    if (count >= array.length) {
      return { items: this.shuffle(array), isClamped: count > array.length };
    }
    const shuffled = this.shuffle(array);
    return { items: shuffled.slice(0, count), isClamped: false };
  }

  /**
   * Sinh nhãn hiển thị cho phương án theo thứ tự vị trí: 0 -> 'A', 1 -> 'B', 2 -> 'C', 3 -> 'D'...
   */
  static getDisplayKey(index: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return index < alphabet.length ? alphabet[index] : `Opt${index + 1}`;
  }

  /**
   * Engine dùng chung xử lý đề thi: xáo trộn thứ tự câu hỏi và thứ tự phương án
   * @param allQuestions Danh sách câu hỏi lấy từ cơ sở dữ liệu
   * @param getOptionsFn Hàm lấy danh sách Options của một câu hỏi
   * @param canShuffleOptionsFn Hàm kiểm tra xem câu hỏi có được phép đảo đáp án hay không (shuffleOptions flag)
   * @param sampleCount Số lượng câu hỏi muốn lấy ngẫu nhiên (nếu có)
   */
  static randomizeQuiz<Q, O>(
    allQuestions: readonly Q[],
    getOptionsFn: (q: Q) => readonly O[],
    canShuffleOptionsFn: (q: Q) => boolean,
    sampleCount?: number | null,
  ): RandomizeResult<Q, O> {
    const totalAvailable = allQuestions.length;
    const { items: sampledQuestions, isClamped } = this.sample(
      allQuestions,
      sampleCount,
    );

    const randomizedQuestions: RandomizedQuestion<Q, O>[] = sampledQuestions.map(
      (q, qIdx) => {
        const rawOptions = getOptionsFn(q);
        const shouldShuffleOptions = canShuffleOptionsFn(q);

        const orderedOptions = shouldShuffleOptions
          ? this.shuffle(rawOptions)
          : [...rawOptions];

        const labeledOptions: RandomizedOption<O>[] = orderedOptions.map(
          (opt, optIdx) => ({
            displayKey: this.getDisplayKey(optIdx),
            option: opt,
          }),
        );

        return {
          displayNumber: qIdx + 1,
          question: q,
          options: labeledOptions,
        };
      },
    );

    return {
      questions: randomizedQuestions,
      metadata: {
        totalAvailable,
        requestedCount: sampleCount && sampleCount > 0 ? sampleCount : null,
        servedCount: randomizedQuestions.length,
        isClamped,
      },
    };
  }
}

