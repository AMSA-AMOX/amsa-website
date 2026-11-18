/**
 * Board members (every @amsa.mn account is one) can't delete anything — their
 * own posts, reviews or questions, reported content, or their account. Only
 * admins can. The API enforces this (`assertCanDelete` in lib/auth.ts); this
 * just hides the buttons that would fail.
 */
export const canDelete = (role: string | null | undefined): boolean => role !== "board_member";
