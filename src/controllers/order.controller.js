import { Order } from "../models/orders.model.js";
import { MenuItem } from "../models/menuItems.model.js";
import { ApiError }from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { OrderEvent } from "../models/orderEvents.model.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";

const openOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can open orders");
    }   

    const { tableId, items, type } = req.body;

    // //check if the tableId exists in the Table collection
    // const table = await Table.findById(tableId);
    // if (!table) {
    //     throw new ApiError(400, "Table does not exist");
    // }
    // //check if the table is already occupied
    // const tableOccupied = await Order.findOne({ tableId, status: "open" });
    // if (tableOccupied) {
    //     throw new ApiError(400, "Table is already occupied");
    // }
    //check if type is valid

    const validTypes = ["dine_in", "takeaway", "delivery"];
    if (!validTypes.includes(type)) {
        throw new ApiError(400, "Invalid order type");
    }   

    if(!Array.isArray(items) || items.length === 0){
        throw new ApiError(400, "At least one item is required to open an order.");
    }

    const  lines = [];
    let subtotalMinor = 0;
    for(const item of items){
        const { menuItemId, quantity } = item;
        const requestedOptions = item.options ?? []; 

        const menuItem = await MenuItem.findOne({
            _id: menuItemId,
            available: true,
            archivedAt: null
        });

        if(!menuItem){
            throw new ApiError(
                404, 
                "Menu Item not found or unavailable"
            );
        }
        
        const selectedOptions = [];
        let optionTotal = 0;
        for (const requestedOption of requestedOptions) {
            const fetchedOption = menuItem.options.find(
                (option) => option.name === requestedOption.name
            );

            if (!fetchedOption) {
                throw new ApiError(
                    400,
                    `Option "${requestedOption.name}" is invalid for "${menuItem.name}"`
                );
            }

            selectedOptions.push({
                name: fetchedOption.name,
                priceMinor: fetchedOption.priceMinor
            });
            optionTotal += fetchedOption.priceMinor;
        }

        const lineTotal = (optionTotal + menuItem.priceMinor)*quantity;
        subtotalMinor += lineTotal;
        
        lines.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            unitPriceMinor: menuItem.priceMinor,
            quantity,
            station: menuItem.station,
            options: selectedOptions
        });
    }


    const newOrder = new Order({
        subtotalMinor,
        number: await generateOrderNumber(),
        tableId: type === "dine_in" ? tableId : null,
        type,
        openedBy: req.staff._id,
        lines, 
        totalMinor: subtotalMinor
    });



    await newOrder.save();

    //create an order event for the new order
    const orderEvent = new OrderEvent({
        orderId: newOrder._id,
        eventType: "order_opened",
        toStatus: newOrder.status,
        eventData: {
            tableId: newOrder.tableId,
            items
        }
    });



    await orderEvent.save();
    return res.status(201).json(new ApiResponse(201, newOrder, "Order opened successfully")); 
}); 

const getOrders = asyncHandler(async (req, res) => {
    const { status, tableId } = req.query;
    const filter = {};
    if (status) {
        filter.status = status;
    }
    if (tableId) {
        filter.tableId = tableId;
    }
    
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    return res.status(200).json(new ApiResponse(200, order, "Order fetched successfully"));
});

const addItemstoOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can add items to orders");
    }   
    
    const { orderId } = req.params;
    const { items } = req.body;

    //check if the orderId exists in the Order collection and is open
    const order = await Order.findById(orderId);
    if (!order || order.status !== "open") {
        throw new ApiError(404, "Order not open or not found");
    }

    for(const item of items){
        const { menuItemId, quantity } = item;
        const requestedOptions = item.options ?? []; 

        const menuItem = await MenuItem.findOne({
            _id: menuItemId,
            available: true,
            archivedAt: null
        });

        if(!menuItem){
            throw new ApiError(
                404, 
                "Menu Item not found or unavailable"
            );
        }
        
        const selectedOptions = [];

        for (const requestedOption of requestedOptions) {
            const fetchedOption = menuItem.options.find(
                (option) => option.name === requestedOption.name
            );

            if (!fetchedOption) {
                throw new ApiError(
                    400,
                    `Option "${requestedOption.name}" is invalid for "${menuItem.name}"`
                );
            }

            selectedOptions.push({
                name: fetchedOption.name,
                priceMinor: fetchedOption.priceMinor
            });
        }

        order.lines.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            unitPriceMinor: menuItem.priceMinor,
            quantity,
            station: menuItem.station,
            options: selectedOptions
        });
    }

    await order.save();

    //create an order event for the new item added to the order
    const orderEvent = new OrderEvent({
        orderId: order._id,
        eventType: "items_added",
        toStatus: order.status,
        eventData: {
            items
        }   
    });

    await orderEvent.save();
    return res.status(200).json(new ApiResponse(200, order, "Item added to order successfully")); 
}); 

