import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="bg-[#F5F5F0] px-6 py-6 shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="font-['Bebas_Neue',sans-serif] text-4xl tracking-widest cursor-pointer hover:opacity-70 transition-opacity text-[#030213]"
        >
          BALLER
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border-2 border-[#030213] bg-[#030213] px-6 py-2 font-semibold text-white hover:bg-opacity-90 transition-all"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
