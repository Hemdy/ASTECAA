import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  appName: 'ASTECAA',
  baseURL: 'http://localhost:8000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    disableSignUp: true,
  },
});
