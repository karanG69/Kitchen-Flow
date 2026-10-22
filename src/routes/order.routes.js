import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    openOrder,
    getOrders,   
    addItemstoOrder,
    updateOrderLine,
    deleteOrderLine,
    placeOrder,
    acceptOrder,
    rejectOrder,
    serveOrder,
    payOrder,
    cancelOrder,
    refundOrder
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

orderRouter.post(
    "/:orderId/lines/:lineId",
    verifyJWT, 
    updateOrderLine
)

orderRouter.delete(
    "/:orderId/lines/:lineId",
    verifyJWT,
    deleteOrderLine
)

orderRouter.post(
    "/:orderId/place",
    verifyJWT,
    placeOrder
)

orderRouter.post(
    "/:orderId/accept",
    verifyJWT,
    acceptOrder
)

orderRouter.post(
    "/:orderId/reject",
    verifyJWT,
    rejectOrder
)

orderRouter.post(
    "/:orderId/serve",
    verifyJWT,
    serveOrder
)

orderRouter.post(
    "/:orderId",
    verifyJWT,
    payOrder
)

orderRouter.post(
    "/:orderId/cancel",
    verifyJWT,
    cancelOrder
)

orderRouter.post(
    "/:orderId/refund",
    verifyJWT,
    refundOrder
)


export default orderRouter;
