const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { UPLOADS_DIR, UPLOADS_ROUTE } = require("./config/uploads");

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(UPLOADS_ROUTE, express.static(UPLOADS_DIR));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Tiffin Backend",
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
