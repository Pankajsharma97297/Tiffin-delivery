const express = require("express");
const cors = require("cors");
const path = require("path"); 
const routes = require("./routes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const { UPLOADS_DIR, UPLOADS_ROUTE } = require("./config/uploads");

const app = express();

const allowedOrigins = [
  "http://localhost:5174",
  "http://162.240.223.89:3002",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "8mb" }));

app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.use(UPLOADS_ROUTE, express.static(UPLOADS_DIR));
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Tiffin Backend",
  });
});
console.log("✅ Current __dirname:", __dirname);
console.log("✅ Admin path:", path.join(__dirname, "public/admin"));
const adminPath = path.join(__dirname, "..", "public/admin");

console.log("✅ Admin path:", adminPath);

app.use("/admin", express.static(adminPath));
// ✅ Admin Panel SPA Support (React Router ke liye)
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin", "index.html"));
});
app.use("/assets", express.static(path.join(__dirname, "..", "public/admin/assets")))
app.use("/api", routes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;