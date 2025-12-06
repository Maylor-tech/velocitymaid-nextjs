/**
 * Resolves branch slugs to their database format
 * Handles legacy slugs and normalizes them
 */
export function resolveBranchSlug(slug: string): string {
  // Map legacy slugs to new format
  if (slug === "nj") return "new-jersey-branch";
  if (slug === "new-jersey") return "new-jersey-branch";
  
  // Return as-is if already in correct format
  return slug;
}

