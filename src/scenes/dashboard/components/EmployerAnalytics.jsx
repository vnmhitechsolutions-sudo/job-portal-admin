import { useEffect, useState, useMemo } from "react";
import axios from "state/instant";
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  Paper,
  useTheme,
} from "@mui/material";
import DashboardCard from "./DashboardCard";

const EmployerAnalytics = () => {
  const theme = useTheme();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================
  // Fetch Dashboard Data (LOGIC UNCHANGED)
  // =========================================
  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        const res = await axios.get("/admin/dashboard");

        if (res?.data?.success && res?.data?.data?.kpis) {
          setDashboard(res.data.data);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        if (err.response?.status === 404) {
          setError("Dashboard API not found (404). Check backend route.");
        } else if (err.response?.status === 401) {
          setError("Unauthorized. Please login again.");
        } else {
          setError("Failed to load analytics data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, []);

  const formatTitle = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

  const employerCards = useMemo(() => {
    if (!dashboard?.kpis) return [];

    const keys = [
      "totalAdmins",
      "totalCompanies",
      "totalApplications",
      "totalAppliedJobs",
      "TotalUsers",
      "totalJobpost",
      "AppliedCandidates",
      "shotlistedCandidates",
      "interviewShedules",
      "hiredCandidates",
      "noOfVerification",
      "totalEmployeeUsers",
    ];

    return keys.map((key) => ({
      title: formatTitle(key),
      value: dashboard.kpis[key] ?? 0,
    }));
  }, [dashboard]);

  // =========================================
  // Loading UI
  // =========================================
  if (loading) {
    return (
      <Box p={4}>
        <Typography variant="h5" fontWeight={700} mb={4}>
          Employer Analytics
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton
                variant="rounded"
                height={140}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // =========================================
  // Error UI
  // =========================================
  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // =========================================
  // Main UI
  // =========================================
  return (
    <Box
      p={4}
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.grey[100]})`,
      }}
    >
      {/* ================= HEADER ================= */}
      <Box mb={5}>
        <Typography
          variant="h4"
          fontWeight={800}
          gutterBottom
          sx={{
            background: "linear-gradient(90deg,#4e73df,#1cc88a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Employer Analytics Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Real-time overview of employer & system performance metrics
        </Typography>
      </Box>

      {/* ================= KPI GRID ================= */}
      <Grid container spacing={4}>
        {employerCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.35s ease",
                cursor: "pointer",

                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow:
                    "0px 15px 35px rgba(0, 0, 0, 0.15)",
                  borderColor: theme.palette.primary.main,
                },

                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "4px",
                  background:
                    "linear-gradient(90deg,#4e73df,#1cc88a)",
                },
              }}
            >
              <DashboardCard
                title={card.title}
                value={card.value}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EmployerAnalytics;
