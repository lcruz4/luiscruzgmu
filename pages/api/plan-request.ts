import { emailRoute, isEmail } from '@/services/email';

const REQUEST_ADDRESS = 'workouttrackerrequest@lcruz.dev';

// Public (sign-in page uses it), so it lives outside the auth-protected /api/workout-tracker namespace
export default emailRoute(({ email }) => {
  if (!isEmail(email)) return 'please provide a valid email';
  return {
    from: `Workout Tracker <${REQUEST_ADDRESS}>`,
    to: REQUEST_ADDRESS,
    replyTo: email,
    subject: `Free plan request: ${email}`,
    text: `${email} is requesting a free workout tracker plan.`,
  };
});
