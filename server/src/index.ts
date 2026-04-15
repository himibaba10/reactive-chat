import cors from "cors";
import express from "express";
import morgan from "morgan";
import connectDB from "./config/db";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // logs: METHOD /path STATUS ms

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
