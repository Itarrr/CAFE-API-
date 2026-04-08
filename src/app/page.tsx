'use client';

import { AppProvider } from '@/lib/context';
import MainApp from '@/components/main-app';

export default function Home() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
