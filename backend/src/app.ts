import express from "express";
const app = express();
app.use(express.json());
// Define your routes here
app.get("/products", (req, res) => {
  // Logic to fetch products from the database
  res.json({ message: "List of products" });
});
app.post("/products", (req, res) => {
  // Logic to create a new product in the database
  res.json({ message: "Product created" });
}
);
app.get("/orders", (req, res) => {
  // Logic to fetch orders from the database
  res.json({ message: "List of orders" });
});
app.post("/orders", (req, res) => {
  // Logic to create a new order in the database
  res.json({ message: "Order created" });
});
app.get("/users", (req, res) => {
  // Logic to fetch users from the database
  res.json({ message: "List of users" });
});
app.post("/users", (req, res) => {
  // Logic to create a new user in the database
  res.json({ message: "User created" });
});
export default app;
