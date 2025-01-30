import { Model, Schema, model, Document } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age?: number;
  emailVerificationToken: string;
  emailTokenExpirationDate: Date | null;
  isVerified: boolean;
  passwordToken: string;
  candidatePassword: string;
  candidatePasswordVerificationToken: string;
  passwordTokenExpirationDate: Date | null;
  avatar: string;
  verified: Date;
  tokenVersion: number;
  googleId?: string;
  updatedAt: string;
}

export interface IUserPayload {
  name: string;
  id: string;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<string>;
  getTokenPayload(): IUserPayload;
  increaseTokenVersion(): void;
  getSafetyProperties(): any;
}

// ts-ignore
export type UserModel = Model<IUser, object, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
      required: [true, 'Please provide name'],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide email'],
      validate: [validator.isEmail, 'Please provide valid email'],
    },
    candidatePasswordVerificationToken: {
      type: String,
      required: false,
    },
    candidatePassword: {
      type: String,
      required: false,
      minlength: 6,
    },
    password: {
      type: String,
      required: [false, 'Please provide password'],
      minlength: 6,
    },
    age: {
      type: Number,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailTokenExpirationDate: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordToken: {
      type: String,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordTokenExpirationDate: {
      type: Date,
    },
    verified: Date,
    googleId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  // if (!this.isModified('password') || !this.isModified('candidatePassword')) return;
  const salt = await bcrypt.genSalt(10);

  if (this.isModified('candidatePassword')) {
    this.candidatePassword = await bcrypt.hash(this.candidatePassword, salt);
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }
});

UserSchema.method(
  'comparePassword',
  async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
);

UserSchema.method('getSafetyProperties', function () {
  return {
    avatar: this.avatar,
    email: this.email,
    name: this.name,
    age: this.age,
    _id: this._id,
    updatedAt: this.updatedAt,
  };
});

const User: UserModel = model<IUser, UserModel>('User', UserSchema);
export default User;
