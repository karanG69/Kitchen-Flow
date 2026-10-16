import { Staff } from "../models/staff.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshTokens = async(userId)=>{
    try{    
        const staff = await Staff.findById(userId);

        const accessToken = staff.generateAccessToken();
        const refreshToken = staff.generateRefreshToken();

        staff.refreshToken = refreshToken;
        await staff.save({ validateBeforeSave: false});

        return {accessToken, refreshToken};

    }catch(error){
        throw new ApiError(500, "Something went wrong while genrating refresh and access tokens")
    }
}

const registerStaff = asyncHandler(async (req, res) => {
    // Only managers can register staff
    if (!req.user || req.user.role !== "manager") {
        throw new ApiError(403, "Only managers can register staff");
    }

    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username?.trim() || !email?.trim() || !password || !role) {
        throw new ApiError(
            400,
            "Username, email, password and role are required"
        );
    }

    // Only allow kitchen staff and waiters
    const allowedRoles = ["kitchen", "waiter"];

    if (!allowedRoles.includes(role)) {
        throw new ApiError(
            400,
            "Role must be either kitchen or waiter"
        );
    }

    // Normalize input
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check for an existing account
    const existingStaff = await Staff.findOne({
        $or: [
            { username: normalizedUsername },
            { email: normalizedEmail }
        ]
    });

    if (existingStaff) {
        throw new ApiError(
            409,
            "Staff member with this username or email already exists"
        );
    }

    // Hash password before storing it
    const passwordHash = await bcrypt.hash(password, 12);

    // Create staff account
    const staff = await Staff.create({
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role,
        active: true
    });

    // Exclude sensitive fields from the response
    const createdStaff = await Staff.findById(staff._id)
        .select("-passwordHash -refreshToken -refreshTokens");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdStaff,
                "Staff member registered successfully"
            )
        );
});  

const staffLogin = asyncHandler(
    async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(
                400,
                "Email and password are required"
            );
        }

        const staff = await Staff.findOne({ email });
        
        if (!staff || !(await staff.isPasswordCorrect(password))) {
            throw new ApiError(
                401,
                "Invalid email or password"
            );
        }

        if (!staff.active) {
            throw new ApiError(
                403,
                "Staff account is inactive"
            );
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(staff._id);

        const loggedInStaff = await Staff.findById(staff._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        user: loggedInStaff, accessToken, refreshToken
                    },
                    "Staff logged In Successfully"
                )
            )
    }
);

const staffLogout = asyncHandler(
    async (req, res) => {
        const staffId = req.staff._id;

        const staff = await Staff.findById(staffId);

        if (!staff) {
            throw new ApiError(
                404,
                "Staff not found"
            );
        }

        staff.refreshToken = null;
        await staff.save({ validateBeforeSave: false });

        return res
            .status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Staff logged out successfully"
                )
            );
    }
);  

export {
    staffLogin,
    staffLogout,
    registerStaff
};  