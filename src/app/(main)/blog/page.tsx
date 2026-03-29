export default function ResourcesPage() {
  return (
    <section className="min-h-screen bg-[#001049] py-16 px-4 font-poppins">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-center font-['Syne-Bold'] text-white mb-3">Resources</h1>
        <p className="text-white/70 text-center text-sm mb-10">Helpful guides and resources for AMSA students.</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-5">
          <iframe
            src="https://publuu.com/flip-book/1080174/2408563/page/1?embed"
            width="100%"
            height="900"
            scrolling="no"
            frameBorder={0}
            allow="clipboard-write; autoplay; fullscreen"
            allowFullScreen
            className="publuuflip rounded-xl"
            title="AMSA Resources"
          />
        </div>
      </div>
    </section>
  );
}
