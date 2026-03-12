const multer = require("multer");
const path = require("path");
const fs = require("fs");
/**
 * Configure storage for uploaded resumes
 */
const storage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, `../uploads/${folder}`);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type."), false);
    }
};

const upload = multer({
    storage: storage('resumes'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const offerUpload = multer({
    storage: storage('offer_letters'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { upload, offerUpload };
