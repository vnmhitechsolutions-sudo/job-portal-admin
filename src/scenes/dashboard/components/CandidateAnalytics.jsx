import { useEffect, useState, useMemo } from "react";
import axios from "state/instant";
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Paper,
  Divider,
  Alert,
  useTheme,
} from "@mui/material";
import DashboardCard from "scenes/dashboard/components/DashboardCard";

const REQUIRED_KPI_KEYS = [
  "totalCandiProfiles",
  "totalCandiUsers",
  "totalAppliedJobs",
  "bookmarkJobs",
  "blockedCandidates",
];

const CandidateAnalytics = () => {
  const theme = useTheme();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================
  // Fetch Dashboard Data (LOGIC UNCHANGED)
  // =====================================
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("/admin/dashboard");

        if (res?.data?.success && res?.data?.data) {
          setDashboard(res.data.data);
        } else {
          setError("Invalid dashboard response structure");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatTitle = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

  const kpiCards = useMemo(() => {
    if (!dashboard?.kpis) return [];

    return REQUIRED_KPI_KEYS.map((key) => ({
      title: formatTitle(key),
      value: dashboard.kpis[key] ?? 0,
    }));
  }, [dashboard]);

  const atsPipeline = dashboard?.atsPipeline || [];

  // =====================================
  // Loading UI
  // =====================================
  if (loading) {
    return (
      <Box p={4}>
        <Typography variant="h5" fontWeight={700} mb={4}>
          Candidate Analytics
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 5 }).map((_, i) => (
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

  // =====================================
  // Error UI
  // =====================================
  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // =====================================
  // MAIN UI
  // =====================================
  return (
    <Box
      p={4}
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(130deg, ${theme.palette.background.default}, ${theme.palette.grey[100]})`,
      }}
    >
      {/* ================= HEADER ================= */}
      <Box mb={5}>
        <Typography
          variant="h4"
          fontWeight={1000}
          gutterBottom
          sx={{
            background: "linear-gradient(90deg,#4e73df,#1cc88a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Candidate Analytics Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Overview of candidate-related metrics and ATS pipeline status
        </Typography>
      </Box>

      {/* ================= KPI SECTION ================= */}
      <Typography variant="h6" fontWeight={600} mb={3}>
        Candidate Key Metrics
      </Typography>

      <Grid container spacing={4} mb={6}>
        {kpiCards.map((card, index) => (
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
                  boxShadow: "0px 15px 35px rgba(0, 0, 0, 0.15)",
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

      <Divider sx={{ mb: 5 }} />

      {/* ================= ATS PIPELINE SECTION ================= */}
      {atsPipeline.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={600} mb={3}>
            ATS Pipeline Status
          </Typography>

          <Grid container spacing={4}>
            {atsPipeline.map((stage, index) => (
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
                      transform: "translateY(-6px) scale(1.02)",
                      boxShadow:
                        "0px 12px 30px rgba(0, 0, 0, 0.12)",
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
                        "linear-gradient(90deg,#36b9cc,#f6c23e)",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {stage._id}
                  </Typography>

                  <Typography variant="h5" fontWeight={700}>
                    {stage.count}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CandidateAnalytics;
