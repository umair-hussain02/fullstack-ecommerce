import mongoose, { Schema, trusted } from "mongoose";

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            unique: true,
            required: true,
            lowerCase: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        sold: {
            type: Number,
            default: 0,
        },
        images: [
            {
                public_id: String,
                url: String,
            },
        ],
        color: [{ type: mongoose.Schema.Types.ObjectId, ref: "Color" }],
        tags: String,
        ratings: [
            {
                star: Number,
                comment: String,
                postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            },
        ],
        totalrating: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export const Product = mongoose.model("Product", productSchema);
