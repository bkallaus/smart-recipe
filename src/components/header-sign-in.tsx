'use client';
import { usePathname } from 'next/navigation';
import GoogleSignIn from './google-sign-in';

/**
 * The header's signed-out Google button. Hidden on /login, which renders its
 * own button — mounting both gives two buttons and two One Tap prompts.
 */
const HeaderSignIn = () => {
  const pathname = usePathname();

  if (pathname === '/login' || pathname?.startsWith('/login/')) {
    return null;
  }

  return <GoogleSignIn userName={undefined} />;
};

export default HeaderSignIn;
