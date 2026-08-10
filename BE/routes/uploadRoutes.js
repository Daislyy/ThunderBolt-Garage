import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { userService } from '../services/userService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `profile_${Date.now()}_${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  }
});

const router = Router();

// Upload profile image for a user
router.post('/:id/profile-image', upload.single('profile_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const userId = req.params.id;
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Get old profile image to delete
    const user = await userService.getUserById(userId);
    if (user && user.profile_image) {
      const oldPath = path.join(__dirname, '..', user.profile_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user profile_image in DB
    await userService.updateUser(userId, { profile_image: imageUrl });

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: { profile_image: imageUrl }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete profile image for a user
router.delete('/:id/profile-image', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);

    if (user && user.profile_image) {
      const oldPath = path.join(__dirname, '..', user.profile_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await userService.updateUser(userId, { profile_image: null });

    res.json({ success: true, message: 'Profile image removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
