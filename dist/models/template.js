"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/Template.ts
const mongoose_1 = __importDefault(require("mongoose"));
const templateSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
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
exports.default = mongoose_1.default.model("Template", templateSchema);
