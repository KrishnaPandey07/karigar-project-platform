const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { BadRequestError } = require('./errors');

// Ensure local upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const docsDir = path.join(uploadDir, 'documents');
const imagesDir = path.join(uploadDir, 'images');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'document') {
      cb(null, docsDir);
    } else {
      cb(null, imagesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File Type Filter
const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedDocMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  if (file.fieldname === 'document') {
    if (allowedDocMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Invalid file type for document. Only PDF, JPG, and PNG are accepted.'), false);
    }
  } else {
    if (allowedImageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Invalid image type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

/**
 * Handle upload dispatch to Cloudinary if configured, else return local URL
 */
async function processUploadedFile(file, isPrivate = false) {
  if (!file) return null;

  // Cloudinary fallback: if cloudinary env is configured, upload
  if (
    config.CLOUDINARY_CLOUD_NAME &&
    config.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    config.CLOUDINARY_API_KEY &&
    config.CLOUDINARY_API_SECRET
  ) {
    try {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: config.CLOUDINARY_CLOUD_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
      });

      const options = {
        folder: isPrivate ? 'locallink/private_docs' : 'locallink/public_profiles',
        resource_type: 'auto',
      };

      if (isPrivate) {
        options.type = 'authenticated';
      }

      const uploadResult = await cloudinary.uploader.upload(file.path, options);
      // Remove temporary disk file
      fs.unlink(file.path, () => {});
      return uploadResult.secure_url;
    } catch (err) {
      console.warn('Cloudinary upload fallback to local storage:', err.message);
    }
  }

  // Local URL fallback
  const subFolder = file.fieldname === 'document' ? 'documents' : 'images';
  return `/uploads/${subFolder}/${file.filename}`;
}

module.exports = {
  upload,
  processUploadedFile,
};
