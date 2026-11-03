const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('node:stream');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'));
      return;
    }
    callback(null, true);
  },
});

function ensureCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary is not configured');
    error.statusCode = 503;
    throw error;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function uploadImage(folder) {
  return (req, res, next) => {
    if (!req.file) {
      res.status(400).json({ error: 'An image file is required' });
      return;
    }

    try {
      ensureCloudinaryConfigured();
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) {
            next(error);
            return;
          }
          req.uploadedImageUrl = result.secure_url;
          next();
        },
      );
      Readable.from(req.file.buffer).pipe(stream);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { upload, uploadImage };
