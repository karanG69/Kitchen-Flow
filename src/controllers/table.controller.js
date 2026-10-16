import { Table } from "../models/tables.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can create tables" });
    }   
    const { label, seats } = req.body;

    const existingTable = await Table.findOne({ label });

    if (existingTable) {
        return res.status(409).json({ message: "Table already exists" });
    }

    const newTable = new Table({
        label,
        seats
    });

    await newTable.save();

    return res.status(201).json({ message: "Table created successfully", table: newTable });
});

const getTables = asyncHandler(async (req, res) => {
    const tables = await Table.find().sort({ label: 1 });

    return res.status(200).json({ tables });
});

const updateTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can update tables" });
    }   
    const { tableId } = req.params;
    const { label, seats } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
        return res.status(404).json({ message: "Table not found" });
    }

    // Check if the new label is already taken by another table
    if (label && label !== table.label) {
        const existingTable = await Table.findOne({ label });
        if (existingTable) {
            return res.status(409).json({ message: "Another table with this label already exists" });
        }
        table.label = label;
    }

    if (seats) {
        table.seats = seats;
    }

    await table.save();

    return res.status(200).json({ message: "Table updated successfully", table });
});

const archiveTable = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can archive tables" });
    }   
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table) {
        return res.status(404).json({ message: "Table not found" });
    }

    table.archivedAt = new Date();
    await table.save();

    return res.status(200).json({ message: "Table archived successfully", table }); 
});

export { 
    createTable, 
    getTables,
    updateTable,
    archiveTable
};  