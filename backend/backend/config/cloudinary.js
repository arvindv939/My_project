const cloudinary = require("cloudinary").v2;
const cors = require('cors');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "greenmart_products",
    allowedFormats: ["jpeg", "jpg", "png"],
  },
});

module.exports = { cloudinary, storage };
