import { describe, it, expect } from 'vitest';
import {
  trimSeconds,
  formatDateString,
  buildStartTime,
  formatSurveyResponses,
  extractDate,
  extractTime,
  formatSurveyResponse,
} from './bookingHelpers';
import type { SurveyQuestion } from '../types';

// ─── trimSeconds ────────────────────────────────────────────────────────────

describe('trimSeconds', () => {
  it('HH:MM:SS を HH:MM に切り詰める', () => {
    expect(trimSeconds('10:30:00')).toBe('10:30');
  });

  it('秒が異なる値でも正しく切り詰める', () => {
    expect(trimSeconds('09:05:45')).toBe('09:05');
  });

  it('00:00:00 を 00:00 に切り詰める', () => {
    expect(trimSeconds('00:00:00')).toBe('00:00');
  });
});

// ─── formatDateString ────────────────────────────────────────────────────────

describe('formatDateString', () => {
  it('Date を YYYY-MM-DD 形式に変換する', () => {
    expect(formatDateString(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('月と日が 1 桁のときゼロ埋めする', () => {
    expect(formatDateString(new Date(2024, 2, 1))).toBe('2024-03-01');
  });

  it('12 月 31 日を正しく変換する', () => {
    expect(formatDateString(new Date(2024, 11, 31))).toBe('2024-12-31');
  });
});

// ─── buildStartTime ──────────────────────────────────────────────────────────

describe('buildStartTime', () => {
  it('Date と時刻文字列を結合して "YYYY-MM-DD HH:MM:00" を返す', () => {
    expect(buildStartTime(new Date(2024, 0, 5), '10:30')).toBe('2024-01-05 10:30:00');
  });

  it('月またぎの日付でも正しく結合する', () => {
    expect(buildStartTime(new Date(2024, 11, 31), '23:59')).toBe('2024-12-31 23:59:00');
  });
});

// ─── formatSurveyResponses ───────────────────────────────────────────────────

describe('formatSurveyResponses', () => {
  const questions: SurveyQuestion[] = [
    { id: 1, question_text: '来店のきっかけ', type: 'text', is_required: true, options: [] },
    { id: 2, question_text: 'ご要望', type: 'text', is_required: false, options: [] },
  ];

  it('フォームデータからアンケート回答オブジェクトを生成する', () => {
    const data = { survey_1: 'SNS', survey_2: '特になし' };
    expect(formatSurveyResponses(data, questions)).toEqual({
      '来店のきっかけ': 'SNS',
      'ご要望': '特になし',
    });
  });

  it('回答のない質問はスキップする', () => {
    const data = { survey_1: 'SNS' };
    expect(formatSurveyResponses(data, questions)).toEqual({
      '来店のきっかけ': 'SNS',
    });
  });

  it('質問リストが空のとき空オブジェクトを返す', () => {
    expect(formatSurveyResponses({}, [])).toEqual({});
  });

  it('チェックボックス（配列）の回答もそのまま格納する', () => {
    const checkboxQuestions: SurveyQuestion[] = [
      { id: 3, question_text: '希望メニュー', type: 'checkbox', is_required: false, options: ['カット', 'カラー'] },
    ];
    const data = { survey_3: ['カット', 'カラー'] };
    expect(formatSurveyResponses(data, checkboxQuestions)).toEqual({
      '希望メニュー': ['カット', 'カラー'],
    });
  });
});

// ─── extractDate ─────────────────────────────────────────────────────────────

describe('extractDate', () => {
  it('日時文字列から日付部分（YYYY-MM-DD）を取り出す', () => {
    expect(extractDate('2024-01-05 10:30:00')).toBe('2024-01-05');
  });

  it('undefined のとき空文字を返す', () => {
    expect(extractDate(undefined)).toBe('');
  });

  it('空文字のとき空文字を返す', () => {
    expect(extractDate('')).toBe('');
  });
});

// ─── extractTime ─────────────────────────────────────────────────────────────

describe('extractTime', () => {
  it('undefined のとき空文字を返す', () => {
    expect(extractTime(undefined)).toBe('');
  });

  it('空文字のとき空文字を返す', () => {
    expect(extractTime('')).toBe('');
  });

  it('日時文字列から HH:MM 形式の時刻を取り出す', () => {
    // toTimeString() はローカルタイムゾーンに依存するため、
    // 期待値も同じ変換で生成して環境差異を吸収する
    const input = '2024-01-05 10:30:00';
    const expected = new Date(input).toTimeString().substring(0, 5);
    expect(extractTime(input)).toBe(expected);
  });
});

// ─── formatSurveyResponse ────────────────────────────────────────────────────

describe('formatSurveyResponse', () => {
  it('null のとき「なし」を返す', () => {
    expect(formatSurveyResponse(null)).toBe('なし');
  });

  it('空オブジェクトのとき空文字を返す', () => {
    expect(formatSurveyResponse({})).toBe('');
  });

  it('単一回答を "質問: 回答" 形式に変換する', () => {
    expect(formatSurveyResponse({ '来店のきっかけ': 'SNS' })).toBe('来店のきっかけ: SNS');
  });

  it('複数回答を " / " で区切る', () => {
    expect(formatSurveyResponse({ 'Q1': 'A1', 'Q2': 'A2' })).toBe('Q1: A1 / Q2: A2');
  });

  it('配列の回答をカンマ区切りのテキストに変換する', () => {
    expect(formatSurveyResponse({ '希望メニュー': ['カット', 'カラー'] }))
      .toBe('希望メニュー: カット, カラー');
  });
});
