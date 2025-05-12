import mongoose from "mongoose";
import { ApiError } from "./apiError";

export const isValidMongoId = (id) => {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
        throw new ApiError("200", "This is not a valid id or not found...");
    }
};
