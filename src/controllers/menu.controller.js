import { MenuCategory } from "../models/menuCategories.model.js";
import { MenuItem } from "../models/menuItems.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
//import { Staff } from "../models/staff.model.js";


const createMenuCategory = asyncHandler(async (req, res)=>{
    console.log(req.staff);

    if(req.staff?.role !== "manager"){
        throw new ApiError(401, "Only manager can create menu category");
    }

    const { name, sortOrder } = req.body;

    const existingCategory = await MenuCategory.findOne({ name });

    if (existingCategory) {
        throw new ApiError(400, "Menu category already exists");
    }

    const newCategory = new MenuCategory({
        name,
        sortOrder
    });

    await newCategory.save();

    return res.status(201).json(new ApiResponse(201, { category: newCategory }, "Menu category created successfully"));
});


const getMenuCategories = asyncHandler(async (req, res)=>{
    const categories = await MenuCategory.find().sort({ sortOrder: 1 });

    return res.status(200).json(new ApiResponse(200, { categories }, "Menu categories fetched successfully"));
});

const addMenuItem = asyncHandler(async (req, res) => {
    //check if the request is made by a manager
    if (req.staff?.role !== "manager") {
        throw new ApiError(403, "Only managers can create menu items");
    }   
    const { name, categoryId, priceMinor, station, prepMinutes, options } = req.body;

    const existingItem = await MenuItem.findOne({ name, categoryId });

    //check if the categoryId exists in the MenuCategory collection
    const category = await MenuCategory.findById(categoryId);
    if (!category) {
        throw new ApiError(400, "Menu category does not exist");
    }

    if (existingItem) {
        throw new ApiError(400, "Menu item already exists in this category");
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

    return res.status(201).json(new ApiResponse(201, { item: newItem }, "Menu item created successfully"));
});

const getMenuItems = asyncHandler(async (req, res) => { 
    const { categoryId, station, available } = req.query;
    const filter = {};
    if (categoryId) {
        filter.categoryId = categoryId;
    }
    if (station) {
        filter.station = station;
    }
    if (available !== undefined) {
        filter.available = available === "true";
    }                   
    const items = await MenuItem.find(filter).populate("categoryId", "name").sort({ name: 1 });

    return res.status(200).json(new ApiResponse(200, { items }, "Menu items fetched successfully"));
});

// const getMenuItemsByCategory = asyncHandler(async (req, res) => {
//     const { categoryId } = req.params;

//     //check if the categoryId exists in the MenuCategory collection
//     const category = await MenuCategory.findById(categoryId);
//     if (!category) {
//         throw new ApiError(400, "Menu category does not exist");
//     }

//     const items = await MenuItem.find({ categoryId }).populate("categoryId", "name").sort({ name: 1 });

//     return res.status(200).json(new ApiResponse(200, { items }, "Menu items fetched successfully"));
// });

// const getMenuItemByStation = asyncHandler(async (req, res) => {
//     const { station } = req.params;

//     const items = await MenuItem.find({ station }).populate("categoryId", "name").sort({ name: 1 });

//     return res.status(200).json(new ApiResponse(200, { items }, "Menu items fetched successfully"));
// }); 

// const getOnlyAvailableMenuItems = asyncHandler(async (req, res) => {
//     const items = await MenuItem.find({ available: true }).populate("categoryId", "name").sort({ name: 1 });

//     return res.status(200).json(new ApiResponse(200, { items }, "Menu items fetched successfully"));
// });

const updateMenuItem = asyncHandler(async (req, res) => {
    // Only managers can update menu items
    if (req.staff?.role !== "manager") {
        throw new ApiError(
            403,
            "Only managers can update menu items"
        );
    }

    const { itemId } = req.params;

    const {
        categoryId,
        name,
        priceMinor,
        station,
        prepMinutes,
        options,
        available
    } = req.body;

    // Allow only supported fields to be updated
    const updateData = {};

    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name;
    if (priceMinor !== undefined) updateData.priceMinor = priceMinor;
    if (station !== undefined) updateData.station = station;
    if (prepMinutes !== undefined) updateData.prepMinutes = prepMinutes;
    if (options !== undefined) updateData.options = options;
    if (available !== undefined) updateData.available = available;

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
        itemId,
        { $set: updateData },
        {
            returnDocument: "after",
            runValidators: true,
        }
    ).populate("categoryId", "name");

    if (!updatedItem) {
        throw new ApiError(404, "Menu item not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { item: updatedItem },
            "Menu item updated successfully"
        )
    );
});

const updateAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { available } = req.body;

    const updatedItem = await MenuItem.findByIdAndUpdate(id, { available }, { new: true }).populate("categoryId", "name");

    if (!updatedItem) {
        throw new ApiError(404, "Menu item not found");
    }
    return res.status(200).json(new ApiResponse(200, { item: updatedItem }, "Menu item availability updated successfully"));
});


export { 
    createMenuCategory, 
    getMenuCategories, 
    addMenuItem, 
    getMenuItems, 
    updateMenuItem,
    updateAvailability
};