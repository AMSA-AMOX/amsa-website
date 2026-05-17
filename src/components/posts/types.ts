export const POST_TOPICS = [
  "School", "Classes", "Dorm", "Dining", "Campus Life",
  "Social Life", "Clubs", "Sports", "Health", "Housing",
  "Admission", "Internships", "Jobs", "Research", "Finance",
  "Study Abroad", "Events", "Tips", "Fun", "Weather",
] as const;

export type PostTopic = typeof POST_TOPICS[number];

export type PostAuthor = {
  id: number;
  firstName: string;
  lastName: string;
  headline: string | null;
  profilePic: string | null;
};

export type PostCollege = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type PostItem = {
  id: number;
  body: string;
  images: string[];
  createdAt: string;
  appreciationCount: number;
  hasAppreciated: boolean;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt?: string | null;
  reviewNote?: string | null;
  topic?: string | null;
  author: PostAuthor | null;
  college?: PostCollege | null;
};
