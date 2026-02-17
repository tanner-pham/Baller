import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

function DashboardFallback() {
  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="inline-flex items-center rounded-xl border-5 border-black bg-white px-6 py-4 font-['Anton',sans-serif] text-2xl uppercase shadow-[6px_6px_0px_0px_#000000]">
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
