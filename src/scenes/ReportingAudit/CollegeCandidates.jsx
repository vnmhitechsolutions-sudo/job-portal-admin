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
  TextField,
  Stack,
  Divider,
  Tooltip,
  IconButton,
  Avatar,
  Chip,
} from "@mui/material";
import {
  RefreshOutlined,
  VisibilityOutlined,
  SchoolOutlined,
  LocalPhoneOutlined,
  EmailOutlined,
  CalendarMonthOutlined,
  WorkOutline,
  CheckCircleOutline,
  AccountCircleOutlined,
  CloseOutlined,
  AssignmentTurnedIn,
  CalendarTodayOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
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

      const [applicationsRes, profilesRes, candidatesRes, jobsRes] = await Promise.all([
        apiClient.get("/admin/applications"),
        apiClient.get("/admin/candidate-profiles"),
        apiClient.get("/admin/candidates"),
        apiClient.get("/admin/jobs"),
      ]);

      const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : (Array.isArray(jobsRes) ? jobsRes : []);

      const applications = Array.isArray(applicationsRes.data)
        ? applicationsRes.data
        : (Array.isArray(applicationsRes) ? applicationsRes : []);

      const profiles = Array.isArray(profilesRes.data)
        ? profilesRes.data
        : (Array.isArray(profilesRes) ? profilesRes : []);

      const candidatesRaw = Array.isArray(candidatesRes.data?.data)
        ? candidatesRes.data.data
        : (Array.isArray(candidatesRes.data) ? candidatesRes.data : []);

      const mergedData = profiles.map((profile) => {
        // Find applications by ID or by Email for maximum reliability
        const masterUser = candidatesRaw.find(c => {
          const profileEmail = (profile.personal?.canemail || profile.email || "").toLowerCase();
          const userEmail = (c.canemail || c.email || "").toLowerCase();
          return (profileEmail && userEmail && profileEmail === userEmail) || (c._id === profile._id);
        }) || {};

        const candidateApplications = applications.filter((app) => {
          const appCanId = app.candidateId?._id || app.candidateId;
          const profileId = profile._id;

          // 1. Primary match: by ID
          if (appCanId === profileId) return true;

          // 2. Secondary match: by Email (backup)
          const appEmail = (app.candidateId?.canemail || app.candidateId?.email || "").toLowerCase();
          const pEmail = (profile.personal?.canemail || profile.email || "").toLowerCase();
          if (appEmail && pEmail && appEmail === pEmail) return true;

          return false;
        });

        const latestEducation = profile.education?.[0] || {};

        const getJobs = (status = null) => {
          const filtered = status
            ? candidateApplications.filter(a => a.status === status)
            : candidateApplications;
          const titles = filtered.map(a => a.jobId?.jobTit || "Job").filter(t => t);
          return titles.length > 0 ? titles.join(", ") : "";
        };

        const hasApplied = candidateApplications.length > 0;
        const hasShortlisted = candidateApplications.some(a => a.status === "Shortlisted");
        const hasHired = candidateApplications.some(a => a.status === "Hired");
        const hasInterview = candidateApplications.some(a => a.status === "Interview Scheduled");

        return {
          id: profile._id,
          collegeName: latestEducation.caneduIns || "-",
          candidateName: profile.personal?.canname || "-",
          mobile: profile.personal?.canphone || "-",
          degree: latestEducation.caneduCrs || "-",
          passedOutYear: latestEducation.caneduYr || "-",

          appliedJobs: hasApplied ? `Yes (${getJobs()})` : "No",
          shortlisted: hasShortlisted ? `Yes (${getJobs("Shortlisted")})` : "No",
          hired: hasHired ? `Yes (${getJobs("Hired")})` : "No",
          interviewScheduled: hasInterview ? `Yes (${getJobs("Interview Scheduled")})` : "No",

          // Boolean flags for counts and visibility
          isShortlisted: hasShortlisted,
          isHired: hasHired,
          isApplied: hasApplied,
          isInterview: hasInterview,

          // Simple Text Flags for the table
          appliedDisp: hasApplied ? "Yes" : "No",
          shortlistedDisp: hasShortlisted ? "Yes" : "No",
          interviewDisp: hasInterview ? "Yes" : "No",
          hiredDisp: hasHired ? "Yes" : "No",

          allApps: candidateApplications.map(app => {
            const jobId = app.jobId?._id || app.jobId;
            const fullJob = jobs.find(j => j._id === jobId) || app.jobId || {};
            return {
              jobTitle: fullJob.jobTit || "Unknown Job",
              companyName: fullJob.cmpName || fullJob.companyName || "Private Institution",
              status: app.status
            };
          }),

          // Referral Info
          referrerName: masterUser.referrerName || masterUser.referrername || profile.referrerName || "-",
          referrerPhone: masterUser.referrerPhone || masterUser.referrerphone || profile.referrerPhone || "-",
          referredBy: masterUser.referredBy || masterUser.referredby || profile.referredBy || "-",

          createdAt: candidateApplications[0]?.createdAt || profile.createdAt,
          raw: profile,
          email: profile.personal?.canemail || profile.email || "-",
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
    (c) => c.isShortlisted
  ).length;
  const hiredCount = searchedFilteredCandidates.filter((c) => c.isHired).length;

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
      { field: "candidateName", headerName: "Candidate", flex: 1 },
      { field: "mobile", headerName: "Mobile", flex: 0.8 },
      { field: "referrerName", headerName: "Referrer", flex: 0.8 },
      { field: "referredBy", headerName: "Referred By", flex: 0.8 },
      { field: "degree", headerName: "Course", flex: 1 },
      { field: "passedOutYear", headerName: "Year", flex: 0.8 },
      {
        field: "appliedDisp",
        headerName: "Applied",
        flex: 0.7,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "primary" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 50 }}
          />
        )
      },
      {
        field: "shortlistedDisp",
        headerName: "Shortlisted",
        flex: 0.7,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "warning" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 50 }}
          />
        )
      },
      {
        field: "interviewDisp",
        headerName: "Interview",
        flex: 0.8,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "info" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 50 }}
          />
        )
      },
      {
        field: "hiredDisp",
        headerName: "Hired",
        flex: 0.7,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "success" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 50 }}
          />
        )
      },
      {
        field: "actions",
        headerName: "View",
        flex: 0.5,
        renderCell: (params) => (
          <Tooltip title="View Full Details">
            <IconButton
              color="primary"
              onClick={() => handleView(params.row)}
              sx={{ bgcolor: "rgba(25, 118, 210, 0.08)", "&:hover": { bgcolor: "rgba(25, 118, 210, 0.15)" } }}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
              🎓 COLLEGE WISE REPORT
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Comprehensive candidate distributions by educational institution and application status
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              disabled={pageIndex === 0}
              startIcon={<span>⬅</span>}
              onClick={() => setPageIndex((prev) => prev - 1)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              PREVIOUS
            </Button>

            <Button
              variant="contained"
              disabled={pageIndex === 1}
              endIcon={<span>➡</span>}
              onClick={() => setPageIndex((prev) => prev + 1)}
              sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3 }}
            >
              ANALYTICS
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
                    { label: "Total Candidates", value: totalCandidates, color: "primary.main", icon: <AccountCircleOutlined /> },
                    { label: "Shortlisted", value: shortlistedCount, color: "warning.main", icon: <AssignmentTurnedIn /> },
                    { label: "Hired Candidates", value: hiredCount, color: "success.main", icon: <CheckCircleOutline /> },
                  ].map((item, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: "left", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", top: -10, right: -10, opacity: 0.1, transform: "scale(2.5)", color: item.color }}>
                          {item.icon}
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h3" fontWeight={900} color={item.color}>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* 🚀 TOOLBAR (Matching standard) */}
                <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by Institution, Name, or Course..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshOutlined />}
                        onClick={fetchData}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 2 }}
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
                <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
                  {loading ? (
                    <Box textAlign="center" py={5}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={520} p={1}>
                      <DataGrid
                        rows={searchedFilteredCandidates}
                        columns={columns}
                        pageSizeOptions={[20]}
                        initialState={{
                          pagination: { paginationModel: { pageSize: 20 } },
                        }}
                        disableRowSelectionOnClick
                        hideFooterPagination
                        sx={{
                          border: "none",
                          "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "text.secondary", fontWeight: 700 },
                        }}
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

      {/* VIEW DIALOG (Premium Stylings) */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
          <Typography fontWeight={900} variant="h6">
            🎓 CANDIDATE ACADEMIC PROFILE
          </Typography>
          <IconButton sx={{ color: "white" }} onClick={() => setOpenView(false)}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, p: 4, bgcolor: "#fafafa" }}>
          {selectedCandidate && (
            <Grid container spacing={3} mt={1}>
              {/* Header Info */}
              <Grid item xs={12} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "2rem", boxShadow: 3 }}>
                  {selectedCandidate.candidateName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} color="primary.dark">
                    {selectedCandidate.candidateName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {selectedCandidate.collegeName}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}><Divider sx={{ mb: 1 }}><Typography variant="caption" fontWeight={900} color="text.disabled">PRIMARY CONTACT & EDUCATION</Typography></Divider></Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Candidate Name"
                  fullWidth
                  value={selectedCandidate.candidateName || "-"}
                  disabled
                  InputProps={{ startAdornment: <AccountCircleOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Email"
                  fullWidth
                  value={selectedCandidate.email || "-"}
                  disabled
                  InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  fullWidth
                  value={selectedCandidate.mobile || "-"}
                  disabled
                  InputProps={{ startAdornment: <LocalPhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Academic Institution"
                  fullWidth
                  value={selectedCandidate.collegeName || "-"}
                  disabled
                  InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Course / Degree"
                  fullWidth
                  value={selectedCandidate.degree || "-"}
                  disabled
                  InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Passed Out Year"
                  fullWidth
                  value={selectedCandidate.passedOutYear || "-"}
                  disabled
                  InputProps={{ startAdornment: <CalendarTodayOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><Divider sx={{ mb: 1 }}><Typography variant="caption" fontWeight={900} color="text.disabled">REFERRER & SOURCE INFORMATION</Typography></Divider></Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Referrer" fullWidth value={selectedCandidate.referrerName} disabled InputProps={{ startAdornment: <AccountCircleOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Referrer Phone" fullWidth value={selectedCandidate.referrerPhone} disabled InputProps={{ startAdornment: <LocalPhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Referred By (Source)" fullWidth value={selectedCandidate.referredBy} disabled InputProps={{ startAdornment: <WorkOutline sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>

              {selectedCandidate.isApplied && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}><Divider sx={{ mb: 1 }}><Typography variant="caption" fontWeight={900} color="text.disabled">APPLICATION PIPELINE PROCESS</Typography></Divider></Grid>

                  {selectedCandidate.allApps.map((app, idx) => (
                    <Grid item xs={12} key={idx} sx={{ mb: 1 }}>
                      <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 2, bgcolor: "#fff", border: "1px solid #e0e0e0" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ bgcolor: "rgba(25, 118, 210, 0.1)", color: "primary.main", width: 32, height: 32 }}>
                            <WorkOutline fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={700} color="text.primary">
                              {app.jobTitle}
                            </Typography>
                            <Typography variant="caption" color="primary.main" fontWeight={700}>
                              {app.companyName}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={app.status}
                          size="small"
                          color={
                            app.status === "Hired" ? "success" :
                              app.status === "Shortlisted" ? "warning" :
                                app.status === "Interview Scheduled" ? "info" : "primary"
                          }
                          sx={{ fontWeight: 800, px: 1 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </>
              )}

              <Grid item xs={12} sx={{ mt: 1 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fffbe6", borderColor: "#ffe58f", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                    ADMIN NOTE:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    This candidate is listed from {selectedCandidate.collegeName}. Recruitment data is aggregated from current active job pipelines.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9" }}>
          <Button variant="contained" onClick={() => setOpenView(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Reports;
