"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DriverSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true },
    vehicleNumber: { type: String, required: true, uppercase: true },
    vehicleType: {
        type: String,
        enum: ['bike', 'car', 'van', 'truck'],
        default: 'bike',
    },
    licenseNumber: { type: String, required: true },
    status: {
        type: String,
        enum: ['offline', 'online', 'busy'],
        default: 'offline',
    },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
    },
    isBlocked: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // New drivers are pending approval
    role: { type: String, default: 'driver', immutable: true },
}, { timestamps: true });
// ── Indexes ────────────────────────────────────────────────────────────────────
// email unique index is already created by { unique: true } on the field above
DriverSchema.index({ status: 1 });
DriverSchema.index({ isAvailable: 1 });
// ── Hash password before save ──────────────────────────────────────────────────
// Mongoose 7+: async pre-hooks don't receive a `next` callback — just return a Promise
DriverSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    this.password = await bcryptjs_1.default.hash(this.password, 12);
});
// ── Password comparison method ─────────────────────────────────────────────────
DriverSchema.methods.comparePassword = async function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.Driver = mongoose_1.default.model('Driver', DriverSchema);
//# sourceMappingURL=Driver.js.map