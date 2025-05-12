import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { isValidMongoId } from "../utils/isValidMongoId.js";
import { Cart } from "../models/cart.model.js";

// Cookies Options
const option = {
    httpOnly: true,
    secure: true,
    maxAge: 72 * 60 * 60 * 1000,
};

// generate AccessToken and RefreshToken
const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { refreshToken, accessToken };
    } catch (error) {
        throw new apiError(
            500,
            "Something went wrong while generating tokens..."
        );
    }
};

// Create User--------------------------------------
const createRegister = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email });
    if (findUser) {
        throw new apiError(400, "User with this email already exits....");
    }
    const createdUser = await User.create(req.body);
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User Created Sucessfully."));
});

// login User--------------------------------------
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ((!email, !password)) {
        throw new apiError(400, "Email and password is required...");
    }

    const user = await User.findOne({ email });
    if (user) {
        throw new apiError(
            400,
            "User with this email does not exists. Please SignUp..."
        );
    }
    const isPasswordCorrect = User.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Wrong Password...");
    }
    const { refreshToken, accessToken } = await generateAccessandRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(200)
        .cookie("Refresh Token", refreshToken, option)
        .cookie("Access Token", accessToken, option)
        .json(new ApiResponse(200, loggedInUser, "User logIn successfully..."));
});

// Login Admin--------------------
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ((!email, !password)) {
        throw new apiError(400, "Email and password is required...");
    }

    const user = await User.findOne({ email });
    if (user) {
        throw new apiError(
            400,
            "User with this email does not exists. Please SignUp..."
        );
    }

    const isPasswordCorrect = User.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Wrong Password...");
    }

    if (user.role !== "admin") {
        throw new apiError(400, "Not Authorized...");
    }

    const { refreshToken, accessToken } = await generateAccessandRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(200)
        .cookie("RefreshToken", refreshToken, option)
        .cookie("AccessToken", accessToken, option)
        .json(
            new ApiResponse(200, loggedInUser, "Admin logIn successfully...")
        );
});

// Handle Refresh Token-----------------

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies.RefreshToken || req.body.RefreshToken;
    if (!incomingToken) {
        throw new apiError(401, "Unauthorized Request...");
    }

    try {
        const decodedToken = jwt.verify(
            incomingToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id);
        if (!user) {
            throw new apiError(401, "Invalid Refresh Token...");
        }
        if (incomingToken !== user.refreshToken) {
            throw new apiError(401, "Refresh Token is expired...");
        }
        const { accessToken, refreshToken } =
            await generateAccessandRefreshToken(user._id);
        res.status(200)
            .cookie("AccessToken", accessToken, option)
            .cookie("RefreshToken", refreshToken, option)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access Token Refreshed..."
                )
            );
    } catch (error) {
        throw new apiError(401, error?.message, "Invalid refresh Token...");
    }
});

// logout User/ admin ------------------

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?.id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .clearCookies("AccessToken", option)
        .clearCookies("RefreshToken", option)
        .json(new ApiResponse(200, {}, "User Logged Out sucessfully..."));
});

// update user details------------------
const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    isValidMongoId(_id);

    try {
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                firstName: req?.body?.firstName,
                lastName: req?.body?.lastName,
                email: req?.body?.email,
                lastName: req?.body?.lastName,
                mobNumb: req?.body?.mobNumb,
            },
            {
                new: true,
            }
        );
        return res.status(
            200,
            new ApiResponse(
                200,
                updatedUser,
                "User Details updated successfully...."
            )
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in updating user details..."
        );
    }
});

// save user address--------------------
const saveAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    isValidMongoId(_id);

    try {
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                address: req?.body?.address,
            },
            {
                new: true,
            }
        );
        return res.status(
            200,
            new ApiResponse(
                200,
                updatedUser,
                "User Details updated successfully...."
            )
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in updating user details..."
        );
    }
});

// Get All Users------------------------
const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.findById().populateI("wishlist");
        return res.status(
            200,
            new ApiResponse(200, users, "Users Fetched Successfull...")
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in fatching all users...."
        );
    }
});

