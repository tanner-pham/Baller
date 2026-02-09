export function Features() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <article className="rounded-xl border-4 border-black p-5">
          <h3 className="text-xl font-bold">Price Check</h3>
          <p className="mt-2">Compare nearby listings and typical market range.</p>
        </article>
        <article className="rounded-xl border-4 border-black p-5">
          <h3 className="text-xl font-bold">Risk Flags</h3>
          <p className="mt-2">Highlight suspicious wording and unusual pricing.</p>
        </article>
        <article className="rounded-xl border-4 border-black p-5">
          <h3 className="text-xl font-bold">Deal Score</h3>
          <p className="mt-2">Get a quick confidence score before messaging the seller.</p>
        </article>
      </div>
    </section>
  );
}
