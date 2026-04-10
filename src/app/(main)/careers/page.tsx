type Position = {
  id: number;
  title: string;
  type: string;
  location: string;
  shortDesc: string;
  applyUrl: string;
};

const positions: Position[] = [
  {
    id: 1,
    title: "Marketing Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Shape AMSA's brand voice and grow our community presence across digital channels.",
    applyUrl: "https://forms.google.com/",
  },
  {
    id: 2,
    title: "Public Relations Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Represent AMSA externally and build the relationships that expand our community's reach.",
    applyUrl: "https://forms.google.com/",
  },
  {
    id: 3,
    title: "Software Engineer Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Build the platform that powers the Mongolian student community across America.",
    applyUrl: "https://forms.google.com/",
  },
];

function PositionRow({ position, index }: { position: Position; index: number }) {
  return (
    <div className="border-b border-white/10 last:border-0 px-8 py-7 flex items-center gap-6 hover:bg-white/3 transition-colors">
      <span className="text-white/20 font-['Syne-Bold'] text-3xl select-none w-10 shrink-0">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex-1 min-w-0">
        <h3 className="font-['Syne-Bold'] text-xl text-white mb-1">{position.title}</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest">{position.type}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/50 text-xs">{position.location}</span>
        </div>
        <p className="text-white/50 text-sm leading-relaxed">{position.shortDesc}</p>
      </div>

      <a
        href={position.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hero-cta hero-cta-sm shrink-0"
      >
        Apply
        <span className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </a>
    </div>
  );
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#001049]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-10 pt-24 pb-16">
        <p className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-5">
          Join the Team
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h1 className="font-['Syne-Bold'] text-5xl md:text-7xl text-white leading-none">
            Open<br />Positions
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed lg:text-right">
            All roles are internship positions open to current students and recent graduates. Fully remote.
          </p>
        </div>

        {/* Divider with count */}
        <div className="mt-14 flex items-center gap-4">
          <span className="text-white/30 text-sm">{positions.length} positions open</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* Positions list */}
      <div className="max-w-7xl mx-auto px-10 pb-24">
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          {positions.map((position, i) => (
            <PositionRow key={position.id} position={position} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
