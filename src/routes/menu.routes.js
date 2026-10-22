import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createMenuCategory, 
    getMenuCategories, 
    addMenuItem, 
    getMenuItems, 
    updateMenuItem,
} from "../controllers/menu.controller.js"
//import { MenuItem } from "../models/menuItems.model.js";

const menuRouter = Router();

menuRouter.post(
    "/categories",
    verifyJWT, 
    createMenuCategory
);

menuRouter.get(
    "/categories",
    getMenuCategories
);

menuRouter.post(
    "/items",
    verifyJWT,
    addMenuItem
);

menuRouter.patch(
    "/items/:itemId",
    verifyJWT,
    updateMenuItem
);

menuRouter.get(
    "/items",
    getMenuItems
);



export default menuRouter;