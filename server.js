const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3001;
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://omkardhanave:omkar@cluster0.liqetg2.mongodb.net/MyPdfData?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create mongoose models for storing data
const User = mongoose.model('User', {
  username: String,
  password: String,
  pdfs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pdf' }],
});

const Pdf = mongoose.model('Pdf', {
  name: String,
  age: Number,
  address: String,
  photo: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ username, password });

    if (user) {
      // Set the session cookie for authentication
   
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint for user logout
app.post('/api/logout', (req, res) => {
  // Destroy the session and clear the cookie
  req.session.destroy();
  res.status(200).send('Logout successful');
});

// API endpoint for registering users
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Save user data to MongoDB
    const user = new User({ username, password });
    await user.save();

    res.status(201).send('User registered successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint for saving user details and generating PDF
app.post('/api/users', upload.single('photo'), async (req, res) => {
  try {
    const { name, age, address } = req.body;

    // Generate PDF
    const pdfDoc = new PDFDocument();
    pdfDoc.text(`Name: ${name}`);
    pdfDoc.text(`Age: ${age}`);
    pdfDoc.text(`Address: ${address}`);
    pdfDoc.image(Buffer.from(req.file.buffer), { width: 100, height: 100 });
    pdfDoc.end();

    // Convert PDF to buffer
    const pdfBuffer = await new Promise((resolve) => {
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Find the user by the provided username
    // const user = await User.findOne({ username: req.cookies.username });

   
      // Save PDF data to MongoDB
      const pdf = new Pdf({ name, age, address, photo: pdfBuffer.toString('base64') });
      await pdf.save();

      // Update the user's pdfs array with the new PDF
     
      

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
