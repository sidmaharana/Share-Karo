const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage (use a DB for production)
const textDatabase = {};

// File upload handling
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileLink = `/uploads/${req.file.filename}`;
  res.json({ link: fileLink });
});

// API to share text with a code
app.post('/share-text', (req, res) => {
  const { text } = req.body;
  const code = uuidv4().slice(0, 6); // Short 6-char code
  textDatabase[code] = text;
  res.json({ code });
});

// API to get text using code
app.get('/get-text/:code', (req, res) => {
  const { code } = req.params;
  const text = textDatabase[code];
  if (text) {
    res.json({ text });
  } else {
    res.status(404).json({ error: 'Code not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
