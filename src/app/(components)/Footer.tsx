export function Footer() {
  return (
    <footer className="border-t-4 border-black bg-[#F5F5F0] px-6 py-8">
      <div className="mx-auto w-full max-w-5xl text-sm">
        <p>© {new Date().getFullYear()} Baller</p>
      </div>
    </footer>
  );
}
