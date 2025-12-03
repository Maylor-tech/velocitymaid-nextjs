/**
 * User Data Model and Utilities
 * 
 * TODO: Replace with database queries when connecting to real DB
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'CLEANER' | 'SUPPORT';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  primaryBranchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserBranch {
  id: string;
  userId: string;
  branchId: string;
  createdAt: string;
}

/**
 * Mock users storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_USERS: User[] = [];

/**
 * Mock user branches storage
 * TODO: Replace with database table
 */
const MOCK_USER_BRANCHES: UserBranch[] = [];

/**
 * Find user by ID
 * TODO: Replace with database SELECT WHERE id = ?
 */
export function findUserById(id: string): User | null {
  return MOCK_USERS.find(u => u.id === id) || null;
}

/**
 * Find user by email
 * TODO: Replace with database SELECT WHERE email = ?
 */
export function findUserByEmail(email: string): User | null {
  return MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Get users by role
 * TODO: Replace with database SELECT WHERE role = ?
 */
export function getUsersByRole(role: UserRole): User[] {
  return MOCK_USERS.filter(u => u.role === role);
}

/**
 * Get user branches
 * TODO: Replace with database SELECT WHERE userId = ?
 */
export function getUserBranches(userId: string): UserBranch[] {
  return MOCK_USER_BRANCHES.filter(ub => ub.userId === userId);
}

/**
 * Create user branch assignment
 * TODO: Replace with database INSERT
 */
export function createUserBranch(assignment: Omit<UserBranch, 'id' | 'createdAt'>): UserBranch {
  const newAssignment: UserBranch = {
    id: `ub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...assignment,
    createdAt: new Date().toISOString(),
  };
  
  MOCK_USER_BRANCHES.push(newAssignment);
  return newAssignment;
}

/**
 * Update user
 * TODO: Replace with database UPDATE
 */
export function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
  const user = findUserById(id);
  if (!user) {
    return null;
  }
  
  const updated: User = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_USERS.findIndex(u => u.id === id);
  if (index !== -1) {
    MOCK_USERS[index] = updated;
  }
  
  return updated;
}

/**
 * Database Schema (for future migration)
 * 
 * See prisma/schema.prisma for full Prisma schema
 */



