import { Suspense } from 'react';
import CompareClient from './CompareClient';
import { appShell, pageFallbackBadge, pageFallbackContainer } from '../consts';

function CompareFallback() {
  return (
    <main className={appShell}>
      <div className={pageFallbackContainer}>
        <div className={pageFallbackBadge}>
          Loading Comparison
        </div>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareClient />
    </Suspense>
  );
}
