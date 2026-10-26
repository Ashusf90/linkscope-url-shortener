import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    clickedAt: { type: Date, default: Date.now },
    referrer: { type: String, default: 'Direct' },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
  },
  { _id: false },
);

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalUrl: { type: String, required: true },
    alias: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, default: null },
    disabled: { type: Boolean, default: false },
    clicks: { type: [clickSchema], default: [] },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const Link = mongoose.models.Link || mongoose.model('Link', linkSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
