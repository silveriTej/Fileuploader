const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

app.post('/api/upload', upload.array('file'), (req, res) => {
  res.status(200).json({ message: 'Files uploaded successfully!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