// Get single User------------------------
const getSingleUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    isValidMongoId(id);
    try {
        const user = await User.findById(id);
        return res.status(
            200,
            new ApiResponse(200, user, "User Fetched Successfull...")
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in fatching Single users...."
        );
    }
});

// Delete User ----------------------------
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    isValidMongoId(id);
    try {
        const deletedUser = await User.findByIdAndDelete(id);
        return res.status(
            200,
            new ApiResponse(200, deletedUser, "User Deleted Successfull...")
        );
    } catch (error) {
        throw new apiError(401, error.message || "Error in deleting user....");
    }
});

// Block User------------------------
const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    isValidMongoId(id);
    try {
        const blockedUser = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
            {
                new: true,
            }
        );
        return res.status(
            200,
            new ApiResponse(200, blockedUser, "User blocked Successfull...")
        );
    } catch (error) {
        throw new apiError(401, error.message || "Error in blocking user....");
    }
});

// Unblock User ---------------------
const unBlockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    isValidMongoId(id);
    try {
        const unBlockedUser = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
            },
            {
                new: true,
            }
        );
        return res.status(
            200,
            new ApiResponse(200, unBlockedUser, "User unblocked Successfull...")
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in unblocking user...."
        );
    }
});

// Change Password ----------------------
const changePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.user;
    isValidMongoId(id);

    try {
        const user = await User.findById(_id);
        if (password) {
            user.password = password;
            const updatedUser = await user.save();
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        updatedUser,
                        "Password Updated Successfull..."
                    )
                );
        }
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in Updating password..."
        );
    }
});

// Forgot Password Token-----------------
const forgotPasswordToken = asyncHandler(async (req, res) => {
    // remaining
});

// Get user wishlist --------------------
const getWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    isValidMongoId(_id);
    try {
        const wishlist = await User.findById(_id).populate("wishlist");
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    wishlist,
                    "Wishlist fetched successfully..."
                )
            );
    } catch (error) {
        throw new apiError(401, "Error in Fetching wishlist...");
    }
});

// add to Cart -----------------------

const addToCart = asyncHandler(async (req, res) => {
    const { productId, color, price, quantity } = req.body;
    const { _id: userId } = req.user;
    isValidMongoId(userId);

    try {
        let newCart = await new Cart({
            userId,
            productId,
            price,
            quantity,
            color,
        }).save();
        return res.status(
            200,
            new ApiResponse(
                200,
                newCart,
                "Product added to cart Successfully..."
            )
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Failed to add product in cart..."
        );
    }
});

// Get User Cart -------------------

const userCart = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user;
    isValidMongoId(userId);
    try {
        const cart = await Cart.find({ userId })
            .populate("productId")
            .populate("color");

        return res.status(
            200,
            new ApiResponse(200, cart, "User Cart Fetched Successfully...")
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Error in Fetching User Cart..."
        );
    }
});

// Delete Product from cart-----------

const deleteProductToCart = asyncHandler(async (req, res) => {
    const { cartItemId } = req.params;
    const { _id: userId } = req.user;
    isValidMongoId(userId);

    try {
        let removefromCart = await Cart.deleteOne({ userId, _id: cartItemId });
        return res.status(
            200,
            new ApiResponse(
                200,
                removefromCart,
                "Product removed to cart Successfully..."
            )
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Failed to remove product in cart..."
        );
    }
});

// Update product quantity to cart ------------
const updateProductQuantity = asyncHandler(async (req, res) => {
    const { cartItemId, newQuantity } = req.params;
    const { _id: userId } = req.user;
    isValidMongoId(userId);

    try {
        const cartItem = await Cart.find({ _id: cartItemId, userId });
        cartItem.quantity = newQuantity;
        cartItem.save();
        return res.status(
            200,
            new ApiResponse(
                200,
                cartItem,
                "Product quantity updated to cart Successfully..."
            )
        );
    } catch (error) {
        throw new apiError(
            401,
            error.message || "Failed to update quantity in cart..."
        );
    }
});
