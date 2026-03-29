export default function GuidePage() {
  return (
    <div className="py-15 px-4 md:px-8 max-w-8xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Guide</h1>
      <p className="text-gray-400 text-sm mb-8">Helpful guides and resources for AMSA students.</p>
      <div className="bg-white rounded-2xl shadow-sm p-3 md:p-5">
        <iframe
          src="https://publuu.com/flip-book/1080174/2408563/page/1?embed"
          width="100%"
          height="900"
          scrolling="no"
          frameBorder={0}
          allow="clipboard-write; autoplay; fullscreen"
          allowFullScreen
          className="publuuflip rounded-xl"
          title="AMSA Guide"
        />
      </div>
    </div>
  );
}
