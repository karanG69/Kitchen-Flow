import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    staffLogin,
    staffLogout,
    registerStaff, 
} from "../controllers/staff.controller.js";

const staffRouter = Router();

staffRouter.post(
    "/login",
    staffLogin
);

staffRouter.post(
    "/logout",
    verifyJWT,
    staffLogout
);

staffRouter.post(
    "/register",
    registerStaff
);

export default staffRouter;