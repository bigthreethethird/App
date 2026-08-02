import { SignUp } from '@clerk/nextjs';
export default function Page() {
  return <main className="flex min-h-dvh items-center justify-center bg-canvas p-5"><SignUp routing="path" path="/sign-up" appearance={{ elements: { card: 'glass-strong rounded-2xl', headerTitle: 'text-text-primary', formButtonPrimary: 'bg-accent text-text-accent' } }} /></main>;
}
