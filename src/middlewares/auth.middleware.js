import jwt from "jsonwebtoken";
import { Staff } from "../models/staff.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(
    async (req,_, next) => {
        //console.log(req.cookies?.accessToken);
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace(
                "Bearer ",
                ""``
            );
        if (!token) {
            throw new ApiError(
                401,
                "Unauthorized request"
            );
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_SECRET
        );
        const staff = await Staff.findById(
            decodedToken?.id
        );

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