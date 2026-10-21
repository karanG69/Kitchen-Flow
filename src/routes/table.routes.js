import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTable, 
    getTables,
    updateTable,
    archiveTable
} from "../controllers/table.controller.js";

const tableRouter = Router();

tableRouter.post(
    "/",
    verifyJWT,
    createTable
)

tableRouter.get(
    "/",
    getTables
)

tableRouter.patch(
    "/:tableId",
    verifyJWT, 
    updateTable
)

export default tableRouter;
