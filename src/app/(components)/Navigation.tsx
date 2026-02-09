export function Navigation() {
  return (
    <nav className="border-b-4 border-black bg-[#FADF0B] px-6 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <span className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide">
          BALLER
        </span>
        <a
          href="/dashboard"
          className="rounded-md border-2 border-black bg-white px-4 py-2 font-semibold"
        >
          Dashboard
        </a>
      </div>
    </nav>
  );
}
