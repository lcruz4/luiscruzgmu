import { emailRoute, escapeHtml, isEmail } from '@/services/email';

// Public (sign-in page uses it), so it lives outside the auth-protected /api/workout-tracker namespace
export default emailRoute(({ email, route }) => {
  if (!isEmail(email)) return 'please provide a valid email';
  return {
    to: 'workouttrackerrequest@lcruz.dev',
    replyTo: email,
    template: {
      id: 'workout-tracker-request',
      variables: {
        email: escapeHtml(email),
        route:
          typeof route === 'string' && route.startsWith('/')
            ? escapeHtml(route.slice(0, 200))
            : 'unknown',
      },
    },
  };
});
