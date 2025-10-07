import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save uploads under backend/uploads/chats
// server.js serves static files from path.join(backendDir, 'uploads')
// Here, __dirname = backend/src/middleware, so backendDir = __dirname/../..
const CHAT_UPLOAD_DIR = path.join(__dirname, "../../uploads/chats");

// Ensure upload directory exists
if (!fs.existsSync(CHAT_UPLOAD_DIR)) {
  fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CHAT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `chat-${req.user?.id || "anon"}-${uniqueSuffix}${extension}`);
  },
});

// Allow images and common files; enforce a safe size limit (10MB)
const allowedImage = /jpeg|jpg|png|gif|webp/;

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept all files, but we can optionally restrict by mimetype/extension here
    // For images, ensure extension+mimetype matches allowedImage
    const isImage = file.mimetype.startsWith("image/");
    if (isImage) {
      const extname = allowedImage.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedImage.test(file.mimetype);
      if (!(extname && mimetype)) {
        return cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed for image uploads"));
      }
    }
    cb(null, true);
  },
});

export default upload;
