import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/efikcoin", { useNewUrlParser: true, useUnifiedTopology: true });

// User schema
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  wallet: String,
});
const User = mongoose.model("User", UserSchema);

// Register
app.post("/register", async (req, res) => {
  const { email, password, wallet } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, wallet });
  await user.save();
  res.json({ message: "User registered" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid password" });
  const token = jwt.sign({ id: user._id }, "SECRET_KEY");
  res.json({ token });
});

app.listen(5000, () => console.log("Server running on port 5000"));
