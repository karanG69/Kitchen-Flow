import mongoose, {Schema} from "mongoose";

const menuItemSchema = new Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuCategory",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        priceMinor: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "priceMinor must be a whole number"
            }
        },

        station: {
            type: String,
            enum: ["grill", "fryer", "cold", "drinks", "dessert"],
            required: true
        },

        prepMinutes: {
            type: Number,
            required: true,
            min: 0
        },

        options: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                priceMinor: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        available: {
            type: Boolean,
            default: true
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

menuItemSchema.index(
    { categoryId: 1, name: 1 },
    { unique: true }
);

menuItemSchema.index({
    station: 1,
    available: 1
});

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);