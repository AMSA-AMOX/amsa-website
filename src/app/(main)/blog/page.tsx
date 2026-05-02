export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#001049]">
      <div className="max-w-7xl mx-auto px-10 pt-24 pb-16">
        <p className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-5">
          Library
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h1 className="font-['Syne-Bold'] text-5xl md:text-7xl text-white leading-none">
            Resources
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed lg:text-right">
            Helpful guides, handbooks, and materials for AMSA students navigating life in America.
          </p>
        </div>

        <div className="mt-14 h-px bg-white/10" />
      </div>

      <div className="max-w-7xl mx-auto px-10 pb-24">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-5">
          <iframe
            allowFullScreen
            allow="clipboard-write"
            scrolling="no"
            className="fp-iframe rounded-xl"
            src="https://heyzine.com/flip-book/367fd7c423.html"
            style={{
              border: "1px solid lightgray",
              width: "100%",
              height: "72vh",
              minHeight: "620px",
            }}
            title="AMSA Resources"
          />
        </div>
      </div>
    </main>
  );
}
