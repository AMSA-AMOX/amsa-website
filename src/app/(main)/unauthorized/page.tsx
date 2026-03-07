import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="max-w-3xl mx-auto p-10 bg-white shadow-lg rounded-lg my-12 text-center">
      <h1 className="text-3xl font-bold text-[#001A78] mb-4">Unauthorized</h1>
      <p className="text-gray-700 mb-8">
        You do not have permission to view this page.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          className="border-2 border-[#001A78] text-[#001A78] px-6 py-3 rounded-lg hover:bg-[#001A78] hover:text-white transition"
        >
          Go Home
        </Link>
        <Link
          href="/login"
          className="border-2 border-[#001A78] text-[#001A78] px-6 py-3 rounded-lg hover:bg-[#001A78] hover:text-white transition"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
