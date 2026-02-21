import multer from 'multer';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024;

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, and PDF files are accepted'));
        }
    },
});
