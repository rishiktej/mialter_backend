import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  subscription: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Define the User schema
const userSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    subscription: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (
  this: IUser,
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
