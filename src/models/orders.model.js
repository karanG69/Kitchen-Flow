import mongoose, {Schema} from "mongoose";

const orderLineSchema = new Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    unitPriceMinor: {
        type: Number,
        required: true,
        min: 0
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    options: [
        {
            name: {
                type: String,
                required: true
            },
            priceMinor: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],

    station: {
        type: String,
        enum: ["grill", "fryer", "cold", "drinks", "dessert"],
        required: true
    },

    note: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["queued", "cooking", "ready"],
        required: true,
        default: "queued"
    }
});

const orderSchema = new mongoose.Schema(
    {
        number: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            enum: ["dine_in", "takeaway", "delivery"],
            required: true
        },

        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table",
            default: null
        },

        status: {
            type: String,
            enum: [
                "open",
                "placed",
                "accepted",
                "ready",
                "served",
                "paid",
                "cancelled",
                "rejected",
                "refunded"
            ],
            default: "open",
            required: true
        },

        lines: {
            type: [orderLineSchema],
            default: []
        },

        subtotalMinor: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },

        serviceChargeMinor: {
            type: Number,
            //required: true,
            default: 0,
            min: 0
        },

        taxMinor: {
            type: Number,
            //required: true,
            default: 0,
            min: 0
        },

        discountMinor: {
            type: Number,
            //required: true,
            default: 0,
            min: 0
        },

        totalMinor: {
            type: Number,
            //required: true,
            default: 0,
            min: 0
        },

        openedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true
        },

        placedAt: Date,

        acceptedAt: Date,

        readyAt: Date,

        servedAt: Date,

        paidAt: Date,

        paymentMethod: {
            type: String,
            enum: ["cash", "card", "transfer"],
            default: null
        },

        closeReason: {
            type: String,
            default: null
        },

        // idempotencyKey: {
        //     type: String,
        //     default: null
        // }
    },
    {
        timestamps: true
    }
);

orderSchema.index({
    status: 1,
    createdAt: -1
});

orderSchema.index({
    createdAt: -1
});

orderSchema.index({
    tableId: 1,
    status: 1
});

orderSchema.index({
    "lines.station": 1,
    "lines.status": 1
});

orderSchema.index(
    {
        number: 1
    },
    {
        unique: true
    }
);

orderSchema.index(
    {
        idempotencyKey: 1
    },
    {
        unique: true,
        sparse: true
    }
);

export const Order = mongoose.model("Order", orderSchema);