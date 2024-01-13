const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const cors = require('cors'); // Import the cors middleware
const app = express();
const port = process.env.PORT || 3001;
app.use(cors()); // Enable CORS for all routes
// MongoDB connection
mongoose.connect('mongodb+srv://omkardhanave:omkar@cluster0.liqetg2.mongodb.net/SamplePDF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create mongoose model for storing data
const User = mongoose.model('User', {
  name: String,
  photo: String,
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// API endpoint for saving user data
// API endpoint for saving user data
app.post('/api/users', upload.single('photo'), async (req, res) => {
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
