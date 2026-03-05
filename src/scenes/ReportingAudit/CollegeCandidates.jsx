import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  TextField,
} from "@mui/material";
import { RefreshOutlined } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

/* =========================
   PAGE ANIMATION
========================= */
const pageVariants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
};

const Reports = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [openView, setOpenView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [applicationsRes, profilesRes] = await Promise.all([
        apiClient.get("/admin/applications"),
        apiClient.get("/admin/candidate-profiles"),
      ]);

      const applications = Array.isArray(applicationsRes.data)
        ? applicationsRes.data
        : (Array.isArray(applicationsRes) ? applicationsRes : []);

      const profiles = Array.isArray(profilesRes.data)
        ? profilesRes.data
        : (Array.isArray(profilesRes) ? profilesRes : []);

      const mergedData = profiles.map((profile) => {
        const candidateApplications = applications.filter(
          (app) => app?.candidateId?._id === profile._id
        );

        const latestEducation = profile.education?.[0] || {};

        return {
          id: profile._id,
          collegeName: latestEducation.caneduIns || "-",
          candidateName: profile.personal?.canname || "-",
          mobile: profile.personal?.canphone || "-",
          degree: latestEducation.caneduCrs || "-",
          passedOutYear: latestEducation.caneduYr || "-",
          appliedJobs: candidateApplications.length > 0 ? "Yes" : "No",
          shortlisted: candidateApplications.some(
            (app) => app.status === "Shortlisted"
          ),
          hired: candidateApplications.some(
            (app) => app.status === "Hired"
          ),
          interviewScheduled: candidateApplications.some(
            (app) => app.status === "Interview Scheduled"
          ),
          createdAt:
            candidateApplications[0]?.createdAt || profile.createdAt,
        };
      });

      setCandidates(mergedData);
      setFilteredCandidates(mergedData);
    } catch (err) {
      console.error("API ERROR:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch candidate data"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DATE FILTER
  ========================= */
  const handleFilterChange = (filters) => {
    const { startDate, endDate } = filters;

    // Reset only if both filters are cleared
    if (!startDate && !endDate) {
      setFilteredCandidates(candidates);
      return;
    }

    const filtered = candidates.filter((candidate) => {
      if (!candidate.createdAt || candidate.createdAt === "-") return false;

      // Candidate date in YYYY-MM-DD format
      const createdDate = new Date(candidate.createdAt).toISOString().split("T")[0];

      if (startDate && endDate) {
        return createdDate >= startDate && createdDate <= endDate;
      } else if (startDate) {
        return createdDate >= startDate;
      } else if (endDate) {
        return createdDate <= endDate;
      }
      return true;
    });

    setFilteredCandidates(filtered);
  };

  /* =========================
     SEARCH FILTER
  ========================= */
  const searchedFilteredCandidates = useMemo(() => {
    if (!search) return filteredCandidates;
    const q = search.toLowerCase();
    return filteredCandidates.filter(
      (c) =>
        (c.collegeName && c.collegeName.toLowerCase().includes(q)) ||
        (c.candidateName && c.candidateName.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.toString().includes(q)) ||
        (c.degree && c.degree.toLowerCase().includes(q))
    );
  }, [filteredCandidates, search]);

  /* =========================
     SUMMARY
  ========================= */
  const totalCandidates = searchedFilteredCandidates.length;
  const shortlistedCount = searchedFilteredCandidates.filter(
    (c) => c.shortlisted
  ).length;
  const hiredCount = searchedFilteredCandidates.filter((c) => c.hired).length;

  /* =========================
     VIEW
  ========================= */
  const handleView = (row) => {
    setSelectedCandidate(row);
    setOpenView(true);
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      { field: "collegeName", headerName: "College", flex: 1.2 },
      { field: "candidateName", headerName: "Candidate Name", flex: 1 },
      { field: "mobile", headerName: "Mobile", flex: 1 },
      { field: "degree", headerName: "Course", flex: 1 },
      { field: "passedOutYear", headerName: "Year", flex: 0.8 },
      { field: "appliedJobs", headerName: "Applied", flex: 0.7 },
      {
        field: "shortlisted",
        headerName: "Shortlisted",
        flex: 1,
        renderCell: (params) =>
          params.value ? (
            <Chip label="Yes" color="warning" size="small" />
          ) : (
            <Chip label="No" size="small" />
          ),
      },
      {
        field: "hired",
        headerName: "Hired",
        flex: 1,
        renderCell: (params) =>
          params.value ? (
            <Chip label="Yes" color="success" size="small" />
          ) : (
            <Chip label="No" size="small" />
          ),
      },
      {
        field: "interviewScheduled",
        headerName: "Interview",
        flex: 1,
        renderCell: (params) =>
          params.value ? (
            <Chip label="Scheduled" color="info" size="small" />
          ) : (
            <Chip label="No" size="small" />
          ),
      },
      {
        field: "actions",
        headerName: "View",
        flex: 0.7,
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleView(params.row)}
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Box p={4}>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" mb={4}>
          <Typography variant="h4" fontWeight={700}>
            College Wise Candidate Report
          </Typography>

          <Box>
            <Button
              variant="outlined"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((prev) => prev - 1)}
              sx={{ mr: 1 }}
            >
              ⬅ Previous
            </Button>

            <Button
              variant="contained"
              disabled={pageIndex === 1}
              onClick={() => setPageIndex((prev) => prev + 1)}
            >
              Next ➡
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <AnimatePresence mode="wait">
          <motion.div
            key={pageIndex}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            {pageIndex === 0 ? (
              <>
                {/* SUMMARY */}
                <Grid container spacing={3} mb={4}>
                  {[
                    { label: "Total Candidates", value: totalCandidates },
                    { label: "Shortlisted", value: shortlistedCount },
                    { label: "Hired", value: hiredCount },
                  ].map((item, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* ================= SEARCH BAR ================= */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        startIcon={<RefreshOutlined />}
                        onClick={fetchData}
                        sx={{ textTransform: "uppercase" }}
                      >
                        Refresh
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ================= FILTER ================= */}
                <Box mb={3}>
                  <FiltersBar onFilterChange={handleFilterChange} />
                </Box>

                {/* TABLE */}
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  {loading ? (
                    <Box textAlign="center" py={5}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={520}>
                      <DataGrid
                        rows={searchedFilteredCandidates}
                        columns={columns}
                        pageSizeOptions={[20]}
                        initialState={{
                          pagination: { paginationModel: { pageSize: 20 } },
                        }}
                        disableRowSelectionOnClick
                        hideFooterPagination
                        sx={{ border: "none" }}
                      />
                    </Box>
                  )}
                </Paper>
              </>
            ) : (
              <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  Analytics Overview
                </Typography>

                <Typography variant="h6" mb={2}>
                  Total Candidates: {totalCandidates}
                </Typography>

                <Typography variant="h6" mb={2}>
                  Shortlisted: {shortlistedCount}
                </Typography>

                <Typography variant="h6">
                  Hired: {hiredCount}
                </Typography>
              </Paper>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* VIEW DIALOG */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Candidate Details</DialogTitle>
        <DialogContent dividers>
          {selectedCandidate &&
            Object.entries(selectedCandidate).map(([key, value]) => (
              <Typography key={key} mb={1}>
                <strong>{key}:</strong> {String(value)}
              </Typography>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Reports;
