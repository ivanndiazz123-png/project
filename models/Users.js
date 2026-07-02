import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'student' },
  theme: { type: String, default: 'green' },
  notifications: { type: Boolean, default: true },
  filesCount: { type: Number, default: 0 },
  totalCompiles: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
