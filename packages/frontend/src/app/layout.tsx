import type {Metadata} from 'next'; import {ClerkProvider} from '@clerk/nextjs'; import './globals.css';
export const metadata:Metadata={title:'Cannect — Every product has a story',description:'The digital passport for cannabis'};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||'pk_test_placeholder'}><html lang="en"><body>{children}</body></html></ClerkProvider>}
