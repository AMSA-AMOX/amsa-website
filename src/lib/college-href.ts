/** Route of a college's info page; null when the school never resolved to one. */
export const collegeHref = (collegeId: number | null | undefined): string | null =>
  collegeId ? `/dashboard/research/college/${collegeId}` : null;
