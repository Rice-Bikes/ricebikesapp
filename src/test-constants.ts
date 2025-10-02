/**
 * Shared test constants for use across test files
 * Constants extracted to avoid React Fast Refresh warnings
 */

export const mockUser = {
  user_id: 'test123',
  username: 'test123',
  firstname: 'Test',
  lastname: 'User',
  active: true,
  permissions: [{
    id: 1,
    name: 'admin',
    description: 'Administrator'
  }]
};
