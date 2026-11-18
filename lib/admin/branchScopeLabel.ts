export type BranchOption = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Label shown in the top-bar branch control and under the sidebar logo.
 * "All branches" when the owner/admin has no branchId selected.
 */
export function branchScopeLabel(args: {
  branchParam: string;
  branches: BranchOption[];
  isBranchScoped: boolean;
  branchName?: string;
}): string {
  const { branchParam, branches, isBranchScoped, branchName } = args;

  if (isBranchScoped) {
    return branchName || branches[0]?.name || 'Branch';
  }

  if (!branchParam || branchParam === 'all') {
    return branches.length > 1 || branches.length === 0
      ? 'All branches'
      : branches[0].name;
  }

  const match = branches.find(
    (b) => b.slug === branchParam || b.id === branchParam
  );
  return match?.name || branchParam;
}
