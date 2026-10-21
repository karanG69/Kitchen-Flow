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
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while genrating refresh and access tokens")
    }
}

const registerStaff = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        throw new ApiError(400, "All fields are required");
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
        throw new ApiError(409, "Staff with this email already exists");
    }

    const newStaff = new Staff({
        name: username,
        email,
        passwordHash: password,
        role
    });

    await newStaff.save();

    return res.status(201).json(new ApiResponse(201, newStaff, "Staff registered successfully"));   
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

        const staff = await Staff.findOne({ email }).select("+passwordHash");

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

        staff.refresh
        Token = null;
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