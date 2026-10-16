import { MenuCategory } from "../models/menuCategories.mdoel";
import { MenuItem } from "../models/menuItems.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createMenuCategory = asyncHandler(async (req, res)=>{
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can create menu categories" });
    }   
    const { name, sortOrder } = req.body;

    const existingCategory = await MenuCategory.findOne({ name });

    if (existingCategory) {
        return res.status(400).json({ message: "Menu category already exists" });
    }

    const newCategory = new MenuCategory({
        name,
        sortOrder
    });

    await newCategory.save();

    return res.status(201).json({ message: "Menu category created successfully", category: newCategory });
});


const getMenuCategories = asyncHandler(async (req, res)=>{
    const categories = await MenuCategory.find().sort({ sortOrder: 1 });

    return res.status(200).json({ categories });
});

const createmenuItem = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (!req.user || req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can create menu items" });
    }   
    const { name, categoryId, priceMinor, station, prepMinutes, options } = req.body;

    const existingItem = await MenuItem.findOne({ name, categoryId });

    //check if the categoryId exists in the MenuCategory collection
    const category = await MenuCategory.findById(categoryId);
    if (!category) {
        return res.status(400).json({ message: "Menu category does not exist" });
    }

    if (existingItem) {
        return res.status(400).json({ message: "Menu item already exists in this category" });
    }       

    const newItem = new MenuItem({
        name,
        categoryId,
        priceMinor,
        station,
        prepMinutes,
        options
    });

    await newItem.save();  

    return res.status(201).json({ message: "Menu item created successfully", item: newItem });
});

const getMenuItems = asyncHandler(async (req, res) => { 
    const items = await MenuItem.find().populate("categoryId", "name").sort({ name: 1 });

    return res.status(200).json({ items });
});

const getMenuItemsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    //check if the categoryId exists in the MenuCategory collection
    const category = await MenuCategory.findById(categoryId);
    if (!category) {
        return res.status(400).json({ message: "Menu category does not exist" });
    }

    const items = await MenuItem.find({ categoryId }).populate("categoryId", "name").sort({ name: 1 });

    return res.status(200).json({ items });
});

const getMenuItemByStation = asyncHandler(async (req, res) => {
    const { station } = req.params;

    const items = await MenuItem.find({ station }).populate("categoryId", "name").sort({ name: 1 });

    return res.status(200).json({ items });
}); 

const getOnlyAvailableMenuItems = asyncHandler(async (req, res) => {
    const items = await MenuItem.find({ available: true }).populate("categoryId", "name").sort({ name: 1 });

    return res.status(200).json({ items });
});

const updateMenuItem = asyncHandler(async (req, res) => {
    // Implementation for updating a menu item
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, { new: true }).populate("categoryId", "name");

    if (!updatedItem) {
        return res.status(404).json({ message: "Menu item not found" });
    }
    return res.status(200).json({ message: "Menu item updated successfully", item: updatedItem });
});

const updateAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { available } = req.body;

    const updatedItem = await MenuItem.findByIdAndUpdate(id, { available }, { new: true }).populate("categoryId", "name");

    if (!updatedItem) {
        return res.status(404).json({ message: "Menu item not found" });
    }
    return res.status(200).json({ message: "Menu item availability updated successfully", item: updatedItem });
});


export { 
    createMenuCategory, 
    getMenuCategories, 
    createmenuItem, 
    getMenuItems, 
    getMenuItemsByCategory, 
    getMenuItemByStation, 
    getOnlyAvailableMenuItems,
    updateMenuItem
};