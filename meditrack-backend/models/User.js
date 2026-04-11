// User Model - Base for all user types
// Fields: id, email, password_hash, phone, role, status, language, created_at, updated_at

module.exports = {
  createUser: async (pool, userData) => {
    // Implementation
  },
  getUserById: async (pool, userId) => {
    // Implementation
  },
  getUserByEmail: async (pool, email) => {
    // Implementation
  },
  updateUser: async (pool, userId, updateData) => {
    // Implementation
  },
  deleteUser: async (pool, userId) => {
    // Implementation
  },
};
