import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  RefreshOutlined,
  VisibilityOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  BusinessOutlined,
  AccountCircleOutlined,
  LocalPhoneOutlined,
  WorkOutline,
  WorkHistoryOutlined,
  EmailOutlined,
  SchoolOutlined,
  EventOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import apiClient from "../../api/apiClient";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";
import FiltersBar from "../dashboard/components/FiltersBar";

/* =========================
   PAGE ANIMATION
========================= */
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const Reports = () => {
  const [rows, setRows] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [error, setError] = useState("");
  const [openView, setOpenView] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

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

      const [companiesRes, jobsRes, candidatesRes, employersRes] = await Promise.all([
        apiClient.get("/admin/companies"),
        apiClient.get("/admin/jobs"),
        apiClient.get("/admin/candidates"),
        apiClient.get("/admin/employers"),
      ]);

      const companiesRaw = Array.isArray(companiesRes.data) ? companiesRes.data : (Array.isArray(companiesRes) ? companiesRes : []);
      const jobsRaw = Array.isArray(jobsRes.data) ? jobsRes.data : (Array.isArray(jobsRes) ? jobsRes : []);
      const candidatesRaw = Array.isArray(candidatesRes.data?.data) ? candidatesRes.data.data : (Array.isArray(candidatesRes.data) ? candidatesRes.data : []);
      const employersRaw = Array.isArray(employersRes.data) ? employersRes.data : (Array.isArray(employersRes) ? employersRes : []);

      // Merge both candidates and employers into one pool for finding master user records
      const usersRaw = [...candidatesRaw, ...employersRaw];

      setAllJobs(jobsRaw);

      const formatted = companiesRaw.map((comp, index) => {
        // Find master user (Candidate or Employer) to get reliable referral info
        const masterUser = usersRaw.find(u => {
          const compEmail = (comp.empemail || comp.email || "").toLowerCase();
          const userEmail = (u.canemail || u.email || u.empemail || "").toLowerCase();
          return (compEmail && userEmail && compEmail === userEmail) || (u._id === comp._id);
        }) || {};

        // Count jobs for this company
        const companyJobsCount = jobsRaw.filter(j =>
          j.cmpName === comp.empcomNam ||
          j.postedBy?._id === comp._id
        ).length;

        return {
          id: comp._id || index,
          collegeName: comp.empcomNam || "-",
          collegePhone: comp.empphone || comp.mobile || "-",
          collegeEmail: comp.empemail || comp.email || "-",
          collegeAddress: `${comp.empaddr || ""}, ${comp.emplocal || ""}, ${comp.empdist || ""}, ${comp.empstate || ""} - ${comp.emppin || ""}`.trim().replace(/^,+|,+$/g, '') || "-",

          // Referral Info
          referredBy: masterUser.referredBy || masterUser.referredby || comp.referredBy || comp.referredby || "-",
          referrerName: masterUser.referrerName || masterUser.referrername || comp.referrerName || comp.referrername || "-",
          referrerPhone: masterUser.referrerPhone || masterUser.referrerphone || comp.referrerPhone || comp.referrerphone || "-",

          jobsCount: companyJobsCount,
          createdAt: comp.createdAt ? new Date(comp.createdAt).toISOString().split("T")[0] : "-",
        };
      });

      setRows(formatted);
      setFilteredRows(formatted);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "API Fetch Failed");
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
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter((row) => {
      if (!row.createdAt || row.createdAt === "-") return false;

      if (startDate && endDate) {
        return row.createdAt >= startDate && row.createdAt <= endDate;
      } else if (startDate) {
        return row.createdAt >= startDate;
      } else if (endDate) {
        return row.createdAt <= endDate;
      }
      return true;
    });

    setFilteredRows(filtered);
  };

  /* =========================
     SEARCH FILTER
  ========================= */
  const searchedFilteredRows = useMemo(() => {
    let result = filteredRows;

    // 1. Source Filter Application
    if (sourceFilter) {
      result = result.filter(r => {
        const source = (r.referredBy || "").toLowerCase();
        const filter = sourceFilter.toLowerCase();
        if (filter === "friend") return source.includes("friend") || source.includes("person") || source.includes("family");
        return source.includes(filter);
      });
    }

    // 2. Search Filter Application
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (r) =>
        (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
        (r.collegeEmail && r.collegeEmail.toLowerCase().includes(q)) ||
        (r.collegePhone && r.collegePhone.toLowerCase().includes(q)) ||
        (r.referrerName && r.referrerName.toLowerCase().includes(q)) ||
        (r.referredBy && r.referredBy.toLowerCase().includes(q))
    );
  }, [filteredRows, search, sourceFilter]);

  /* =========================
     SUMMARY TOTALS
  ========================= */
  const totalCompaniesCount = searchedFilteredRows.length;
  const totalJobsPosted = searchedFilteredRows.reduce((sum, row) => sum + (row.jobsCount || 0), 0);
  const totalReferrals = searchedFilteredRows.filter(r => r.referredBy !== "-" && r.referredBy !== "None").length;

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      { field: "collegeName", headerName: "Company Name", flex: 1.2 },
      { field: "collegePhone", headerName: "Company Phone", flex: 0.8 },
      { field: "referrerName", headerName: "Referrer Name", flex: 0.8 },
      { field: "referrerPhone", headerName: "Referrer Phone", flex: 0.8 },
      { field: "referredBy", headerName: "Referred By", flex: 0.8 },
      {
        field: "actions",
        headerName: "View",
        flex: 0.4,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="View Details">
            <IconButton
              color="primary"
              onClick={() => {
                setSelectedRow(params.row);
                setOpenView(true);
              }}
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
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4 }}
      >
        <Box p={4}>
          <Typography variant="h4" fontWeight={900} mb={3} color="primary.main">
            🏢 Company Referral Report
          </Typography>

          {/* ================= SUMMARY CARDS ================= */}
          <Grid container spacing={3} mb={4}>
            {[
              { label: "Total Companies", value: totalCompaniesCount },
              { label: "Total Jobs Posted", value: totalJobsPosted },
              { label: "Total Referrals", value: totalReferrals },
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card elevation={2} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: "uppercase" }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="primary.main">
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ================= SEARCH BAR ================= */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

          {error && <Alert severity="error">{error}</Alert>}

          {/* ================= TABLE ================= */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            {loading ? (
              <Box textAlign="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <Box height={520}>
                <DataGrid
                  rows={searchedFilteredRows}
                  columns={columns}
                  pageSizeOptions={[20]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 20 } },
                  }}
                  disableRowSelectionOnClick
                  hideFooterPagination
                />
              </Box>
            )}
          </Paper>
        </Box>
      </motion.div>

      {/* ================= VIEW DIALOG ================= */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          bgcolor: "primary.main",
          color: "white",
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" fontWeight={900}>🏢 COMPANY FULL PROFILE</Typography>
          <IconButton onClick={() => setOpenView(false)} sx={{ color: "white" }}>
            <RefreshOutlined sx={{ transform: "rotate(45deg)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "#fafafa" }}>
          {selectedRow && (
            <Grid container spacing={4}>
              {/* Header Info */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                    <BusinessOutlined />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900} color="primary.dark">
                      {selectedRow.collegeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Company Registered on {selectedRow.createdAt}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Basic Contact Section */}
              <Grid item xs={12}><Typography variant="overline" fontWeight={900} color="primary">Contact & Location</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Company Phone" fullWidth value={selectedRow.collegePhone} disabled InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Company Email" fullWidth value={selectedRow.collegeEmail} disabled InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Complete Address" fullWidth multiline rows={2} value={selectedRow.collegeAddress} disabled InputProps={{ startAdornment: <LocationOnOutlined sx={{ mr: 1, mt: 1, color: "primary.main" }} /> }} />
              </Grid>

              {/* Referral Section */}
              <Grid item xs={12} sx={{ mt: 2 }}><Divider><Typography variant="overline" fontWeight={900} color="primary">Referral Details</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Referrer Name" fullWidth value={selectedRow.referrerName} disabled InputProps={{ startAdornment: <AccountCircleOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Referrer Phone" fullWidth value={selectedRow.referrerPhone} disabled InputProps={{ startAdornment: <LocalPhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Referred By (Source)" fullWidth value={selectedRow.referredBy} disabled InputProps={{ startAdornment: <WorkOutline sx={{ mr: 1, color: "primary.main" }} /> }} />
              </Grid>

              {/* Activity Section */}
              <Grid item xs={12} sx={{ mt: 2 }}><Divider><Typography variant="overline" fontWeight={900} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WorkHistoryOutlined fontSize="small" /> Activity Summary</Typography></Divider></Grid>
              <Grid item xs={12}>
                <Box p={2} sx={{ bgcolor: "primary.light", borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h6" fontWeight={900} color="white">
                    {selectedRow.jobsCount}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="white">
                    Total Jobs Posted by this Institution
                  </Typography>
                </Box>
              </Grid>

              {/* Jobs Table Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider><Typography variant="overline" fontWeight={900} color="primary">Job Posting History</Typography></Divider>
                {allJobs.filter(j => j.cmpName === selectedRow.collegeName || j.postedBy?._id === selectedRow.id).length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 900 }}>Job Title</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Type / Mode</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Posted Date</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Deadline</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allJobs
                          .filter(j => j.cmpName === selectedRow.collegeName || j.postedBy?._id === selectedRow.id)
                          .map((job, idx) => (
                            <TableRow key={job._id || idx} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                  {job.jobTit}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ display: 'block' }}>{job.jobTyp}</Typography>
                                <Typography variant="caption" color="text.secondary">{job.jobMod}</Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <EventOutlined fontSize="inherit" color="action" />
                                  <Typography variant="caption">
                                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <AccessTimeOutlined fontSize="inherit" color="error" />
                                  <Typography variant="caption" fontWeight={700} color="error.main">
                                    {job.newDeadline ? new Date(job.newDeadline).toLocaleDateString() : "-"}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box p={4} textAlign="center" sx={{ border: "2px dashed #eee", borderRadius: 3, mt: 2 }}>
                    <Typography color="text.secondary" fontStyle="italic">
                      No jobs have been posted by this company yet.
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #eee" }}>
          <Button onClick={() => setOpenView(false)} variant="contained" sx={{ px: 4, fontWeight: 900, borderRadius: 2 }}>
            Close Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Reports;
