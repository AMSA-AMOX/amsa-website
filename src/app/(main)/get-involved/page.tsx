import Link from "next/link";

const GOFUNDME_URL =
  "https://www.gofundme.com/f/amsa-general-fundraising-campaign-2024?utm_campaign=p_lico+share-sheet&utm_medium=copy_link&utm_source=customer";

const options = [
  {
    number: "01",
    href: GOFUNDME_URL,
    external: true,
    title: "Donate",
    description:
      "Support Mongolian students across America. Every contribution helps fund scholarships, events, and community programs that change lives.",
    cta: "Donate",
  },
  {
    number: "02",
    href: "/get-involved/club-interest",
    external: false,
    title: "Club Interest",
    description:
      "Are you a student club or organization looking to fundraise and collaborate? Tell us about your club and how we can support each other.",
    cta: "Submit",
  },
  {
    number: "03",
    href: "/get-involved/partner",
    external: false,
    title: "Partner with AMSA",
    description:
      "Organizations and institutions interested in collaborating with us — from corporate sponsorships to academic and community partnerships.",
    cta: "Submit",
  },
];

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen bg-[#001049]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-10 pt-24 pb-16">
        <p className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-5">
          Take Action
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h1 className="font-['Syne-Bold'] text-5xl md:text-7xl text-white leading-none">
            Get<br />Involved
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed lg:text-right">
            Whether you&apos;re an organization, a supporter, or a student club — there&apos;s a place for you in the AMSA community.
          </p>
        </div>

        <div className="mt-14 flex items-center gap-4">
          <span className="text-white/30 text-sm">{options.length} ways to contribute</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* Options */}
      <div className="max-w-7xl mx-auto px-10 pb-24">
        <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10">
          {options.map((opt) => (
            <div
              key={opt.href}
              className="px-10 py-10 flex flex-col md:flex-row md:items-center gap-8 hover:bg-white/3 transition-colors duration-200"
            >
              <span className="text-white/20 font-['Syne-Bold'] text-5xl select-none w-14 shrink-0">
                {opt.number}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-['Syne-Bold'] text-2xl text-white mb-2">
                  {opt.title}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed max-w-xl">
                  {opt.description}
                </p>
              </div>
              {opt.external ? (
                <a href={opt.href} target="_blank" rel="noopener noreferrer" className="hero-cta hero-cta-sm shrink-0">
                  {opt.cta}
                  <span className="icon"><ArrowIcon /></span>
                </a>
              ) : (
                <Link href={opt.href} className="hero-cta hero-cta-sm shrink-0">
                  {opt.cta}
                  <span className="icon"><ArrowIcon /></span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
