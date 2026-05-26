import type { SurveyQuestion } from '../types';

export const trimSeconds = (time: string): string => time.substring(0, 5);

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildStartTime = (date: Date, time: string): string => {
  return `${formatDateString(date)} ${time}:00`;
};

export const formatSurveyResponses = (
  data: Record<string, unknown>,
  questions: SurveyQuestion[]
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  questions.forEach(q => {
    const answer = data[`survey_${q.id}`];
    if (answer) {
      result[q.question_text] = answer;
    }
  });
  return result;
};

export const extractDate = (startTime: string | undefined): string => {
  if (!startTime) return '';
  return startTime.substring(0, 10);
};

export const extractTime = (startTime: string | undefined): string => {
  if (!startTime) return '';
  return new Date(startTime).toTimeString().substring(0, 5);
};

export const formatSurveyResponse = (responses: Record<string, unknown> | null): string => {
  if (!responses || typeof responses !== 'object') return 'なし';
  return Object.entries(responses).map(([question, answer]) => {
    const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer);
    return `${question}: ${answerText}`;
  }).join(' / ');
};
