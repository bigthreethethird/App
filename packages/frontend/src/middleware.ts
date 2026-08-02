import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
const isProtected = createRouteMatcher(['/dashboard(.*)']);
export default clerkMiddleware((auth, req) => {
  if (isProtected(req) && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) auth().protect();
});
export const config = { matcher: ['/((?!_next|.*\\..*).*)'] };
