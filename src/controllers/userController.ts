import {Request, Response} from "express";
import {JWTUserPayload } from "../utils/jwt";
import User from "../models/User";
import {StatusCodes} from "http-status-codes";
import {BadRequestError, NotFoundError, UnauthenticatedError} from "../errors";
import {v2 as cloudinary} from 'cloudinary';

export type UPDATE_USER_PARAMS = {
    firstName: string;
    lastName: string;
    age?: number;
}

export type UPDATE_PASSWORD_PARAMS = {
    oldPassword: string;
    newPassword: string;
}
export const getCurrentUser = async (req: Request, res: Response)=> {
    const {userId} = req.user as JWTUserPayload;

    const user = await User.findOne({_id: userId}).select('name email')

    return res.status(StatusCodes.OK).json({user})
}

export const updateUser = async (req: Request, res: Response) => {
    const {firstName, lastName, age } = req.body as UPDATE_USER_PARAMS;

    const user =
        await User
            .findByIdAndUpdate(
                req.user!.userId,
                {name: `${firstName} ${lastName}`, age},
                { new: true, runValidators: true }
            ).select('name email age');

    res.status(StatusCodes.OK).json({user})
}

export const updateUserPassword = async (req: Request, res: Response)=> {
    const { oldPassword, newPassword } = req.body as UPDATE_PASSWORD_PARAMS;

    if (!oldPassword || !newPassword) {
        throw new BadRequestError('Please provide both values');
    }

    const user = await User.findOne({ _id: req.user!.userId });

    const isPasswordCorrect = await user!.comparePassword(oldPassword);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid old password');
    }

    user!.password = newPassword;

    await user!.save();

    res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
}

export const getSingleUser = async (req: Request, res: Response) =>{
    const user = await User.findOne({ _id: req.params.id }).select('-password');

    if (!user) {
        throw new NotFoundError(`No user with id : ${req.params.id}`);
    }

    return res.status(StatusCodes.OK).json({user})
}

export const updateUserAvatar= async (req: Request, res: Response) =>{
    const b64 = Buffer.from(req.file!.buffer).toString("base64");
    let dataURI = "data:" + req.file!.mimetype + ";base64," + b64;

    const {url} = await cloudinary.uploader.upload(
        // @ts-ignore
        dataURI,
        {
            use_filename: true,
            folder: 'dev',
        }
    );

    const user = await User
            .findByIdAndUpdate(
                req.user!.userId,
                {avatar: url},
                { new: true, runValidators: true }
            ).select('name email age avatar');

    return res.status(StatusCodes.OK).json({user})
}

export const findUserByEmailOrName = async (_: Request, res: Response) =>{

    return res.status(StatusCodes.OK).json({})
}
