import { describe, expect, it } from 'vitest';
import { branchScopeLabel } from '../branchScopeLabel';

const branches = [
  { id: '1', name: 'Vermont', slug: 'vermont' },
  { id: '2', name: 'New Jersey', slug: 'new-jersey' },
];

describe('branchScopeLabel', () => {
  it('returns All branches when no branch is selected', () => {
    expect(
      branchScopeLabel({
        branchParam: '',
        branches,
        isBranchScoped: false,
      })
    ).toBe('All branches');
  });

  it('returns the selected branch name', () => {
    expect(
      branchScopeLabel({
        branchParam: 'new-jersey',
        branches,
        isBranchScoped: false,
      })
    ).toBe('New Jersey');
  });

  it('locks to the assigned branch for branch-scoped admins', () => {
    expect(
      branchScopeLabel({
        branchParam: '',
        branches: [branches[0]],
        isBranchScoped: true,
        branchName: 'Vermont',
      })
    ).toBe('Vermont');
  });
});
