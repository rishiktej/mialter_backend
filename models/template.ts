// models/Template.ts
import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unit: String,
    c: Number,
    widthInput: Number,
    heightInput: Number,
    bgColor: String,
    bgImg: String,
    images: [
        {
            src: String,
            x: Number,
            y: Number,
            width: Number,
            height: Number,
            rotate: Number,
            lockAspectRatio: Boolean,
            shape: String,
        },
    ],
});

export default mongoose.model("Template", templateSchema);
