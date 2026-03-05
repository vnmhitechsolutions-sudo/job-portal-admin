import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import apiClient from "../../api/apiClient";

import OverviewKPISection from "./components/OverviewKPISection";
import CandidateAnalytics from "./components/CandidateAnalytics";
import EmployerAnalytics from "./components/EmployerAnalytics";
import ActivitySection from "./components/ActivitySection";
import FiltersBar from "./components/FiltersBar";

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(
    async (query = {}) => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiClient.get("/admin/dashboard", {
          params: query,
        });

        setData(res.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboard(filters);
  }, [filters, fetchDashboard]);

  // ================= Loading State =================
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // ================= Error State =================
  if (error) {
    return (
      <Box p={5}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ================= Empty State =================
  if (!data) {
    return (
      <Box p={5}>
        <Alert severity="info">No dashboard data available.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, 0%,  100%)",
        px: { xs: 2, md: 5 },
        py: 4,
      }}
    >
      {/* ================= HEADER ================= */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight={700}>
          Admin Analytics Dashboard
        </Typography>
      </Stack>

      {/* ================= FILTER BAR ================= */}
      <Box mb={4}>
        <FiltersBar onFilterChange={setFilters} />
      </Box>

      {/* ================= OVERVIEW ================= */}
      <OverviewKPISection data={data.kpis} />

      <Divider sx={{ my: 5 }} />

      {/* ================= CANDIDATE ANALYTICS ================= */}
      <CandidateAnalytics
        kpis={data.kpis}
        loading={loading}
        error={error}
      />

      <Divider sx={{ my: 5 }} />

      {/* ================= EMPLOYER ANALYTICS ================= */}
      <EmployerAnalytics
        kpis={data.kpis}
        loading={loading}
        error={error}
      />

      <Divider sx={{ my: 5 }} />

      {/* ================= ACTIVITY ================= */}
      <ActivitySection logs={data.recentActivities} />
    </Box>
  );
};

export default DashboardPage;
