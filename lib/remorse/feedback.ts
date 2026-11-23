export const FEEDBACK_TOPICS = ['Feature', 'Bug', 'Other'] as const;

export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number];

export const isFeedbackTopic = (value: unknown): value is FeedbackTopic =>
  FEEDBACK_TOPICS.some((topic) => topic === value);
