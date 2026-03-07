export default function PodcastPage() {
  return (
    <div className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Podcast</h1>
      <p className="text-gray-400 text-sm mb-8">Listen to episodes featuring Mongolian students and professionals.</p>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
