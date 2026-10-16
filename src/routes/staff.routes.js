import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    staffLogin,
    staffLogout,
    createStaff 
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
    "/create",
    verifyJWT,
    createStaff
);

export default staffRouter;