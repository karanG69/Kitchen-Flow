import jwt from "jsonwebtoken";
import { Staff } from "../models/staff.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(
    async (req, res, next) => {

        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            throw new ApiError(
                401,
                "Unauthorized request"
            );
        }

        let decodedToken;

        try {
            decodedToken = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );
        } catch (error) {
            throw new ApiError(
                401,
                "Invalid or expired access token"
            );
        }

        const staff = await Staff.findById(
            decodedToken._id
        ).select("-passwordHash");

        if (!staff) {
            throw new ApiError(
                401,
                "Invalid access token"
            );
        }

        if (!staff.active) {
            throw new ApiError(
                403,
                "Staff account is inactive"
            );
        }

        req.staff = staff;

        next();
    }
);

export { verifyJWT };