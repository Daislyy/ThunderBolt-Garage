import { userService } from '../services/userService.js';

export const userController = {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createUser(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const newUser = await userService.createUser(req.body);
      res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const updated = await userService.updateUser(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found or no changes made' });
      }
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
