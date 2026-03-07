import Link from "next/link";

const GOFUNDME_URL =
  "https://www.gofundme.com/f/amsa-general-fundraising-campaign-2024?utm_campaign=p_lico+share-sheet&utm_medium=copy_link&utm_source=customer";

type Option = {
  href: string;
  external?: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
};

const options: Option[] = [
  {
    href: "/get-involved/partner",
    title: "Partner with AMSA",
    description:
      "Organizations and institutions interested in collaborating with us — from corporate sponsorships to academic and community partnerships.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    cta: "Submit Partnership Interest",
  },
  {
    href: GOFUNDME_URL,
    external: true,
    title: "Donate",
    description:
      "Support Mongolian students across America. Every contribution helps us fund scholarships, events, and community programs.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    cta: "Donate on GoFundMe",
  },
  {
    href: "/get-involved/club-interest",
    title: "Club Interest",
    description:
      "Are you a student club or organization looking to fundraise and collaborate? Tell us about your club and how we can support you.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    cta: "Submit Club Interest",
  },
];

const cardClass =
  "group bg-white rounded-2xl shadow-md p-8 flex flex-col items-start hover:shadow-xl hover:-translate-y-1 transition-all duration-300";

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen bg-[#FFFCF3]">
      {/* Header */}
      <div className="bg-[#001049] py-20 px-6 text-center">
        <h1 className="font-['Syne-Bold'] text-4xl md:text-5xl text-white mb-4">
          Get Involved
        </h1>
        <p className="text-white/75 text-lg max-w-2xl mx-auto">
          Whether you&apos;re an organization, an individual supporter, or a student club — there&apos;s a place for you in the AMSA community.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {options.map((opt) => {
          const inner = (
            <>
              <div className="text-[#001A78] mb-4 group-hover:text-[#FFCA3A] transition-colors duration-300">
                {opt.icon}
              </div>
              <h2 className="font-['Syne-Bold'] text-xl text-[#001A78] mb-3">
                {opt.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-6">
                {opt.description}
              </p>
              <span className="text-[#001A78] font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all duration-200">
                {opt.cta}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </>
          );

          return opt.external ? (
            <a
              key={opt.href}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass}
            >
              {inner}
            </a>
          ) : (
            <Link key={opt.href} href={opt.href} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
