import { emailRoute, isEmail } from '@/services/email';
import { contactEmail } from '@/services/emailTemplates';

const CONTACT_ADDRESS = 'contactform@lcruz.dev';

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
    from: `Contact Form <${CONTACT_ADDRESS}>`,
    to: CONTACT_ADDRESS,
    replyTo: email,
    ...contactEmail({ name, email, message }),
  };
});
