// config/multerConfig.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục 'uploads' nếu chưa tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Đặt thư mục lưu trữ các tệp tin tải lên
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Giới hạn kích thước file và loại file
const upload = multer({
  storage: storage,
  dest: 'uploads/',
});

export default upload;
