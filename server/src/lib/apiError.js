class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Express error-handling middleware (must take 4 args). Any route that
// calls next(err) or throws inside an async handler wrapped by asyncHandler
// ends up here. Known ApiErrors surface their message; anything else is
// logged server-side and returned as a generic 500.
function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Unhandled API error:", err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

// Wraps an async route handler so rejected promises reach errorHandler
// instead of crashing the process (Express doesn't do this automatically).
function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

module.exports = { ApiError, errorHandler, asyncHandler };
