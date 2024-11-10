"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUsersByName = exports.updateUserAvatar = exports.getSingleUser = exports.updateUserPassword = exports.updateUser = exports.getCurrentUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const cloudinary_1 = require("cloudinary");
const crypto_1 = __importDefault(require("crypto"));
const getCurrentUser = async (req, res) => {
    const { userId } = req.user;
    const user = await User_1.default.findOne({ _id: userId });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        user: user.getSafetyProperties()
    });
};
exports.getCurrentUser = getCurrentUser;
const updateUser = async (req, res) => {
    const { name, age } = req.body;
    const user = await User_1.default
        .findByIdAndUpdate(req.user.userId, { name: `${name}`, age }, { new: true, runValidators: true });
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: user.getSafetyProperties() });
};
exports.updateUser = updateUser;
const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new errors_1.BadRequestError('Please provide both values');
    }
    const user = await User_1.default.findOne({ _id: req.user.userId });
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new errors_1.UnauthenticatedError('Invalid old password');
    }
    const candidatePasswordVerificationToken = crypto_1.default.randomBytes(40).toString('hex');
    user.password = newPassword;
    user.candidatePassword = newPassword;
    user.candidatePasswordVerificationToken = candidatePasswordVerificationToken;
    await user.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: 'Success! Password Updated.', candidatePasswordVerificationToken: user.candidatePasswordVerificationToken });
};
exports.updateUserPassword = updateUserPassword;
const getSingleUser = async (req, res) => {
    const user = await User_1.default.findOne({ _id: req.params.id }).select('-password');
    if (!user) {
        throw new errors_1.NotFoundError(`No user with id : ${req.params.id}`);
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({ user });
};
exports.getSingleUser = getSingleUser;
const updateUserAvatar = async (req, res) => {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const { url } = await cloudinary_1.v2.uploader.upload(dataURI, {
        use_filename: true,
        folder: 'dev',
    });
    const user = await User_1.default
        .findByIdAndUpdate(req.user.userId, { avatar: url }, { new: true, runValidators: true }).select('name email age avatar');
    return res.status(http_status_codes_1.StatusCodes.OK).json({ user: user.getSafetyProperties() });
};
exports.updateUserAvatar = updateUserAvatar;
const findUsersByName = async (req, res) => {
    const { userId } = req.user;
    const { name } = req.body;
    const users = await User_1.default.find({
        name: { $regex: name, $options: 'i' },
        _id: { $ne: userId }
    }).select('name id email avatar');
    return res.status(http_status_codes_1.StatusCodes.OK).json(users);
};
exports.findUsersByName = findUsersByName;
//# sourceMappingURL=userController.js.map