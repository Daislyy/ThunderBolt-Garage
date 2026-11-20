import supabase from '../config/database.js';

// Use the existing "avatars" bucket that is already created & public in Supabase
const BUCKET = 'avatars';

/**
 * Upload a file buffer to Supabase Storage.
 * @param {Buffer} fileBuffer  - raw file bytes (from multer memoryStorage)
 * @param {string} fileName    - desired object name, e.g. "profile_171234_123456.jpg"
 * @param {string} mimeType    - e.g. "image/jpeg"
 * @returns {string} public URL of the uploaded image
 */
export async function uploadProfileImage(fileBuffer, fileName, mimeType) {
  const filePath = `profiles/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true, // overwrite if same name
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete a profile image from Supabase Storage.
 * @param {string} publicUrl - the full public URL previously saved in DB
 */
export async function deleteProfileImage(publicUrl) {
  if (!publicUrl) return;

  // Extract the path after the bucket name
  // URL pattern: .../storage/v1/object/public/profile-images/profiles/filename.jpg
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // not a supabase storage URL, skip

  const filePath = publicUrl.substring(idx + marker.length);

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.warn('Supabase delete warning:', error.message);
  }
}
