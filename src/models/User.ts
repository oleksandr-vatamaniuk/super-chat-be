import { Model, Schema, model, Document} from 'mongoose';
import validator from "validator";
import bcrypt from 'bcrypt'
export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    age?: Number;
    emailVerificationToken: string;
    isVerified: boolean;
    passwordToken: string;
    passwordTokenExpirationDate: Date | null;
    avatar: string;
    verified: Date;
    tokenVersion: Number;
}

export interface IUserPayload {
   name: string;
   id: string
}

interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<string>;
    getTokenPayload(): IUserPayload
    increaseTokenVersion(): void
}

export type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>({
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
        validate: [ validator.isEmail, 'Please provide valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,
    },
    age: {
        type: Number,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    emailVerificationToken: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    passwordToken: {
        type: String,
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    passwordTokenExpirationDate: {
        type: Date,
    },
    verified: Date
}, {timestamps: true});


UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.method('comparePassword', async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
});


const User = model<IUser, UserModel>('User', UserSchema);
export default User;