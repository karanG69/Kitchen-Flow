import { Order } from "../models/orders.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { OrderEvent } from "../models/orderEvents.model.js";

const getKitchenQueue = asyncHandler(async (req, res) => {
    if(req.staff?.role !== "kitchen"){
        throw new ApiError(403, "Only kitchen staff can access the queue");
    }

    const { station } = req.query;

    const validStaions = [
        "grill",
        "fryer",
        "cold",
        "drinks",
        "dessert"
    ]

    if(!station || !validStaions.includes(station)){
        throw new ApiError(400, "this is not a valid staion");
    }

    const queue = await Order.aggregate([
        {
            $match: {
                status: "accepted",
                "lines.station": station,
                "lines.status": { $in: ["queued", "cooking"] } 
            }
        },
        {
            $unwind: "$lines"
        },
        {
            $match: {
                "lines.station": station,
                "lines.status": { $in: ["queued", "cooking"] }
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        },
        {
            $project: {
                _id: 0,
                orderId: "$_id",
                orderNumber: "$number",
                tableId: "$tableId",
                type: "$type",
                lineId: "$lines._id",
                itemName: "$lines.name",
                quantity: "$lines.quantity",
                note: "$lines.note",
                station: "$lines.station",
                lineStatus: "$lines.status",
                createdAt: 1,
                minutesWaiting: {
                    $dateDiff: {
                        startDate: "$createdAt",
                        endDate: "$$NOW",
                        unit: "minute"
                    }
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, queue, "Kitchen queue fetched successfully")
    );
});

const startCooking = asyncHandler(async(req, res)=>{
    if(req.staff?.role!=="kitchen"){
        throw new ApiError(403, "Only kitchen staff can start cooking");
    }

    const { lineId } = req.params;

    const order = await Order.findOne({
        "lines._id": lineId
    });

    if(!order){
        throw new ApiError(404, "Order Line not found");
    }

    if (order.status !== "accepted") {
        throw new ApiError(
            409,
            "Cannot start a line unless the order is accepted"
        );
    }

    const line = order.lines.id(lineId);
    if (line.status !== "queued") {
        throw new ApiError(
            409,
            "Order line has already started or is no longer queued"
        );
    }


    // Start preparing the line
    line.status = "cooking";

    await order.save();

    // Record the event
    const orderEvent = new OrderEvent({
        orderId: order._id,
        eventType: "item_started",
        toStatus: order.status,
        eventData: {
            lineId: line._id,
            itemName: line.name,
            station: line.station,
            startedBy: req.staff._id
        }
    });

    await orderEvent.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orderId: order._id,
                orderNumber: order.number,
                line
            },
            "Order line preparation started"
        )
    );
});

const markKitchenLineReady = asyncHandler(async (req, res) => {
    // Only kitchen staff can mark lines ready
    if (req.staff?.role !== "kitchen") {
        throw new ApiError(
            403,
            "Only kitchen staff can mark lines ready"
        );
    }

    const { lineId } = req.params;

    // Find the order containing this line
    const order = await Order.findOne({
        "lines._id": lineId
    });

    if (!order) {
        throw new ApiError(404, "Order line not found");
    }

    // Order must be accepted
    if (order.status !== "accepted") {
        throw new ApiError(
            409,
            "Order must be accepted before a line can be marked ready"
        );
    }

    const line = order.lines.id(lineId);

    // Only cooking lines can be marked ready
    if (line.status !== "cooking") {
        throw new ApiError(
            409,
            "Only cooking lines can be marked ready"
        );
    }

    // Mark this line as ready
    line.status = "ready";

    // Check whether every line in the order is ready
    const allLinesReady = order.lines.every(
        orderLine => orderLine.status === "ready"
    );

    let orderBecameReady = false;

    if (allLinesReady) {
        order.status = "ready";
        order.readyAt = new Date();
        orderBecameReady = true;
    }

    // Save line and order status together in one document write
    await order.save();

    // Record the line-ready event
    await OrderEvent.create({
        orderId: order._id,
        eventType: "item_ready",
        toStatus: order.status,
        eventData: {
            lineId: line._id,
            itemName: line.name,
            station: line.station,
            readyBy: req.staff._id
        }
    });

    // Record the order-ready event if this was the last line
    if (orderBecameReady) {
        await OrderEvent.create({
            orderId: order._id,
            eventType: "order_ready",
            toStatus: "ready",
            eventData: {
                message: "All order lines are ready"
            }
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orderId: order._id,
                orderNumber: order.number,
                orderStatus: order.status,
                line,
                orderBecameReady
            },
            orderBecameReady
                ? "Line marked ready. All order lines are ready."
                : "Order line marked ready successfully"
        )
    );
});
 


export { 
    getKitchenQueue,
    startCooking,
    markKitchenLineReady
};