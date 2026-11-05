import { emailRoute, escapeHtml, isEmail } from '@/services/email';

export default emailRoute(({ name, email, message }) => {
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof message !== 'string' ||
    !message.trim() ||
    !isEmail(email)
  ) {
    return 'please provide name, email, and message';
  }
  return {
    to: 'contactform@lcruz.dev',
    replyTo: email,
    template: {
      id: 'lcruzdev-contact-form',
      variables: {
        NAME: escapeHtml(name),
        EMAIL: escapeHtml(email),
        MESSAGE: escapeHtml(message),
      },
    },
  };
});
