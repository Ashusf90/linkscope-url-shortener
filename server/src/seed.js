import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Link, User } from './models.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/linkscope';
const email = process.env.DEMO_EMAIL || 'demo@example.com';
const password = process.env.DEMO_PASSWORD || 'DemoPass123!';

await mongoose.connect(mongoUri);

let user = await User.findOne({ email });
if (!user) {
  user = await User.create({
    name: 'Demo User',
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
}

let link = await Link.findOne({ user: user._id, alias: 'welcome-demo' });
if (!link) {
  const referrers = ['Direct', 'https://google.com', 'https://github.com'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  const browsers = ['Chrome', 'Safari', 'Firefox'];

  link = await Link.create({
    user: user._id,
    originalUrl: 'https://example.com',
    alias: 'welcome-demo',
    clicks: Array.from({ length: 18 }, (_, index) => ({
      clickedAt: new Date(Date.now() - (17 - index) * 86_400_000),
      referrer: referrers[index % referrers.length],
      device: devices[index % devices.length],
      browser: browsers[index % browsers.length],
    })),
  });
}

console.log(`Demo account: ${email} / ${password}`);
console.log(
  `Demo link: ${process.env.BASE_URL || 'http://localhost:5000'}/${link.alias}`,
);
await mongoose.disconnect();
