import mongoose, { Schema } from "mongoose";

const orderEventSchema = new mongoose(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },

        fromStatus: {
            type: String,
            default: null
        },

        toStatus: {
            type: String,
            required: true
        },

        byStaffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        },

        reason: {
            type: String,
            default: null
        },

        at: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        timestamps: false
    }
);

orderEventSchema.index({
    orderId: 1,
    at: 1
});

orderEventSchema.index({
    toStatus: 1,
    at: -1
});

export const OrderEvent = mongoose.model(
    "OrderEvent",
    orderEventSchema
);