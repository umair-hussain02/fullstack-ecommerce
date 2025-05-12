import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        shippingInfo: {
            firstname: {
                type: String,
                required: true,
            },
            lastname: {
                type: String,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            other: {
                type: String,
            },
            pincode: {
                type: Number,
                required: true,
            },
        },
        paymentInfo: {
            razorpayOrderId: {
                type: String,
                required: true,
            },
            razorpayPaymentId: {
                type: String,
                required: true,
            },
        },
        orderedItems: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                color: {
                    type: Schema.Types.ObjectId,
                    ref: "Color",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        paidAt: {
            type: Date,
            default: Date.now(),
        },
        month: {
            type: Number,
            default: new Date().getMonth(),
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        totalPriceAfterDiscount: {
            type: Number,
            required: true,
        },
        orderStatus: {
            type: String,
            default: "Ordered",
        },
    },
    {
        timestamps: true,
    }
);

export const Order = mongoose.model("Order", orderSchema);