const updateOrderLine = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can update order lines");
    }   

    const { orderId, lineId } = req.params;
    const { quantity, options } = req.body;

    //check if the orderId exists in the Order collection and is open
    const order = await Order.findById(orderId);
    if (!order || order.status !== "open") {
        throw new ApiError(404, "Order not open or not found");
    }

    //find the line to update
    const line = order.lines.id(lineId);
    if (!line) {
        throw new ApiError(404, "Line not found");
    }   

    //update the line
    line.quantity = quantity;
    line.options = options;
    await order.save();

    //create an order event for the updated line
    const orderEvent = new OrderEvent({
        orderId: order._id,
        eventType: "item_updated",
        toStatus: order.status,
        eventData: {
            lineId,
            quantity,
            options
        }   
    });

    await orderEvent.save();
    return res.status(200).json(new ApiResponse(200, order, "Item updated in order successfully")); 
});

const deleteOrderLine = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (!req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can delete order lines");
    }

    const { orderId, lineId } = req.params;

    //check if the orderId exists in the Order collection and is open
    const order = await Order.findById(orderId);
    if (!order || order.status !== "open") {
        throw new ApiError(404, "Order not open or not found");
    }

    //find the line to delete
    const line = order.lines.id(lineId);
    if (!line) {
        throw new ApiError(404, "Line not found");
    }

    //remove the line
    line.remove();
    await order.save();

    //create an order event for the deleted line
    const orderEvent = new OrderEvent({
        orderId: order._id,
        eventType: "item_deleted",
        toStatus: order.status,
        eventData: {
            lineId
        }   
    });

    await orderEvent.save();
    return res.status(200).json(new ApiResponse(200, order, "Item deleted from order successfully")); 
}); 


const placeOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can place orders");
    }   
    
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "open") {
        throw new ApiError(404, "Order not found or not open");
    }
    order.status = "placed";
    order.placedAt = new Date();
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order placed successfully"));
});


const acceptOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a chef only
    if (req.staff?.role !== "chef") {
        throw new ApiError(403, "Only chefs can accept orders");
    }   
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "placed") {
        throw new ApiError(404, "Order not found or not placed");
    }
    order.status = "accepted";
    order.acceptedAt = new Date();
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order accepted successfully"));
});


const rejectOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a chef only
    if (req.staff?.role !== "chef") {
        throw new ApiError(403, "Only chefs can reject orders");
    }   
    const { closeReason } = req.body;
    if( closeReason?.trim() === "") {
        throw new ApiError(400, "Close reason is required to reject an order");
    }
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "placed") {
        throw new ApiError(404, "Order not found or not placed");
    }
    order.status = "rejected";
    order.rejectedAt = new Date();
    order.closeReason = closeReason;
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order rejected successfully"));
}); 


const serveOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") { 
        throw new ApiError(403, "Only waiters can serve orders");
    }   
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "ready") {
        throw new ApiError(404, "Order not found or not ready");
    }
    order.status = "served";
    order.servedAt = new Date();
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order served successfully"));
});


const payOrder = asyncHandler(async (req, res) => {
    //check if the req. is made by a waiter only
    if (req.staff?.role !== "waiter") {
        throw new ApiError(403, "Only waiters can pay orders");
    }   
    const { orderId } = req.params;
    const { method } = req.body;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "served") {
        throw new ApiError(404, "Order not found or not served");
    }
    order.paymentMethod = method;
    order.status = "paid";
    order.tableId = null; //free the table
    order.paidAt = new Date();
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order paid successfully"));
});

const cancelOrder = asyncHandler(async(req, res) =>{
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const role = req.staff?.role;

    const canCancel =
        (role === "waiter" && order.status === "open") ||
        (role === "manager" && order.status === "accepted");

    if (!canCancel) {
        throw new ApiError(
            403,
            "You are not allowed to cancel this order at its current stage"
        );
    }

    const { closeReason } = req.body;

    if (role === "manager" && !closeReason?.trim()) {
        throw new ApiError(400, "Close reason is required");
    }

    order.status = "cancelled";
    order.closeReason = closeReason?.trim() || null;

    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order Cancelled"));
});

const refundOrder = asyncHandler(async (req, res) => {
    if(req.staff.role !== "manager"){
        throw new ApiError(404, "Only manager can refund an oreder");
    }

    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "paid") {
        throw new ApiError(404, "Order not found or cannot be refunded");
    }

    const { refundAmount, closeReason } = req.body;

    if(!closeReason || !refundAmount){
        throw new ApiError(403, "Amount and close reason is required");
    }

    if(refundAmount > order.totalMinor){
        throw new ApiError(400, "Refund amount cannot axceed total");
    }

    order.status = "refunded";
    order.closeReason = closeReason;
    await order.save();
    return res.status(200).json(new ApiResponse(200, "Amout Refunded"));
});


export {
    openOrder,
    getOrders,
    getOrderById,
    addItemstoOrder,
    updateOrderLine,
    deleteOrderLine,
    rejectOrder,
    placeOrder,
    acceptOrder,
    serveOrder,
    payOrder,
    cancelOrder,
    refundOrder
}
