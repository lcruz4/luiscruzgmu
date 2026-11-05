import { emailRoute, isEmail } from '@/services/email';

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
    subject: `Contacted by: ${name} - ${email}`,
    text: message,
  };
});
