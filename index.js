const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

app.use(cors());
const PORT = process.env.PORT || 5002;
const db = require("./database/db");
const settingRoutes = require("./routes/settingRoutes");
const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const path = require("path");

app.use(express.json());

// Serve static files (resumes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/settings", settingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/assessments", assessmentRoutes);


app.get("/", (req, res) => {
  res.send("HRMS Backend Server is running on port " + PORT);
});

// Test Database Connection Route
app.get("/test-db", async (req, res) => {
  try {
    const result = await db.mySqlQury("SELECT 1 + 1 AS result");
    res.json({ message: "Database connected successfully", data: result });
  } catch (error) {
    res.status(500).json({
      error: "Database connection failed",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
