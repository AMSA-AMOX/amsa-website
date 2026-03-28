export default function FeedPage() {
  return (
    <div className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Feed</h1>
      <p className="text-gray-400 text-sm mb-8">Read updates and stories from the AMSA community.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse">
            <div className="h-36 bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
