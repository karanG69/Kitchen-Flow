import mongoose, {Schema} from "mongoose";

const staffSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash:{
        type: String,
        select: false,
        required: [ true, "Password is required"],
    },
    role: {
        type: String,
        enum: ["waiter", "kitchen", "manager"],
        default: "waiter"
    },
    active: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String
    },
},
{
    timestamps: true
});

staffSchema.pre("save", async function(next) { 
    if (!this.isModified("passwordHash")) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
});

staffSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
};

staffSchema.genrateAccessToken = function() {
    const payload = {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role
    };
    return jwt.sign(payload, process.env.ACCESS_SECRET, { expiresIn: process.env.ACCESS_EXPIRES_IN });
};

staffSchema.methods.generateRefreshToken = function() {
    const payload = {
        id: this._id
    };
    return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
};

export const Staff = mongoose.model("Staff", staffSchema);