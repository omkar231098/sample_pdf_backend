const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://omkardhanave:omkar@cluster0.liqetg2.mongodb.net/SamplePDF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create mongoose model for storing user data
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Express session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Middleware to check user authentication
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  // Hash the password before saving it to the database
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword });
  await user.save();

  res.status(201).send('User registered successfully');
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    // Create a token and store it in a cookie
    const token = jwt.sign({ username: user.username }, 'your-secret-key');
    req.session.user = user;
    res.cookie('token', token, { httpOnly: true });

    res.status(200).send('Login successful');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('token');
  res.status(200).send('Logout successful');
});

// API endpoint for saving user data
// API endpoint for saving user data
app.post('/api/users',authenticateUser, upload.single('photo'), async (req, res) => {
  try {
    const { name } = req.body;

    // Save data to MongoDB
    const user = new User({ name, photo: req.file.buffer.toString('base64') });
    await user.save();

    // Generate PDF
    const pdfDoc = new PDFDocument();
    pdfDoc.text(`Name: ${name}`);
    pdfDoc.image(Buffer.from(req.file.buffer), { width: 100, height: 100 });
    pdfDoc.end();

    // Convert PDF to buffer
    const pdfBuffer = await new Promise((resolve) => {
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Send the PDF buffer as response
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(pdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
