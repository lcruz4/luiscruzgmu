import { emailRoute, isEmail } from '@/services/email';
import { planRequestEmail } from '@/services/emailTemplates';

const REQUEST_ADDRESS = 'workouttrackerrequest@lcruz.dev';

// Public (sign-in page uses it), so it lives outside the auth-protected /api/workout-tracker namespace
export default emailRoute(({ email }) => {
  if (!isEmail(email)) return 'please provide a valid email';
  return {
    from: `Workout Tracker <${REQUEST_ADDRESS}>`,
    to: REQUEST_ADDRESS,
    replyTo: email,
    ...planRequestEmail({ email }),
  };
});
