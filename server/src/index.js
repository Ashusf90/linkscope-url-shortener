import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and configure it.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  app.listen(port, () => {
    console.log(`LinkScope API running on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Startup failed:', error.message);
  process.exit(1);
}
