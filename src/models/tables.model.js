import mongoose, {Schema} from "mongoose";

const tableSchema = new Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true
        },

        seats: {
            type: Number,
            required: true,
            min: 1
        },

        currentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null
        },

        archivedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

tableSchema.index(
    { label: 1 },
    { unique: true }
);

tableSchema.index({
    currentOrderId: 1
});

export const Table = mongoose.model("Table", tableSchema);