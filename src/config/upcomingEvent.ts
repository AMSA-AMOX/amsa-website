// ─────────────────────────────────────────────────────────────────────────────
// UPCOMING EVENT CONFIG
// Toggle ENABLED to show/hide the announcement bar + section on the landing page.
// Swap out the fields below for the next event.
// ─────────────────────────────────────────────────────────────────────────────

const upcomingEvent = {
  ENABLED: true,

  // Short label shown in the announcement bar
  barText: "CHANGE YOUR FUTURE 2026!",
  barCta: "Register Now →",

  // Section heading & subtext
  title: "Change Your Future 2026",
  subtitle:
    "АНУ болон бусад орны топ их сургуулиудад тэнцсэн оюутнуудтай уулзах, туршлагыг нь сонсох боломжыг бүү алдаарай! Панел хэлэлцүүлгээс эхлээд богино сургалт болон дэлхийн шилдэг их дээд сургуулийн цогц экспо болно гээд боддоо! 🤩\n\nХүсэл мөрөөдлөө тодорхой болгож, зорилгынхоо төлөө эхний алхмаа эндээс та хийгээрэй!",

  // Date / location blurb shown next to the card deck
  date: "06/21/2026",
  time: "09:00 - 17:00",
  location: "Тусгаар Тогтнолын Ордон",

  // Google Form (or any URL) for registration
  registrationUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdEysA3ELCs1JB_uwbyBXZa4zGrp8L3KWUT-A5IUF_5vko14A/viewform?usp=dialog",

  // Images for the card deck — add / remove as needed
  images: [
    "/2026/cyf/cyf1.jpg",
    "/2026/cyf/cyf2.jpg",
    "/2026/cyf/cyf3.jpg",
    "/2026/cyf/cyf4.jpg",
    "/2026/cyf/cyf5.jpg",
    "/2026/cyf/cyf6.jpg",
  ],

  // URL of the dedicated event page
  pageUrl: "/upcoming-event",

  // DOM id (used internally, not needed for the dedicated-page approach)
  sectionId: "upcoming-event",
};

export default upcomingEvent;
