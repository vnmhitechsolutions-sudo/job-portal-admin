import React, { useEffect, useMemo, useState } from "react";
import axios from "state/instant";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Link,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Avatar
} from "@mui/material";
import {
  VisibilityOutlined,
  DeleteOutlined,
  CheckCircleOutline,
  CancelOutlined,
  LockOutlined,
  OpenInNew,
  RefreshOutlined,
  AccountBalanceOutlined,
  PublicOutlined,
  BusinessCenterOutlined,
  AssignmentOutlined,
  CloseOutlined,
  LocationOnOutlined,
  CategoryOutlined,
  InfoOutlined,
  EventOutlined,
  AccessTimeOutlined,
  LaunchOutlined,
  PersonOutline
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";

/* =========================
   STATUS CONFIG (backend values only)
========================= */
const STATUS_COLORS = {
  ACTIVE: "success",
  PENDING: "warning",
  CLOSED: "default",
  REJECTED: "error",
  INACTIVE: "info",
};

/* =========================
   PAGE ANIMATION
========================= */
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const GovJobsAdmin = () => {
  /* =========================
     STATES
  ========================= */
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const [viewJob, setViewJob] = useState(null);

  /* =========================
     FETCH DATA (Initial Only)
  ========================= */
  const fetchJobs = async () => {
    try {
      // Don't show full loader if we already have jobs (prevents focus loss on refresh)
      if (jobs.length === 0) setLoading(true);
      const res = await axios.get("/admin/gov-jobs");
      setJobs(res.data.data || []);
    } catch (err) {
      console.error("Fetch Govt Jobs Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []); // Only on mount to keep interface stable during local filtering

  /* =========================
     ACTIONS
  ========================= */
  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/admin/gov-jobs/${id}/status`, { status });
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Govt Job?")) return;
    try {
      await axios.delete(`/admin/gov-jobs/${id}`);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(() => [
    {
      field: "jobTit",
      headerName: "Job",
      flex: 1.6,
      renderCell: ({ row }) => (
        <Stack>
          <Typography fontWeight={600}>{row.jobTit}</Typography>
          <Typography fontSize="0.75rem" color="text.secondary">
            {row.jobCity}, {row.jobState}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "jobCat",
      headerName: "Category",
      flex: 0.8,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: ({ value }) => {
        const statusUpper = value?.toUpperCase() || "N/A";
        return (
          <Chip
            size="small"
            label={statusUpper}
            color={STATUS_COLORS[statusUpper] || "default"}
            sx={{ fontWeight: 800, textTransform: 'uppercase' }}
          />
        );
      },
    },
    {
      field: "newDeadline",
      headerName: "Deadline",
      flex: 0.8,
      valueFormatter: ({ value }) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View Details">
            <IconButton onClick={() => setViewJob(row)} size="small" sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}>
              <VisibilityOutlined fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          {row.status === "PENDING" && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  color="success"
                  size="small"
                  onClick={() => updateStatus(row._id, "ACTIVE")}
                  sx={{ bgcolor: "rgba(76, 175, 80, 0.08)" }}
                >
                  <CheckCircleOutline fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => updateStatus(row._id, "REJECTED")}
                  sx={{ bgcolor: "rgba(244, 67, 54, 0.08)" }}
                >
                  <CancelOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {row.status === "ACTIVE" && (
            <Tooltip title="Close Job">
              <IconButton
                size="small"
                onClick={() => updateStatus(row._id, "CLOSED")}
                sx={{ bgcolor: "rgba(0, 0, 0, 0.04)" }}
              >
                <LockOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Delete">
            <IconButton
              color="error"
              size="small"
              onClick={() => deleteJob(row._id)}
              sx={{ bgcolor: "rgba(244, 67, 54, 0.08)" }}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], []);

  /* =========================
     COMPUTED DATA (Filtering & Metrics)
  ========================= */
  const filteredJobs = useMemo(() => {
    const sTerm = search?.toLowerCase().trim();
    const stFilter = status?.toUpperCase();
    const catFilter = category;

    return jobs.filter((job) => {
      const matchSearch = !sTerm || job.jobTit?.toLowerCase().includes(sTerm);
      const matchStatus = !stFilter || job.status?.toUpperCase() === stFilter;
      const matchCat = !catFilter || job.jobCat === catFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [jobs, search, status, category]);

  const metrics = useMemo(() => ({
    total: filteredJobs.length,
    active: filteredJobs.filter(j => j.status?.toUpperCase() === "ACTIVE").length,
    central: filteredJobs.filter(j => j.jobCat === "Central Government").length,
    state: filteredJobs.filter(j => j.jobCat === "State Government").length,
  }), [filteredJobs]);

  /* =========================
     LOADING STATE
  ========================= */
  if (loading && jobs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress thickness={5} size={50} />
      </Box>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4 }}
    >
      <Box p={4}>
        {/* ===== HEADER ===== */}
        <Typography variant="h4" fontWeight={900} mb={3} color="primary.main">
          🏛️ Govt Jobs Admin Panel
        </Typography>

        {/* ===== SUMMARY CARDS ===== */}
        <Grid container spacing={3} mb={4}>
          {[
            { label: "Total Govt Jobs", value: metrics.total, icon: <AssignmentOutlined />, color: "primary.main" },
            { label: "Active Postings", value: metrics.active, icon: <CheckCircleOutline />, color: "success.main" },
            { label: "Central Gov", value: metrics.central, icon: <PublicOutlined />, color: "info.main" },
            { label: "State Gov", value: metrics.state, icon: <AccountBalanceOutlined />, color: "warning.main" },
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #eef2f6", height: "100%", position: "relative", overflow: "hidden" }}>
                <CardContent sx={{ position: "relative", zIndex: 1 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={900} color={item.color} mt={1}>
                    {item.value}
                  </Typography>
                </CardContent>
                <Box sx={{ position: "absolute", top: 15, right: 15, opacity: 0.1, color: item.color }}>
                  {React.cloneElement(item.icon, { sx: { fontSize: 40 } })}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ===== FILTERS ===== */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: "1px solid #eef2f6" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search Job Title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                InputProps={{ startAdornment: <BusinessCenterOutlined sx={{ mr: 1, color: "text.disabled" }} fontSize="small" /> }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Central Government">Central Government</MenuItem>
                <MenuItem value="State Government">State Government</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={2} display="flex" justifyContent="flex-end">
              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={fetchJobs}
                sx={{ textTransform: "uppercase", fontWeight: 700, borderRadius: 2 }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ===== TABLE ===== */}
        <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid #eef2f6" }}>
          <Box height={520}>
            <DataGrid
              rows={filteredJobs}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              pageSizeOptions={[20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 20 } },
              }}
              disableRowSelectionOnClick
              hideFooterPagination
              sx={{ border: "none" }}
            />
          </Box>
        </Paper>
      </Box>

      {/* =========================
            VIEW DIALOG
        ========================= */}
      <Dialog
        open={Boolean(viewJob)}
        onClose={() => setViewJob(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        <DialogTitle sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2
        }}>
          <Typography variant="h6" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🏛️ GOVT JOB FULL DETAILS
          </Typography>
          <IconButton onClick={() => setViewJob(null)} sx={{ color: "white" }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        {viewJob && (
          <DialogContent sx={{ p: 4, bgcolor: "#fafafa" }}>
            <Grid container spacing={3}>
              {/* Header Section */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={3} mb={1}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", boxShadow: 2 }}>
                    <AccountBalanceOutlined fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900} color="primary.dark">
                      {viewJob.jobTit}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                      <LocationOnOutlined fontSize="inherit" />
                      <Typography variant="body2" fontWeight={500}>
                        {viewJob.jobCity}, {viewJob.jobDist}, {viewJob.jobState}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Classification Info */}
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', height: '100%', bgcolor: 'white' }}>
                  <CategoryOutlined color="primary" sx={{ mb: 1 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight={800}>CATEGORY</Typography>
                  <Typography variant="body1" fontWeight={700}>{viewJob.jobCat}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', height: '100%', bgcolor: 'white' }}>
                  <InfoOutlined color="info" sx={{ mb: 1 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight={800}>STATUS</Typography>
                  <Chip size="small" label={viewJob.status} color={STATUS_COLORS[viewJob.status]} sx={{ fontWeight: 800, mt: 0.5 }} />
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', height: '100%', bgcolor: 'white' }}>
                  <EventOutlined color="error" sx={{ mb: 1 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight={800}>DEADLINE</Typography>
                  <Typography variant="body1" fontWeight={700} color="error.main">
                    {viewJob.newDeadline ? new Date(viewJob.newDeadline).toLocaleDateString() : "-"}
                  </Typography>
                </Paper>
              </Grid>

              {/* Requirement Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider textAlign="left"><Typography variant="overline" fontWeight={900} color="primary">Job Requirements</Typography></Divider>
                <Box p={2} mt={1} sx={{ bgcolor: "white", borderRadius: 3, border: "1px solid #eef2f6" }}>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {viewJob.jobDesc || "No description provided for this notification."}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {viewJob.reqDegrees?.map((deg, i) => (
                      <Chip key={i} label={deg} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    )) || <Typography variant="caption">No specific degrees listed.</Typography>}
                  </Stack>
                </Box>
              </Grid>

              {/* Links Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider textAlign="left"><Typography variant="overline" fontWeight={900} color="primary">Official Resources</Typography></Divider>
                <Grid container spacing={2} mt={1}>
                  {viewJob.officialLink && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        href={viewJob.officialLink}
                        target="_blank"
                        startIcon={<LaunchOutlined />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        Official Website
                      </Button>
                    </Grid>
                  )}
                  {viewJob.notificationLink && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        href={viewJob.notificationLink}
                        target="_blank"
                        startIcon={<AssignmentOutlined />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        Notification PDF
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Posting History */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ p: 2, bgcolor: "rgba(25, 118, 210, 0.04)", borderRadius: 3, display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">Posted By: <b>{viewJob.postedBy?.name || "Admin"}</b></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeOutlined fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">Date: <b>{new Date(viewJob.createdAt).toLocaleDateString()}</b></Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        )}

        <DialogActions sx={{ p: 3, bgcolor: "white", borderTop: "1px solid #eef2f6" }}>
          <Button onClick={() => setViewJob(null)} variant="contained" sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default GovJobsAdmin;
