export default function EventsPage() {
  return (
    <div className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Events</h1>
      <p className="text-gray-400 text-sm mb-8">Upcoming and past AMSA events.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
