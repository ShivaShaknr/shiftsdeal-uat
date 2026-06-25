import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  image?: string;
  role: 'renter' | 'owner' | 'admin';
  phone?: string;
  organization?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: String,
    role: {
      type: String,
      enum: ['renter', 'owner', 'admin'],
      default: 'renter',
    },
    phone: String,
    organization: String,
    emailVerified: Date,
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
