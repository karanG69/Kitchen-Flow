import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));  


import staffRouter from "./routes/staff.routes.js";
import menuRouter from "./routes/menu.routes.js";
import tableRouter from "./routes/table.routes.js";
import orderRouter from "./routes/order.routes.js";
import kitchenRouter from "./routes/kitchen.routes.js";

app.use(
    "/api/v1/staff",
    staffRouter
);
app.use(
    "/api/v1/menu",
    menuRouter
)

app.use(
    "/api/v1/tables",
    tableRouter
)

app.use(
    "/api/v1/orders",
    orderRouter
)

app.use(
    "/api/v1/kitchen",
    kitchenRouter
)

export { app };