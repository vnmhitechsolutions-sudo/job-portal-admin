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
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  Tooltip,
  IconButton,
  Stack,
} from "@mui/material";
import {
  RefreshOutlined,
  VisibilityOutlined,
  AccountCircleOutlined,
  SchoolOutlined,
  EmailOutlined,
  LocalPhoneOutlined,
  CalendarTodayOutlined,
  CloseOutlined,
  WorkOutline,
  AssignmentTurnedIn,
  CheckCircleOutline,
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
  const [sourceFilter, setSourceFilter] = useState("");
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

      const [applicationsRes, candidatesRes, profilesRes, jobsRes] = await Promise.all([
        apiClient.get("/admin/applications"),
        apiClient.get("/admin/candidates"),
        apiClient.get("/admin/candidate-profiles"),
        apiClient.get("/admin/jobs"),
      ]);

      const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : (Array.isArray(jobsRes) ? jobsRes : []);

      const applications = Array.isArray(applicationsRes.data)
        ? applicationsRes.data
        : (Array.isArray(applicationsRes) ? applicationsRes : []);

      const candidatesRaw = Array.isArray(candidatesRes.data?.data)
        ? candidatesRes.data.data
        : (Array.isArray(candidatesRes.data) ? candidatesRes.data : []);

      const profiles = Array.isArray(profilesRes.data)
        ? profilesRes.data
        : (Array.isArray(profilesRes) ? profilesRes : []);

      const mergedData = profiles.map((profile) => {
        // Find the Master User Record for this profile to get reliable Referral Data
        const masterUser = candidatesRaw.find(c => {
          const profileEmail = (profile.personal?.canemail || profile.email || "").toLowerCase();
          const userEmail = (c.canemail || c.email || "").toLowerCase();
          return (profileEmail && userEmail && profileEmail === userEmail) || (c._id === profile._id);
        }) || {};

        // Find applications by ID or by Email for maximum reliability
        const candidateApplications = applications.filter((app) => {
          const appCanId = app.candidateId?._id || app.candidateId;
          const profileId = profile._id;

          // Match by ID
          if (appCanId === profileId) return true;

          // Match by Email
          const appEmail = (app.candidateId?.canemail || app.candidateId?.email || "").toLowerCase();
          const pEmail = (profile.personal?.canemail || profile.email || "").toLowerCase();
          if (appEmail && pEmail && appEmail === pEmail) return true;

          return false;
        });

        const latestEducation = profile.education?.[0] || {};

        const hasApplied = candidateApplications.length > 0;
        const hasShortlisted = candidateApplications.some(a => a.status === "Shortlisted");
        const hasHired = candidateApplications.some(a => a.status === "Hired");
        const hasInterview = candidateApplications.some(a => a.status === "Interview Scheduled");

        return {
          id: profile._id,
          collegeName: latestEducation.caneduIns || "-",
          candidateName: profile.personal?.canname || profile.canname || masterUser.name || masterUser.canname || "-",
          mobile: profile.personal?.canphone || profile.canphone || masterUser.mobile || masterUser.canphone || "-",
          degree: latestEducation.caneduCrs || "-",
          passedOutYear: latestEducation.caneduYr || "-",
          email: profile.personal?.canemail || profile.email || masterUser.email || masterUser.canemail || "-",

          // Reference Info - NOW FETCHED FROM MASTER USER RECORD (Where it is reliable)
          referrerName: masterUser.referrerName || masterUser.referrername || profile.referrerName || "-",
          referrerPhone: masterUser.referrerPhone || masterUser.referrerphone || profile.referrerPhone || "-",
          referredBy: masterUser.referredBy || masterUser.referredby || profile.referredBy || "-",

          // Application Data
          isApplied: hasApplied,
          allApps: candidateApplications.map(app => {
            const jobId = app.jobId?._id || app.jobId;
            const fullJob = jobs.find(j => j._id === jobId) || app.jobId || {};
            return {
              jobTitle: fullJob.jobTit || "Unknown Job",
              companyName: fullJob.cmpName || fullJob.companyName || "Private Institution",
              status: app.status
            };
          }),

          // Application Status Display
          appliedDisp: hasApplied ? "Yes" : "No",
          shortlistedDisp: hasShortlisted ? "Yes" : "No",
          interviewDisp: hasInterview ? "Yes" : "No",
          hiredDisp: hasHired ? "Yes" : "No",

          // Legacy status flags for summary
          shortlisted: hasShortlisted,
          hired: hasHired,
          interviewScheduled: hasInterview,

          createdAt: candidateApplications[0]?.createdAt || masterUser.createdAt || profile.createdAt,
        };
      });

      setCandidates(mergedData);
      setFilteredCandidates(mergedData);
    } catch (err) {
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
     DATE FILTER FUNCTION
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

      const created = new Date(candidate.createdAt);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return created >= start && created <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return created >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return created <= end;
      }
      return true;
    });

    setFilteredCandidates(filtered);
  };

  /* =========================
     SEARCH FILTER
  ========================= */
  const searchedFilteredCandidates = useMemo(() => {
    let result = filteredCandidates;

    // 1. Source Filter Application
    if (sourceFilter) {
      result = result.filter(c => {
        const source = (c.referredBy || "").toLowerCase();
        const filter = sourceFilter.toLowerCase();

        // Handle "Friend / Family" match since the label might vary
        if (filter === "friend") return source.includes("friend") || source.includes("person") || source.includes("family");
        return source.includes(filter);
      });
    }

    // 2. Search Filter Application
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (c) =>
        (c.collegeName && c.collegeName.toLowerCase().includes(q)) ||
        (c.candidateName && c.candidateName.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.toString().includes(q)) ||
        (c.degree && c.degree.toLowerCase().includes(q)) ||
        (c.referrerName && c.referrerName.toLowerCase().includes(q)) ||
        (c.referredBy && c.referredBy.toLowerCase().includes(q))
    );
  }, [filteredCandidates, search, sourceFilter]);

  /* =========================
     SUMMARY COUNTS
  ========================= */
  const totalCandidates = searchedFilteredCandidates.length;
  const shortlistedCount = searchedFilteredCandidates.filter(
    (c) => c.shortlisted
  ).length;
  const hiredCount = searchedFilteredCandidates.filter((c) => c.hired).length;
  const interviewCount = searchedFilteredCandidates.filter(
    (c) => c.interviewScheduled
  ).length;

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      { field: "candidateName", headerName: "Candidate Name", flex: 1 },
      { field: "mobile", headerName: "Candidate Phone", flex: 1 },
      { field: "referrerName", headerName: "Referrer", flex: 1 },
      { field: "referrerPhone", headerName: "Referrer Phone", flex: 1 },
      { field: "referredBy", headerName: "Referred By", flex: 0.8 },
      {
        field: "appliedDisp",
        headerName: "Applied",
        flex: 0.6,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "primary" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 45 }}
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
            sx={{ fontWeight: 800, minWidth: 45 }}
          />
        )
      },
      {
        field: "interviewDisp",
        headerName: "Interview",
        flex: 0.7,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "info" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 45 }}
          />
        )
      },
      {
        field: "hiredDisp",
        headerName: "Hired",
        flex: 0.6,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === "Yes" ? "success" : "default"}
            variant={value === "Yes" ? "filled" : "outlined"}
            sx={{ fontWeight: 800, minWidth: 45 }}
          />
        )
      },
      {
        field: "actions",
        headerName: "View",
        flex: 0.4,
        renderCell: (params) => (
          <Tooltip title="View Candidate & Reference Details">
            <IconButton
              color="primary"
              onClick={() => {
                setSelectedCandidate(params.row);
                setOpenView(true);
              }}
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
      <Box p={4}>
        <Typography variant="h4" fontWeight={700} mb={4}>
          Candidate Wise Reference Report
        </Typography>

        {/* ================= SUMMARY CARDS ================= */}
        <Grid container spacing={3} mb={4}>
          {[
            { label: "Total Candidates", value: totalCandidates, color: "primary.main", icon: <AccountCircleOutlined /> },
            { label: "Shortlisted", value: shortlistedCount, color: "warning.main", icon: <AssignmentTurnedIn /> },
            { label: "Hired Candidates", value: hiredCount, color: "success.main", icon: <CheckCircleOutline /> },
            { label: "Interviews", value: interviewCount, color: "info.main", icon: <RefreshOutlined /> },
          ].map((item, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, textAlign: "left", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -10, right: -10, opacity: 0.1, transform: "scale(2.5)", color: item.color }}>
                  {item.icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1, textTransform: "uppercase", fontSize: "0.65rem" }}>
                  {item.label}
                </Typography>
                <Typography variant="h3" fontWeight={900} color={item.color}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ================= SEARCH & SOURCE FILTER ================= */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: "1px solid #eef2f6" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search Candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>How did you hear about us?</InputLabel>
                <Select
                  label="How did you hear about us?"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Sources</em></MenuItem>
                  <MenuItem value="Social Media">Social Media</MenuItem>
                  <MenuItem value="Friend">Friend / Family</MenuItem>
                  <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  <MenuItem value="Newspaper">Newspaper</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={fetchData}
                sx={{ textTransform: "uppercase", fontWeight: 700 }}
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ================= DATE FILTER ================= */}
        <Box mb={3}>
          <FiltersBar onFilterChange={handleFilterChange} />
        </Box>

        {/* ================= TABLE ================= */}
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
      </Box>

      {/* ================= VIEW DIALOG ================= */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
          <Typography fontWeight={900} variant="h6">
            📋 CANDIDATE REFERRAL PROFILE
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
                    {selectedCandidate.collegeName} (Class of {selectedCandidate.passedOutYear})
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}><Divider sx={{ mb: 1 }}><Typography variant="caption" fontWeight={900} color="text.disabled">PRIMARY CONTACT & EDUCATION</Typography></Divider></Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Candidate Mobile" fullWidth value={selectedCandidate.mobile} disabled InputProps={{ startAdornment: <LocalPhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Candidate Email" fullWidth value={selectedCandidate.email} disabled InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="College Name" fullWidth value={selectedCandidate.collegeName} disabled InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Course" fullWidth value={selectedCandidate.degree} disabled InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Pass Out" fullWidth value={selectedCandidate.passedOutYear} disabled InputProps={{ startAdornment: <CalendarTodayOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
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
