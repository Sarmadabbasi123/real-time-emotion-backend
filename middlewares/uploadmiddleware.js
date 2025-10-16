const multer = require("multer");
const path = require("path");

// Storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images"); // Save files to /public/images
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `customer_${Date.now()}${ext}`);
  },
});

// File filter to accept only jpg and png
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg and .png files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
