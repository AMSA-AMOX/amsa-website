export default function ResearchPage() {
  return (
    <div className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Research</h1>
      <p className="text-gray-400 text-sm mb-8">Academic papers and research from Mongolian students.</p>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 flex gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
