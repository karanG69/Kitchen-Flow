import mongoose, {Schema} from "mongoose";

const menuCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },

        sortOrder: {
            type: Number,
            required: true
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

export const MenuCategory = mongoose.model(
    "MenuCategory",
    menuCategorySchema
);