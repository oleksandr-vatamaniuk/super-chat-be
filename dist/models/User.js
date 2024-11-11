"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
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
        validate: [validator_1.default.isEmail, 'Please provide valid email']
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
    verified: Date,
    googleId: {
        type: String,
        required: false
    }
}, { timestamps: true });
UserSchema.pre('save', async function () {
    const salt = await bcrypt_1.default.genSalt(10);
    if (this.isModified('candidatePassword')) {
        this.candidatePassword = await bcrypt_1.default.hash(this.candidatePassword, salt);
    }
    if (this.isModified('password')) {
        this.password = await bcrypt_1.default.hash(this.password, salt);
    }
});
UserSchema.method('comparePassword', async function (candidatePassword) {
    return await bcrypt_1.default.compare(candidatePassword, this.password);
});
UserSchema.method('getSafetyProperties', function () {
    return {
        avatar: this.avatar,
        email: this.email,
        name: this.name,
        age: this.age,
        id: this._id,
        rooms: [],
        source: []
    };
});
const User = (0, mongoose_1.model)('User', UserSchema);
exports.default = User;
//# sourceMappingURL=User.js.map