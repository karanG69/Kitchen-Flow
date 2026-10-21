import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    openOrder,
    getOrders,   
    addItemstoOrder
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post(
    "/",
    verifyJWT,
    openOrder
)

orderRouter.get(
    "/",
    getOrders
)

orderRouter.post(
    "/:orderId/lines",
    verifyJWT,
    addItemstoOrder
)


export default orderRouter;
