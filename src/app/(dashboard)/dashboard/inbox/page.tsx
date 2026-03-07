export default function InboxPage() {
  return (
    <div className="py-10 px-4 md:px-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Inbox</h1>
      <p className="text-gray-400 text-sm mb-8">Messages and notifications from AMSA.</p>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
            <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
