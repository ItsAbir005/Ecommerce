"use strict";
/**
 * seed.ts — Amazon-style product seed
 * Uploads all product images to Cloudinary, stores Cloudinary URLs in MongoDB.
 * Run: npm run seed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const Category_1 = require("./models/Category");
const Product_1 = require("./models/Product");
dotenv_1.default.config();
// ── Cloudinary config ─────────────────────────────────────────────────────────
if (process.env.CLOUDINARY_URL) {
    cloudinary_1.v2.config({ url: process.env.CLOUDINARY_URL });
}
else {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
const FOLDER = 'lunar_ecommerce/products';
// ── Helper: upload a URL to Cloudinary ────────────────────────────────────────
async function uploadImage(url, publicId) {
    try {
        const result = await cloudinary_1.v2.uploader.upload(url, {
            folder: FOLDER,
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
        });
        return result.secure_url;
    }
    catch {
        console.warn(`  ⚠ Failed to upload ${publicId}, using original URL`);
        return url;
    }
}
// ── Real product images (Unsplash) ──────────────────────────────────────────
const IMG = {
    // Electronics
    headphones_sony: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=640'],
    macbook: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=640', 'https://images.unsplash.com/photo-1611186871525-12e7851fc3d3?w=640'],
    samsung_tv: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4362b?w=640'],
    iphone: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=640', 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=640'],
    mouse: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=640'],
    galaxy_s24: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=640', 'https://images.unsplash.com/photo-1701770987958-e06be2b2b1dc?w=640'],
    ipad: ['https://images.unsplash.com/photo-1544244015-0df4702b4cd1?w=640', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=640'],
    ps5: ['https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=640'],
    headphones_bose: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=640', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=640'],
    dell_xps: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=640', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=640'],
    gopro: ['https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=640'],
    echo_dot: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=640'],
    // Men Fashion
    oxford_shirt: ['https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=640', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=640'],
    chinos: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=640'],
    hoodie: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=640'],
    blazer_men: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=640', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=640'],
    joggers: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=640'],
    belt: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=640'],
    tshirt_pack: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640'],
    puffer_jacket: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=640', 'https://images.unsplash.com/photo-1548476912-e403c1ab21f1?w=640'],
    // Women Fashion
    floral_dress: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=640', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=640'],
    skinny_jeans: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=640'],
    turtleneck: ['https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=640', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=640'],
    blazer_women: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=640'],
    linen_trousers: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=640'],
    pyjama_set: ['https://images.unsplash.com/photo-1616096142563-ce6506d9e7d9?w=640'],
    mini_skirt: ['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=640'],
    // Footwear
    nike_air_max: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=640'],
    adidas_ultraboost: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=640'],
    new_balance: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=640', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=640'],
    timberland: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=640'],
    birkenstock: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=640'],
    converse: ['https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=640', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=640'],
    // Books
    clean_code: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=640'],
    system_design: ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=640'],
    atomic_habits: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=640'],
    pragmatic: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=640'],
    ddia: ['https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=640'],
    lean_startup: ['https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=640'],
    // Home & Kitchen
    instant_pot: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=640', 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=640'],
    dyson_vacuum: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640'],
    kitchenaid: ['https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=640', 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=640'],
    nespresso: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=640'],
    air_fryer: ['https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=640'],
    towel_set: ['https://images.unsplash.com/photo-1600717535275-0b18ede2f7fc?w=640'],
    // Sports
    backpack: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=640', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=640'],
    resistance_bands: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=640'],
    yoga_mat: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=640'],
    garmin_watch: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=640'],
    tennis_racket: ['https://images.unsplash.com/photo-1617083934555-ac7f4a506e6c?w=640'],
    // Beauty
    dyson_airwrap: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=640', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=640'],
    cerave: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=640'],
    fenty_foundation: ['https://images.unsplash.com/photo-1631214524020-3c69ef2b0a92?w=640'],
    oral_b: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=640'],
    ordinary_serum: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=640'],
    // Toys & Games
    lego: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=640'],
    monopoly: ['https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=640'],
    nintendo_switch: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=640', 'https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=640'],
    jigsaw: ['https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=640'],
    nerf: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=640'],
};
// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
    'Electronics',
    'Men\'s Fashion',
    'Women\'s Fashion',
    'Footwear',
    'Books',
    'Home & Kitchen',
    'Sports & Outdoors',
    'Beauty & Personal Care',
    'Toys & Games',
];
const RAW_PRODUCTS = [
    // ═══ ELECTRONICS (12 products) ══════════════════════════════════════════
    {
        title: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise cancelling with 30-hour battery life. Crystal clear hands-free calling with 8 mics and precise voice pickup. Works with Alexa, Google Assistant.',
        price: 349.99, stock: 120, category: 'Electronics',
        imgs: IMG.headphones_sony,
        variants: [
            { size: 'One Size', color: 'Black', stock: 60 },
            { size: 'One Size', color: 'Silver', stock: 40 },
            { size: 'One Size', color: 'Midnight Blue', stock: 20 },
        ],
        discount: 10,
    },
    {
        title: 'Apple MacBook Air M2 13"',
        description: 'Supercharged by the next-gen M2 chip. Strikingly thin, 13.6-inch Liquid Retina display, 8-core CPU, 10-core GPU, and up to 18 hours of battery life.',
        price: 1099.00, stock: 45, category: 'Electronics',
        imgs: IMG.macbook,
        variants: [
            { size: '8GB / 256GB', color: 'Midnight', stock: 15 },
            { size: '8GB / 512GB', color: 'Starlight', stock: 15 },
            { size: '16GB / 512GB', color: 'Space Gray', stock: 15 },
        ],
        discount: 5,
    },
    {
        title: 'Samsung 65" QLED 4K Smart TV',
        description: 'Quantum HDR 12x, 100% Color Volume with Quantum Dot. Alexa built-in, Real Game Enhancer+ for ultra-low latency. Object Tracking Sound.',
        price: 1299.99, stock: 18, category: 'Electronics',
        imgs: IMG.samsung_tv,
        variants: [],
        discount: 15,
    },
    {
        title: 'iPhone 15 Pro Max 256GB',
        description: 'Titanium design with Action button. A17 Pro chip, 48MP main camera with 5x optical zoom. Always-On Super Retina XDR display.',
        price: 1199.00, stock: 60, category: 'Electronics',
        imgs: IMG.iphone,
        variants: [
            { size: '256GB', color: 'Natural Titanium', stock: 20 },
            { size: '256GB', color: 'Black Titanium', stock: 20 },
            { size: '512GB', color: 'Natural Titanium', stock: 20 },
        ],
        discount: 0,
    },
    {
        title: 'Logitech MX Master 3S Mouse',
        description: 'Ultra-fast MagSpeed electromagnetic scrolling. Works on any surface. 8K DPI optical tracking. Silent clicks with 90% less noise. Ergonomic for full-day comfort.',
        price: 99.99, stock: 200, category: 'Electronics',
        imgs: IMG.mouse,
        variants: [
            { size: 'One Size', color: 'Graphite', stock: 120 },
            { size: 'One Size', color: 'Pale Gray', stock: 80 },
        ],
        discount: 0,
    },
    {
        title: 'Samsung Galaxy S24 Ultra',
        description: 'Galaxy AI on the most powerful Galaxy Ultra ever. Built-in S Pen, 200MP camera, titanium frame, 5000mAh battery with 45W charging.',
        price: 1299.99, stock: 40, category: 'Electronics',
        imgs: IMG.galaxy_s24,
        variants: [
            { size: '256GB', color: 'Titanium Black', stock: 15 },
            { size: '256GB', color: 'Titanium Violet', stock: 15 },
            { size: '512GB', color: 'Titanium Black', stock: 10 },
        ],
        discount: 8,
    },
    {
        title: 'iPad Pro 12.9" M2 Wi-Fi 256GB',
        description: 'Superfast M2 chip, Ultra Retina XDR display with ProMotion. Liquid Retina display with ProMotion, 12MP front camera with Center Stage.',
        price: 1099.00, stock: 35, category: 'Electronics',
        imgs: IMG.ipad,
        variants: [
            { size: '256GB', color: 'Silver', stock: 18 },
            { size: '256GB', color: 'Space Gray', stock: 17 },
        ],
        discount: 0,
    },
    {
        title: 'Sony PlayStation 5 Console',
        description: 'Lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio.',
        price: 499.99, stock: 15, category: 'Electronics',
        imgs: IMG.ps5,
        variants: [
            { size: 'Disc Edition', color: 'White', stock: 10 },
            { size: 'Digital Edition', color: 'White', stock: 5 },
        ],
        discount: 0,
    },
    {
        title: 'Bose QuietComfort 45 Headphones',
        description: 'Noise cancelling headphones with 24-hour battery life. High-fidelity audio with Bose sound. Comfortable over-ear design with plush earcups.',
        price: 279.00, stock: 80, category: 'Electronics',
        imgs: IMG.headphones_bose,
        variants: [
            { size: 'One Size', color: 'Black', stock: 50 },
            { size: 'One Size', color: 'White', stock: 30 },
        ],
        discount: 12,
    },
    {
        title: 'Dell XPS 15 Laptop',
        description: 'InfinityEdge display with OLED option, 13th Gen Intel Core i7, NVIDIA GeForce RTX 4060. 15.6-inch laptop built for creators and professionals.',
        price: 1799.99, stock: 22, category: 'Electronics',
        imgs: IMG.dell_xps,
        variants: [
            { size: 'i7 / 16GB / 512GB', color: 'Platinum Silver', stock: 12 },
            { size: 'i9 / 32GB / 1TB', color: 'Platinum Silver', stock: 10 },
        ],
        discount: 5,
    },
    {
        title: 'GoPro HERO12 Black Action Camera',
        description: 'Stunning 5.3K60 + 4K120 video, HyperSmooth 6.0 stabilisation, 27MP photos. Waterproof to 10m without a case. Front + rear displays.',
        price: 399.99, stock: 55, category: 'Electronics',
        imgs: IMG.gopro,
        variants: [
            { size: 'Camera Only', color: 'Black', stock: 30 },
            { size: 'Bundle Kit', color: 'Black', stock: 25 },
        ],
        discount: 0,
    },
    {
        title: 'Amazon Echo Dot (5th Gen)',
        description: 'Smart speaker with bigger vibrant sound, motion detection, temperature sensor, and Eero Wi-Fi built-in. Alexa can answer questions, play music, control smart home.',
        price: 49.99, stock: 300, category: 'Electronics',
        imgs: IMG.echo_dot,
        variants: [
            { size: 'One Size', color: 'Charcoal', stock: 150 },
            { size: 'One Size', color: 'Glacier White', stock: 100 },
            { size: 'One Size', color: 'Deep Sea Blue', stock: 50 },
        ],
        discount: 20,
    },
    // ═══ MEN'S FASHION (8 products) ══════════════════════════════════════════
    {
        title: 'Classic Slim-Fit Oxford Shirt',
        description: 'Premium 100% cotton Oxford shirt with spread collar. Slim fit, wrinkle-resistant. Machine washable. Perfect for office and smart-casual occasions.',
        price: 59.99, stock: 350, category: "Men's Fashion",
        imgs: IMG.oxford_shirt,
        variants: [
            { size: 'S', color: 'White', stock: 50 },
            { size: 'M', color: 'White', stock: 70 },
            { size: 'L', color: 'White', stock: 70 },
            { size: 'XL', color: 'White', stock: 50 },
            { size: 'M', color: 'Light Blue', stock: 60 },
            { size: 'L', color: 'Light Blue', stock: 50 },
        ],
        discount: 20,
    },
    {
        title: 'Premium Slim-Fit Chinos',
        description: 'Versatile slim-fit chino pants in stretch cotton blend. Smart-casual design with clean lines, hidden elastic waistband for added comfort.',
        price: 69.99, stock: 280, category: "Men's Fashion",
        imgs: IMG.chinos,
        variants: [
            { size: '30x30', color: 'Khaki', stock: 60 },
            { size: '32x30', color: 'Khaki', stock: 60 },
            { size: '34x32', color: 'Navy', stock: 80 },
            { size: '36x32', color: 'Navy', stock: 80 },
        ],
        discount: 0,
    },
    {
        title: 'Oversized Graphic Hoodie',
        description: 'Cozy oversized hoodie with bold front-graphic print. 80% cotton, 20% polyester fleece. Ribbed cuffs and hem, kangaroo pocket.',
        price: 49.99, stock: 0, category: "Men's Fashion",
        imgs: IMG.hoodie,
        variants: [
            { size: 'S', color: 'Charcoal', stock: 0 },
            { size: 'M', color: 'Charcoal', stock: 0 },
            { size: 'L', color: 'Charcoal', stock: 0 },
        ],
        discount: 30,
    },
    {
        title: 'Men\'s Slim Fit Formal Blazer',
        description: 'Sharp slim-cut blazer in premium wool blend. Notch lapel, two-button closure, fully lined interior. Ideal for business meetings and formal events.',
        price: 149.99, stock: 90, category: "Men's Fashion",
        imgs: IMG.blazer_men,
        variants: [
            { size: 'S', color: 'Navy', stock: 20 },
            { size: 'M', color: 'Navy', stock: 30 },
            { size: 'L', color: 'Navy', stock: 25 },
            { size: 'XL', color: 'Charcoal', stock: 15 },
        ],
        discount: 10,
    },
    {
        title: 'Men\'s Relaxed-Fit Joggers',
        description: 'Ultra-soft French terry joggers with elastic waistband and drawstring. Tapered leg, zip pockets. Perfect for lounging or light workouts.',
        price: 44.99, stock: 220, category: "Men's Fashion",
        imgs: IMG.joggers,
        variants: [
            { size: 'S', color: 'Black', stock: 50 },
            { size: 'M', color: 'Black', stock: 70 },
            { size: 'L', color: 'Gray', stock: 60 },
            { size: 'XL', color: 'Gray', stock: 40 },
        ],
        discount: 0,
    },
    {
        title: 'Men\'s Leather Belt',
        description: 'Genuine full-grain leather belt with prong buckle. 1.5-inch wide, hand-stitched edges. Available in multiple lengths. Ages beautifully with wear.',
        price: 34.99, stock: 400, category: "Men's Fashion",
        imgs: IMG.belt,
        variants: [
            { size: '32"', color: 'Brown', stock: 80 },
            { size: '34"', color: 'Brown', stock: 80 },
            { size: '36"', color: 'Black', stock: 80 },
            { size: '38"', color: 'Black', stock: 80 },
            { size: '40"', color: 'Black', stock: 80 },
        ],
        discount: 0,
    },
    {
        title: 'Men\'s Crew-Neck Cotton T-Shirt - 3 Pack',
        description: 'Everyday essential three-pack tees in 100% ring-spun cotton. Pre-shrunk, tagless, relaxed fit. Stays soft wash after wash.',
        price: 29.99, stock: 500, category: "Men's Fashion",
        imgs: IMG.tshirt_pack,
        variants: [
            { size: 'S', color: 'White/Gray/Black', stock: 100 },
            { size: 'M', color: 'White/Gray/Black', stock: 150 },
            { size: 'L', color: 'White/Gray/Black', stock: 150 },
            { size: 'XL', color: 'White/Gray/Black', stock: 100 },
        ],
        discount: 5,
    },
    {
        title: 'Men\'s Quilted Puffer Jacket',
        description: 'Lightweight quilted puffer jacket with water-resistant outer shell and recycled polyester fill. Packable into its own pocket. Great for travel and outdoors.',
        price: 89.99, stock: 130, category: "Men's Fashion",
        imgs: IMG.puffer_jacket,
        variants: [
            { size: 'S', color: 'Navy', stock: 30 },
            { size: 'M', color: 'Navy', stock: 40 },
            { size: 'L', color: 'Olive', stock: 35 },
            { size: 'XL', color: 'Black', stock: 25 },
        ],
        discount: 15,
    },
    // ═══ WOMEN'S FASHION (7 products) ════════════════════════════════════════
    {
        title: 'Floral Wrap Midi Dress',
        description: 'Elegant wrap-style midi dress in a flowing viscose fabric with a beautiful floral print. V-neck, adjustable tie waist, flutter sleeves. Feminine and versatile.',
        price: 79.99, stock: 180, category: "Women's Fashion",
        imgs: IMG.floral_dress,
        variants: [
            { size: 'XS', color: 'Pink Floral', stock: 30 },
            { size: 'S', color: 'Pink Floral', stock: 50 },
            { size: 'M', color: 'Blue Floral', stock: 60 },
            { size: 'L', color: 'Blue Floral', stock: 40 },
        ],
        discount: 0,
    },
    {
        title: 'Women\'s High-Waist Skinny Jeans',
        description: 'High-rise skinny jeans in premium stretch denim. Figure-flattering, sculpting fit. Five-pocket styling, zip and button closure.',
        price: 64.99, stock: 250, category: "Women's Fashion",
        imgs: IMG.skinny_jeans,
        variants: [
            { size: '25x28', color: 'Indigo', stock: 50 },
            { size: '27x28', color: 'Indigo', stock: 60 },
            { size: '29x30', color: 'Light Wash', stock: 70 },
            { size: '31x30', color: 'Light Wash', stock: 70 },
        ],
        discount: 10,
    },
    {
        title: 'Cashmere-Blend Turtleneck Sweater',
        description: '30% cashmere, 70% merino wool turtleneck sweater. Incredibly soft, lightweight warmth. Ribbed trim, relaxed fit, great for layering.',
        price: 109.99, stock: 120, category: "Women's Fashion",
        imgs: IMG.turtleneck,
        variants: [
            { size: 'XS', color: 'Cream', stock: 25 },
            { size: 'S', color: 'Cream', stock: 35 },
            { size: 'M', color: 'Dusty Rose', stock: 35 },
            { size: 'L', color: 'Camel', stock: 25 },
        ],
        discount: 0,
    },
    {
        title: 'Women\'s Oversized Blazer',
        description: 'Relaxed-fit oversized blazer in a textured boucle fabric. Peak lapel, padded shoulders, single-breasted button closure. Pairs with jeans or tailored trousers.',
        price: 119.99, stock: 100, category: "Women's Fashion",
        imgs: IMG.blazer_women,
        variants: [
            { size: 'XS/S', color: 'Beige', stock: 40 },
            { size: 'M/L', color: 'Beige', stock: 35 },
            { size: 'XS/S', color: 'Black', stock: 25 },
        ],
        discount: 5,
    },
    {
        title: 'Women\'s Linen Wide-Leg Trousers',
        description: 'Breathable 100% linen wide-leg trousers perfect for warm weather. Elastic waistband, side pockets. Easy to style up or down.',
        price: 54.99, stock: 160, category: "Women's Fashion",
        imgs: IMG.linen_trousers,
        variants: [
            { size: 'XS', color: 'White', stock: 30 },
            { size: 'S', color: 'White', stock: 40 },
            { size: 'M', color: 'Sand', stock: 50 },
            { size: 'L', color: 'Sand', stock: 40 },
        ],
        discount: 0,
    },
    {
        title: 'Women\'s Satin Pyjama Set',
        description: 'Luxurious satin pyjama set with notch collar shirt and elasticated straight-leg trousers. Piped trim detailing, chest pocket. Elegant loungewear.',
        price: 49.99, stock: 200, category: "Women's Fashion",
        imgs: IMG.pyjama_set,
        variants: [
            { size: 'XS', color: 'Blush', stock: 50 },
            { size: 'S', color: 'Blush', stock: 60 },
            { size: 'M', color: 'Sage', stock: 60 },
            { size: 'L', color: 'Navy', stock: 30 },
        ],
        discount: 20,
    },
    {
        title: 'Women\'s Faux Leather Mini Skirt',
        description: 'On-trend faux leather mini skirt with a smooth finish. High-waisted, zip fastening, fully lined. Pairs beautifully with oversized knitwear or blazers.',
        price: 39.99, stock: 130, category: "Women's Fashion",
        imgs: IMG.mini_skirt,
        variants: [
            { size: 'XS', color: 'Black', stock: 30 },
            { size: 'S', color: 'Black', stock: 40 },
            { size: 'M', color: 'Black', stock: 35 },
            { size: 'L', color: 'Tan', stock: 25 },
        ],
        discount: 0,
    },
    // ═══ FOOTWEAR (6 products) ════════════════════════════════════════════════
    {
        title: 'Nike Air Max 270',
        description: 'Large Air unit in the heel for all-day comfort. Lifestyle shoe for the streets. No-sew overlays for a lightweight feel. React foam upper for a soft ride.',
        price: 150.00, stock: 90, category: 'Footwear',
        imgs: IMG.nike_air_max,
        variants: [
            { size: 'US 7', color: 'Black/White', stock: 15 },
            { size: 'US 8', color: 'Black/White', stock: 20 },
            { size: 'US 9', color: 'Black/White', stock: 20 },
            { size: 'US 10', color: 'Black/White', stock: 15 },
            { size: 'US 8', color: 'Red/White', stock: 20 },
        ],
        discount: 0,
    },
    {
        title: 'Adidas Ultraboost 22',
        description: 'Incredible energy return with Boost cushioning. Continental rubber outsole for superior grip on any surface. Engineered Primeknit upper for a foot-hugging fit.',
        price: 190.00, stock: 60, category: 'Footwear',
        imgs: IMG.adidas_ultraboost,
        variants: [
            { size: 'US 7', color: 'Core Black', stock: 15 },
            { size: 'US 8', color: 'Core Black', stock: 20 },
            { size: 'US 9', color: 'Core Black', stock: 15 },
            { size: 'US 10', color: 'Core Black', stock: 10 },
        ],
        discount: 12,
    },
    {
        title: 'New Balance 990v5 Running Shoes',
        description: 'Made in the USA. Premium ENCAP midsole technology for unrivaled support and durability. Pigskin upper for premium comfort and a classic look.',
        price: 184.99, stock: 50, category: 'Footwear',
        imgs: IMG.new_balance,
        variants: [
            { size: 'US 8', color: 'Gray', stock: 12 },
            { size: 'US 9', color: 'Gray', stock: 15 },
            { size: 'US 10', color: 'Gray', stock: 13 },
            { size: 'US 11', color: 'Navy', stock: 10 },
        ],
        discount: 0,
    },
    {
        title: 'Timberland 6-Inch Premium Waterproof Boots',
        description: 'Iconic boot with premium waterproof nubuck upper. Seam-sealed waterproof construction. Anti-fatigue insole for all-day comfort. Rugged lug outsole.',
        price: 198.00, stock: 70, category: 'Footwear',
        imgs: IMG.timberland,
        variants: [
            { size: 'US 7', color: 'Wheat Nubuck', stock: 15 },
            { size: 'US 8', color: 'Wheat Nubuck', stock: 20 },
            { size: 'US 9', color: 'Wheat Nubuck', stock: 20 },
            { size: 'US 10', color: 'Black', stock: 15 },
        ],
        discount: 0,
    },
    {
        title: 'Birkenstock Arizona Sandals',
        description: 'Iconic two-strap sandal in smooth leather. Anatomically shaped cork-latex footbed for natural arch support. Adjustable buckle straps for a custom fit.',
        price: 119.95, stock: 110, category: 'Footwear',
        imgs: IMG.birkenstock,
        variants: [
            { size: 'EU 37', color: 'Tan', stock: 25 },
            { size: 'EU 38', color: 'Tan', stock: 30 },
            { size: 'EU 39', color: 'Black', stock: 30 },
            { size: 'EU 40', color: 'Black', stock: 25 },
        ],
        discount: 0,
    },
    {
        title: 'Converse Chuck Taylor All Star High Top',
        description: 'The original basketball shoe turned cultural icon. Canvas upper, rubber toe cap, and vulcanized rubber sole. OrthoLite insole for added cushioning.',
        price: 64.99, stock: 300, category: 'Footwear',
        imgs: IMG.converse,
        variants: [
            { size: 'US 7', color: 'Black', stock: 60 },
            { size: 'US 8', color: 'Black', stock: 70 },
            { size: 'US 9', color: 'White', stock: 80 },
            { size: 'US 10', color: 'White', stock: 90 },
        ],
        discount: 5,
    },
    // ═══ BOOKS (6 products) ═══════════════════════════════════════════════════
    {
        title: 'Clean Code by Robert C. Martin',
        description: 'A must-read for every developer. Covers naming, functions, comments, formatting, error handling, and unit tests with real-world examples and before/after code.',
        price: 39.99, stock: 500, category: 'Books',
        imgs: IMG.clean_code,
        variants: [
            { size: 'Paperback', color: 'N/A', stock: 300 },
            { size: 'Hardcover', color: 'N/A', stock: 200 },
        ],
        discount: 8,
    },
    {
        title: 'System Design Interview Vol. 1 & 2',
        description: 'The definitive guide to acing system design interviews. Covers URL shortener, YouTube, Twitter, Uber, Notification System, and many more real-world case studies.',
        price: 44.99, stock: 320, category: 'Books',
        imgs: IMG.system_design,
        variants: [
            { size: 'Paperback Vol. 1', color: 'N/A', stock: 150 },
            { size: 'Paperback Vol. 2', color: 'N/A', stock: 170 },
        ],
        discount: 0,
    },
    {
        title: 'Atomic Habits by James Clear',
        description: 'An easy and proven way to build good habits and break bad ones. Tiny changes, remarkable results. #1 New York Times bestseller on behaviour change.',
        price: 18.99, stock: 800, category: 'Books',
        imgs: IMG.atomic_habits,
        variants: [
            { size: 'Paperback', color: 'N/A', stock: 500 },
            { size: 'Hardcover', color: 'N/A', stock: 300 },
        ],
        discount: 15,
    },
    {
        title: 'The Pragmatic Programmer by David Thomas',
        description: 'Classic software engineering text covering DRY principles, orthogonality, tracer bullets, prototypes, domain languages, and building pragmatic teams.',
        price: 49.99, stock: 250, category: 'Books',
        imgs: IMG.pragmatic,
        variants: [
            { size: 'Paperback', color: 'N/A', stock: 150 },
            { size: 'Hardcover', color: 'N/A', stock: 100 },
        ],
        discount: 5,
    },
    {
        title: 'Designing Data-Intensive Applications',
        description: 'The big ideas behind reliable, scalable, and maintainable systems. Covers storage engines, replication, partitioning, transactions, stream processing.',
        price: 54.99, stock: 180, category: 'Books',
        imgs: IMG.ddia,
        variants: [
            { size: 'Paperback', color: 'N/A', stock: 100 },
            { size: 'Hardcover', color: 'N/A', stock: 80 },
        ],
        discount: 0,
    },
    {
        title: 'The Lean Startup by Eric Ries',
        description: 'How constant innovation creates radically successful businesses. Build-Measure-Learn feedback loop, MVP methodology, pivot or persevere framework.',
        price: 16.99, stock: 600, category: 'Books',
        imgs: IMG.lean_startup,
        variants: [
            { size: 'Paperback', color: 'N/A', stock: 400 },
            { size: 'Hardcover', color: 'N/A', stock: 200 },
        ],
        discount: 10,
    },
    // ═══ HOME & KITCHEN (6 products) ═════════════════════════════════════════
    {
        title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
        description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer in one. 6-quart stainless steel inner pot. UL certified.',
        price: 89.99, stock: 75, category: 'Home & Kitchen',
        imgs: IMG.instant_pot,
        variants: [
            { size: '3 Quart', color: 'Silver', stock: 20 },
            { size: '6 Quart', color: 'Silver', stock: 35 },
            { size: '8 Quart', color: 'Silver', stock: 20 },
        ],
        discount: 25,
    },
    {
        title: 'Dyson V15 Detect Cordless Vacuum',
        description: 'Laser detect technology reveals invisible dust. LCD screen shows exactly what you\'ve captured. Piezo sensor counts and classifies particles. Up to 60-min runtime.',
        price: 749.99, stock: 30, category: 'Home & Kitchen',
        imgs: IMG.dyson_vacuum,
        variants: [],
        discount: 0,
    },
    {
        title: 'KitchenAid 5-Quart Stand Mixer',
        description: 'Tilt-head design for easy bowl access. 10 speeds, 59 touch points for thorough ingredient incorporation. Comes with coated flat beater, dough hook, and wire whip.',
        price: 449.99, stock: 40, category: 'Home & Kitchen',
        imgs: IMG.kitchenaid,
        variants: [
            { size: '5 Qt', color: 'Empire Red', stock: 15 },
            { size: '5 Qt', color: 'Onyx Black', stock: 15 },
            { size: '5 Qt', color: 'Ice Blue', stock: 10 },
        ],
        discount: 10,
    },
    {
        title: 'Nespresso Vertuo Plus Coffee Machine',
        description: 'Centrifusion technology for barista-quality coffee at home. Makes 5 cup sizes from Espresso to Alto. 30s heat-up time, automatic capsule ejection.',
        price: 179.00, stock: 65, category: 'Home & Kitchen',
        imgs: IMG.nespresso,
        variants: [
            { size: 'One Size', color: 'Black', stock: 30 },
            { size: 'One Size', color: 'Chrome', stock: 20 },
            { size: 'One Size', color: 'Red', stock: 15 },
        ],
        discount: 8,
    },
    {
        title: 'Ninja Foodi 6-in-1 Air Fryer',
        description: 'Air fry, roast, reheat, dehydrate, bake, and broil all in one. Up to 75% less fat than traditional frying. 6-quart ceramic-coated basket. Family-sized capacity.',
        price: 129.99, stock: 55, category: 'Home & Kitchen',
        imgs: IMG.air_fryer,
        variants: [
            { size: '4 Qt', color: 'Gray', stock: 25 },
            { size: '6 Qt', color: 'Gray', stock: 30 },
        ],
        discount: 15,
    },
    {
        title: 'Egyptian Cotton 6-Piece Towel Set',
        description: '100% long-staple Egyptian cotton for exceptional softness and absorbency. Includes 2 bath towels, 2 hand towels, 2 face cloths. Salon quality at home.',
        price: 49.99, stock: 200, category: 'Home & Kitchen',
        imgs: IMG.towel_set,
        variants: [
            { size: '6-Piece', color: 'White', stock: 60 },
            { size: '6-Piece', color: 'Navy', stock: 60 },
            { size: '6-Piece', color: 'Sage Green', stock: 80 },
        ],
        discount: 0,
    },
    // ═══ SPORTS & OUTDOORS (5 products) ══════════════════════════════════════
    {
        title: 'Osprey Atmos AG 65 Backpack',
        description: 'Award-winning Anti-Gravity suspension system with perimeter frame and fully-tensioned suspended mesh. 65-litre capacity. Integrated rain cover. Made for long trails.',
        price: 290.00, stock: 40, category: 'Sports & Outdoors',
        imgs: IMG.backpack,
        variants: [
            { size: 'S/M', color: 'Aether Green', stock: 20 },
            { size: 'M/L', color: 'Aether Green', stock: 20 },
        ],
        discount: 0,
    },
    {
        title: 'Peloton Resistance Bands Set (5-Pack)',
        description: 'Five resistance levels from extra-light (10lb) to extra-heavy (50lb). Durable latex, colour-coded. Perfect for strength training, yoga, and physiotherapy.',
        price: 34.99, stock: 400, category: 'Sports & Outdoors',
        imgs: IMG.resistance_bands,
        variants: [
            { size: '5-Pack', color: 'Multicolor', stock: 400 },
        ],
        discount: 5,
    },
    {
        title: 'Lululemon Yoga Mat 5mm',
        description: 'Grip-forward reversible yoga mat with dense 5mm cushioning. Natural-rubber base for stability on hardwood and tile. Dry-grip top. Comes with carrying strap.',
        price: 98.00, stock: 150, category: 'Sports & Outdoors',
        imgs: IMG.yoga_mat,
        variants: [
            { size: '5mm', color: 'Midnight Navy', stock: 50 },
            { size: '5mm', color: 'Dark Olive', stock: 50 },
            { size: '5mm', color: 'Light Gray', stock: 50 },
        ],
        discount: 0,
    },
    {
        title: 'Garmin Forerunner 265 GPS Running Watch',
        description: 'Vibrant AMOLED display, training readiness score, daily suggested workouts, race predictor, PacePro pacing strategy, and up to 15 days battery in smartwatch mode.',
        price: 449.99, stock: 35, category: 'Sports & Outdoors',
        imgs: IMG.garmin_watch,
        variants: [
            { size: 'One Size', color: 'Black/Powder Gray', stock: 20 },
            { size: 'One Size', color: 'Whitestone', stock: 15 },
        ],
        discount: 5,
    },
    {
        title: 'Wilson Pro Staff Tennis Racket',
        description: 'Classic cosmetic inspired by Roger Federer\'s racket. Braided graphite frame for pinpoint precision and feel. 97 sq-in head, 315g weight, 16x19 string pattern.',
        price: 249.99, stock: 45, category: 'Sports & Outdoors',
        imgs: IMG.tennis_racket,
        variants: [
            { size: '4 1/4"', color: 'Black/Red', stock: 25 },
            { size: '4 3/8"', color: 'Black/Red', stock: 20 },
        ],
        discount: 0,
    },
    // ═══ BEAUTY & PERSONAL CARE (5 products) ══════════════════════════════════
    {
        title: 'Dyson Airwrap Multi-Styler',
        description: 'Styles and dries simultaneously without extreme heat. Coanda effect to attract, wrap and style hair. Includes 6 attachments for curl, wave, smooth and dry.',
        price: 599.99, stock: 25, category: 'Beauty & Personal Care',
        imgs: IMG.dyson_airwrap,
        variants: [
            { size: 'Complete', color: 'Copper/Nickel', stock: 15 },
            { size: 'Complete', color: 'Vinca Blue/Rose', stock: 10 },
        ],
        discount: 0,
    },
    {
        title: 'CeraVe Moisturising Cream 454g',
        description: 'Developed with dermatologists. Formulated with 3 essential ceramides and hyaluronic acid. Provides 24-hour hydration. Suitable for dry to very dry skin. Fragrance-free.',
        price: 19.99, stock: 600, category: 'Beauty & Personal Care',
        imgs: IMG.cerave,
        variants: [
            { size: '454g', color: 'N/A', stock: 400 },
            { size: '170g', color: 'N/A', stock: 200 },
        ],
        discount: 10,
    },
    {
        title: 'Fenty Beauty Pro Filt\'r Foundation',
        description: '40 shades for all skin tones. Buildable medium-to-full coverage, transfer-proof, sweat-resistant formula. Velvet-matte finish. Dermatologist tested, non-comedogenic.',
        price: 36.00, stock: 300, category: 'Beauty & Personal Care',
        imgs: IMG.fenty_foundation,
        variants: [
            { size: '32ml', color: '120N - Light', stock: 80 },
            { size: '32ml', color: '240W - Medium', stock: 100 },
            { size: '32ml', color: '390W - Deep', stock: 80 },
            { size: '32ml', color: '498N - Darkest', stock: 40 },
        ],
        discount: 0,
    },
    {
        title: 'Oral-B iO Series 9 Electric Toothbrush',
        description: 'Revolutionary iO technology with magnetic drive system. AI-powered personalized coaching via app. 7 brushing modes, pressure sensor, 3D teeth tracking.',
        price: 219.99, stock: 60, category: 'Beauty & Personal Care',
        imgs: IMG.oral_b,
        variants: [
            { size: 'One Size', color: 'Black Onyx', stock: 30 },
            { size: 'One Size', color: 'Rose Quartz', stock: 30 },
        ],
        discount: 20,
    },
    {
        title: 'The Ordinary Hyaluronic Acid 2% + B5 Serum',
        description: 'Multi-depth hydration serum with hyaluronic acid at 3 molecular weights plus vitamin B5. Visibly plumps skin and provides intense surface moisture.',
        price: 9.90, stock: 1000, category: 'Beauty & Personal Care',
        imgs: IMG.ordinary_serum,
        variants: [
            { size: '30ml', color: 'N/A', stock: 1000 },
        ],
        discount: 0,
    },
    // ═══ TOYS & GAMES (5 products) ════════════════════════════════════════════
    {
        title: 'LEGO Technic Land Rover Defender 42110',
        description: '2573-piece expert-level build. Highly detailed Land Rover Defender with independent suspension, 4-wheel drive, portal axles, and working winch. For ages 11+.',
        price: 199.99, stock: 50, category: 'Toys & Games',
        imgs: IMG.lego,
        variants: [
            { size: 'One Size', color: 'Green/Black', stock: 50 },
        ],
        discount: 10,
    },
    {
        title: 'Hasbro Monopoly Classic Board Game',
        description: 'The world\'s favourite family board game! Buy, sell, and trade your way to success. Includes 8 classic tokens, 28 title deed cards, Chance and Community Chest cards.',
        price: 24.99, stock: 250, category: 'Toys & Games',
        imgs: IMG.monopoly,
        variants: [
            { size: 'Standard', color: 'Classic', stock: 200 },
            { size: 'Deluxe', color: 'Gold Edition', stock: 50 },
        ],
        discount: 0,
    },
    {
        title: 'Nintendo Switch OLED Model',
        description: '7-inch OLED screen with vivid colours. 64GB internal storage, enhanced audio, wide adjustable stand, wired LAN port. Play anytime, anywhere in TV, tabletop, or handheld mode.',
        price: 349.99, stock: 30, category: 'Toys & Games',
        imgs: IMG.nintendo_switch,
        variants: [
            { size: 'Standard', color: 'White', stock: 15 },
            { size: 'Standard', color: 'Neon Blue/Red', stock: 15 },
        ],
        discount: 0,
    },
    {
        title: 'Ravensburger 1000-Piece Jigsaw Puzzle',
        description: 'Premium 1000-piece puzzle with softclick technology for pieces that fit together perfectly the first time. Thick, sturdy pieces with a linen finish to reduce glare.',
        price: 19.99, stock: 400, category: 'Toys & Games',
        imgs: IMG.jigsaw,
        variants: [
            { size: '1000pc', color: 'Forest Landscape', stock: 200 },
            { size: '1000pc', color: 'World Map', stock: 200 },
        ],
        discount: 5,
    },
    {
        title: 'Nerf Elite 2.0 Turbine CS-18 Blaster',
        description: 'Motorized blaster fires darts up to 27m. Slam fire action, 18-dart drum. Pump action, 4 tactical rails, 2 barrel attachment points, stock attachment point.',
        price: 44.99, stock: 180, category: 'Toys & Games',
        imgs: IMG.nerf,
        variants: [
            { size: 'One Size', color: 'Orange/Blue', stock: 180 },
        ],
        discount: 15,
    },
];
// ── Main Seed ─────────────────────────────────────────────────────────────────
async function seed() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅  Connected to MongoDB\n');
        // Wipe old data
        await Product_1.Product.deleteMany({});
        await Category_1.Category.deleteMany({});
        console.log('🗑️   Cleared existing data\n');
        // Insert categories
        const insertedCats = await Category_1.Category.insertMany(CATEGORIES.map((name) => ({
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        })));
        const catMap = {};
        insertedCats.forEach((c) => { catMap[c.name] = c._id; });
        console.log(`📁  Inserted ${insertedCats.length} categories`);
        insertedCats.forEach((c) => console.log(`     ${c.name}  →  ${c._id}`));
        // Upload images + build products
        console.log(`\n📤  Uploading images to Cloudinary and inserting ${RAW_PRODUCTS.length} products...\n`);
        const products = [];
        for (let i = 0; i < RAW_PRODUCTS.length; i++) {
            const raw = RAW_PRODUCTS[i];
            process.stdout.write(`  [${String(i + 1).padStart(2, '0')}/${RAW_PRODUCTS.length}]  ${raw.title.substring(0, 50).padEnd(50, ' ')}  `);
            // Upload each image to Cloudinary
            const uploadedImages = [];
            for (let j = 0; j < raw.imgs.length; j++) {
                const publicId = `product_${String(i + 1).padStart(3, '0')}_img${j + 1}`;
                const url = await uploadImage(raw.imgs[j], publicId);
                uploadedImages.push(url);
            }
            products.push({
                title: raw.title,
                description: raw.description,
                price: raw.price,
                stock: raw.stock,
                category_id: catMap[raw.category],
                images: uploadedImages,
                variants: raw.variants,
                discount: raw.discount,
            });
            console.log(`✓`);
        }
        await Product_1.Product.insertMany(products);
        console.log(`\n✅  Done! ${products.length} products seeded across ${insertedCats.length} categories.`);
        console.log('\n📄  Pagination demo (limit=10):');
        console.log('     Page 1 → GET /api/products?page=1&limit=10');
        console.log('     Page 2 → GET /api/products?page=2&limit=10');
        console.log(`     Total pages → ${Math.ceil(products.length / 10)} pages\n`);
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (err) {
        console.error('❌  Seed failed:', err);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map