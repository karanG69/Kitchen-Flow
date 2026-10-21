import { Table } from "../models/tables.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (req.staff?.role !== "manager") {
        throw new ApiError(403, "Only managers can create tables");
    }   
    const { label, seats } = req.body;

    const existingTable = await Table.findOne({ label });

    if (existingTable) {
        throw new ApiError(409, "Table already exists");
    }

    const newTable = new Table({ 
        label,
        seats
    });

    await newTable.save();

    return res.status(201).json(new ApiResponse(201, newTable, "Table created successfully"));
});

const getTables = asyncHandler(async (req, res) => {
    const tables = await Table.find().sort({ label: 1 });

    return res.status(200).json(new ApiResponse(200, { tables }, "Tables fetched successfully"));
});

const updateTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (req.staff?.role !== "manager") {
        throw new ApiError(403, "Only managers can update tables");
    }   
    const { tableId } = req.params;
    const { label, seats } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
        throw new ApiError(404, "Table not found");
    }

    // Check if the new label is already taken by another table
    if (label && label !== table.label) {
        const existingTable = await Table.findOne({ label });
        if (existingTable) {
            throw new ApiError(409, "Another table with this label already exists");
        }
        table.label = label;
    }

    if (seats) {
        table.seats = seats;
    }

    await table.save();

    return res.status(200).json(new ApiResponse(200, table, "Table updated successfully"));
});

const archiveTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        throw new ApiError(403, "Only managers can archive tables");
    }   
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table) {
        throw new ApiError(404, "Table not found");
    }

    table.archivedAt = new Date();
    await table.save();

    return res.status(200).json(new ApiResponse(200, table, "Table archived successfully"));
});

export { 
    createTable, 
    getTables,
    updateTable,
    archiveTable
};  