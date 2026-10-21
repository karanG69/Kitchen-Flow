import { Counter } from "../models/counters.model.js";

const generateOrderNumber = async () => {
    const _id = new Date().toISOString().slice(0, 10);

    const counter = await Counter.findOneAndUpdate(
        { _id },
        { $inc: { seq: 1 } },  
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    const seq = String(counter.seq).padStart(3,"0");

    return `${_id}/${seq}`;
};

export { generateOrderNumber };
