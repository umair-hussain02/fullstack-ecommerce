import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const accessToken =
            req.cookies?.AccessToken ||
            req.header("Authorization")?.replace("Bearer", "");
        if (!accessToken) {
            throw new ApiError(401, "Unauthorized Request...");
        }
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token in user");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Invalid Access token... in catch"
        );
    }
});
