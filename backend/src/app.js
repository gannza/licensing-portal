require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const { requestId } = require("./middleware/requestId");
const authRoutes = require("./routes/auth.routes");
const applicationTypesRoutes = require("./routes/applicationTypes.routes");
const documentRequirementsRoutes = require("./routes/documentRequirements.routes");
const applicationsRoutes = require("./routes/applications.routes");
const documentsRoutes = require("./routes/documents.routes");
const userRoutes = require("./routes/user.routes");
const workflowRoutes = require("./routes/workflow.routes");
const { errorHandler } = require("./middleware/errorHandler");
const swaggerSpec = require("./swagger");

const app = express();

app.use(requestId);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests, please try again later",
    },
  },
});

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(swaggerSpec, { explorer: false }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/application-types", applicationTypesRoutes);
app.use("/api/document-requirements", documentRequirementsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/applications/:id/documents", documentsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workflows", workflowRoutes);

app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  }),
);

app.use(errorHandler);

module.exports = app;
