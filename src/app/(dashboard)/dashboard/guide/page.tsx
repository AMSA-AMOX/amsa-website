export default function GuidePage() {
  return (
    <div className="py-15 px-4 md:px-8 max-w-8xl mx-auto">
      <p className="text-gray-400 text-sm mb-8">Helpful guides and resources for AMSA students.</p>
      <div className="bg-white rounded-2xl shadow-sm p-3 md:p-5">
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
          title="AMSA Guide"
        />
      </div>
    </div>
  );
}
