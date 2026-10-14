const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = error.message || "Server Error";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors || {})
      .map((item) => item.message)
      .filter(Boolean)
      .join(", ") || message;
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path || "id"} value`;
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  console.error("[api-error]", {
    method: req.method,
    message,
    path: req.originalUrl,
    statusCode,
    stack: error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
