import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { userService } from '../services/userService.js';
import { uploadProfileImage, deleteProfileImage } from '../services/storageService.js';

// Use memory storage – file stays in RAM buffer, never touches disk.
// The buffer is then uploaded straight to Supabase Storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  },
});

const router = Router();

// ─── Upload profile image → Supabase Storage ───────────────────────
router.post('/:id/profile-image', upload.single('profile_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const userId = req.params.id;

    // Build a unique file name
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const fileName = `profile_${userId}_${Date.now()}${ext}`;

    // Upload to Supabase Storage
    const publicUrl = await uploadProfileImage(
      req.file.buffer,
      fileName,
      req.file.mimetype,
    );

    // Delete the old image from Supabase (if any)
    const user = await userService.getUserById(userId);
    if (user && user.profile_image) {
      await deleteProfileImage(user.profile_image).catch(() => {});
    }

    // Save new URL in DB
    await userService.updateUser(userId, { profile_image: publicUrl });

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: { profile_image: publicUrl },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Delete profile image ──────────────────────────────────────────
router.delete('/:id/profile-image', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);

    if (user && user.profile_image) {
      await deleteProfileImage(user.profile_image).catch(() => {});
    }

    await userService.updateUser(userId, { profile_image: null });

    res.json({ success: true, message: 'Profile image removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
