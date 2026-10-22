import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getKitchenQueue, 
    markKitchenLineReady, 
    startCooking 
} from "../controllers/kitchen.controller.js";



const kitchenRouter = Router();

kitchenRouter.get(
    "/queue",
    verifyJWT,
    getKitchenQueue
)

kitchenRouter.post(
    "/lines/:lineId/start",
    verifyJWT,
    startCooking
)

kitchenRouter.post(
    "lines/:lineId/ready",
    verifyJWT,
    markKitchenLineReady
)


export default kitchenRouter;