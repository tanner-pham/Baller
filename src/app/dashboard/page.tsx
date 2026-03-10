import { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import { appShell, pageFallbackBadge, pageFallbackContainer } from '../consts';

function DashboardFallback() {
  return (
    <main className={appShell}>
      <div className={pageFallbackContainer}>
        <div className={pageFallbackBadge}>
          Loading Dashboard
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient />
    </Suspense>
  );
}
