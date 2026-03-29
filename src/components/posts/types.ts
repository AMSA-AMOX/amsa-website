export type PostAuthor = {
  id: number;
  firstName: string;
  lastName: string;
  headline: string | null;
  profilePic: string | null;
};

export type PostItem = {
  id: number;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
  appreciationCount: number;
  hasAppreciated: boolean;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt?: string | null;
  reviewNote?: string | null;
  author: PostAuthor | null;
};
