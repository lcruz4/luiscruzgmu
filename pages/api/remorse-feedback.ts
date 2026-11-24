import { isFeedbackTopic } from '@/lib/remorse/feedback';
import { emailRoute, escapeHtml, isEmail } from '@/services/email';

// Remorse Chess feedback form. email is optional: blank means no reply wanted
export default emailRoute(({ topic, message, email }) => {
  if (
    !isFeedbackTopic(topic) ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return 'please provide a topic and a message';
  }
  if (message.length > 5000) return 'message is too long';
  const replyTo = isEmail(email) ? email : undefined;
  if (email !== undefined && email !== '' && !replyTo) {
    return 'that email address looks wrong';
  }
  return {
    to: 'remorsechess@lcruz.dev',
    replyTo,
    template: {
      id: 'remorse-feedback',
      variables: {
        topic,
        message: escapeHtml(message),
        email: replyTo ? escapeHtml(replyTo) : 'not given',
      },
    },
  };
});
