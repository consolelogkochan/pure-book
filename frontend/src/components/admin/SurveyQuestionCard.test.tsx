import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SurveyQuestionCard } from './SurveyQuestionCard';
import type { SurveyQuestion } from '../../types';

const textQuestion: SurveyQuestion = {
  id: 1,
  question_text: '来店のきっかけを教えてください',
  type: 'text',
  is_required: false,
  options: [],
};

const radioQuestion: SurveyQuestion = {
  id: 2,
  question_text: 'ご希望のスタイルは？',
  type: 'radio',
  is_required: true,
  options: ['ナチュラル', 'カジュアル'],
};

describe('SurveyQuestionCard', () => {
  describe('表示', () => {
    it('質問文が表示される', () => {
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.getByDisplayValue('来店のきっかけを教えてください')).toBeInTheDocument();
    });

    it('type が "text" のとき選択肢エリアが非表示', () => {
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.queryByText('+ 選択肢を追加')).not.toBeInTheDocument();
    });

    it('type が "radio" のとき選択肢エリアが表示される', () => {
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.getByText('+ 選択肢を追加')).toBeInTheDocument();
    });

    it('既存の選択肢が表示される', () => {
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.getByDisplayValue('ナチュラル')).toBeInTheDocument();
      expect(screen.getByDisplayValue('カジュアル')).toBeInTheDocument();
    });

    it('is_required が true のとき必須チェックボックスがチェックされている', () => {
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.getByRole('checkbox', { name: /必須/ })).toBeChecked();
    });

    it('is_required が false のとき必須チェックボックスがチェックされていない', () => {
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={vi.fn()} removeQuestion={vi.fn()} />);
      expect(screen.getByRole('checkbox', { name: /必須/ })).not.toBeChecked();
    });
  });

  describe('インタラクション', () => {
    it('「削除」クリックで removeQuestion が呼ばれる', async () => {
      const removeQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={vi.fn()} removeQuestion={removeQuestion} />);
      await user.click(screen.getByRole('button', { name: '削除' }));
      expect(removeQuestion).toHaveBeenCalledOnce();
    });

    it('回答形式を "radio" に変更すると options: [""] で updateQuestion が呼ばれる', async () => {
      const updateQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={updateQuestion} removeQuestion={vi.fn()} />);
      await user.selectOptions(screen.getByRole('combobox'), 'radio');
      expect(updateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'radio', options: [''] })
      );
    });

    it('"radio" から "text" に変更すると options が空になる', async () => {
      const updateQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={updateQuestion} removeQuestion={vi.fn()} />);
      await user.selectOptions(screen.getByRole('combobox'), 'text');
      expect(updateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'text', options: [] })
      );
    });

    it('「+ 選択肢を追加」クリックで選択肢が末尾に追加される', async () => {
      const updateQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={updateQuestion} removeQuestion={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: '+ 選択肢を追加' }));
      expect(updateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ options: ['ナチュラル', 'カジュアル', ''] })
      );
    });

    it('先頭の「×」クリックで対応する選択肢が削除される', async () => {
      const updateQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={radioQuestion} updateQuestion={updateQuestion} removeQuestion={vi.fn()} />);
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      await user.click(removeButtons[0]);
      expect(updateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ options: ['カジュアル'] })
      );
    });

    it('必須チェックボックスをクリックすると is_required が反転する', async () => {
      const updateQuestion = vi.fn();
      const user = userEvent.setup();
      render(<SurveyQuestionCard question={textQuestion} updateQuestion={updateQuestion} removeQuestion={vi.fn()} />);
      await user.click(screen.getByRole('checkbox', { name: /必須/ }));
      expect(updateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ is_required: true })
      );
    });
  });
});
