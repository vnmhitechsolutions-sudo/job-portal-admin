import React, { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  RefreshOutlined,
  PersonOutline,
  EmailOutlined,
  BadgeOutlined,
  WorkOutline,
  ApartmentOutlined,
  AccessTimeOutlined,
  AssessmentOutlined,
  EngineeringOutlined,
  LocationOnOutlined,
  CategoryOutlined,
  CalendarTodayOutlined,
  LinkOutlined,
  DescriptionOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FiltersBar from "../dashboard/components/FiltersBar";
import axiosInstance from "state/instant";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    interviewMode: "",
    interviewTime: "",
    interviewDate: "",
    interviewLink: "",
    interviewNotes: "",
    candidateInstructions: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilters, setDateFilters] = useState({});

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* =========================
     FETCH APPLICATIONS
  ========================= */
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/admin/applications", {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });
      if (data.success) setApplications(data.data);
    } catch (err) {
      setSnack({
        open: true,
        message: "Failed to fetch applications",
        severity: "error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [search, dateFilters, statusFilter]);

  const processedApps = useMemo(() => {
    let result = applications;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (app) =>
          app.candidateId?.canname?.toLowerCase().includes(q) ||
          app.candidateId?.canemail?.toLowerCase().includes(q) ||
          (app.jobId?._id || app.jobId)?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((app) => app.status === statusFilter);
    }

    return result;
  }, [applications, search, statusFilter]);

  /* =========================
     VIEW - Fetch single application
  ========================= */
  const handleView = async (app) => {
    setLoadingView(true);
    try {
      const { data } = await axiosInstance.get(
        `/admin/applications/${app._id}`
      );
      if (data.success) {
        setSelectedApp(data.data);
        // Initialize form with fetched data
        let formattedTime = data.data.interviewTime || "";
        // Convert "10:00 AM" -> "10:00" for type="time"
        if (formattedTime.toLowerCase().includes("am") || formattedTime.toLowerCase().includes("pm")) {
          try {
            const [time, modifier] = formattedTime.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier.toLowerCase() === 'pm') hours = parseInt(hours, 10) + 12;
            formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;
          } catch (e) { formattedTime = ""; }
        }

        setFormData({
          status: data.data.status || "",
          interviewMode: data.data.interviewMode || "",
          interviewTime: formattedTime,
          interviewDate: data.data.interviewDate ? new Date(data.data.interviewDate).toISOString().split('T')[0] : "",
          interviewLink: data.data.interviewLink || "",
          interviewNotes: data.data.interviewNotes || "",
          candidateInstructions: data.data.candidateInstructions || "",
        });
        setEditMode(false);
        setViewOpen(true);
      } else {
        setSnack({
          open: true,
          message: "Failed to load application",
          severity: "error",
        });
      }
    } catch (err) {
      setSnack({
        open: true,
        message: "Error loading application details",
        severity: "error",
      });
    }
    setLoadingView(false);
  };

  /* =========================
     EDIT MODE TOGGLE
  ========================= */
  const handleEditToggle = () => {
    if (!editMode) {
      // Entering edit mode - ensure formData is fresh
      setFormData({
        status: selectedApp?.status || "",
        interviewMode: selectedApp?.interviewMode || "",
        interviewTime: selectedApp?.interviewTime || "",
        interviewDate: selectedApp?.interviewDate ? new Date(selectedApp.interviewDate).toISOString().split('T')[0] : "",
        interviewLink: selectedApp?.interviewLink || "",
        interviewNotes: selectedApp?.interviewNotes || "",
        candidateInstructions: selectedApp?.candidateInstructions || "",
      });
    }
    setEditMode(!editMode);
  };

  const handleCancelEdit = () => {
    // Reset formData to selectedApp values when canceling
    setFormData({
      status: selectedApp?.status || "",
      interviewMode: selectedApp?.interviewMode || "Virtual",
      interviewTime: selectedApp?.interviewTime || "",
      interviewDate: selectedApp?.interviewDate ? new Date(selectedApp.interviewDate).toISOString().split('T')[0] : "",
      interviewLink: selectedApp?.interviewLink || "",
      interviewNotes: selectedApp?.interviewNotes || "",
      candidateInstructions: selectedApp?.candidateInstructions || "",
    });
    setEditMode(false);
  };

  /* =========================
     SAVE UPDATE
  ========================= */
  const handleSave = async () => {
    if (!selectedApp) return;

    try {
      const { data } = await axiosInstance.put(
        `/admin/applications/${selectedApp._id}`,
        {
          status: formData.status,
          interviewMode: formData.interviewMode,
          interviewTime: formData.interviewTime,
          interviewDate: formData.interviewDate,
          interviewLink: formData.interviewLink,
          interviewNotes: formData.interviewNotes,
          candidateInstructions: formData.candidateInstructions,
        }
      );

      if (data.success) {
        setSnack({
          open: true,
          message: "Application updated successfully",
          severity: "success",
        });

        // Update local state with returned data
        setSelectedApp(data.data);
        setFormData({
          status: data.data.status || "",
          interviewMode: data.data.interviewMode || "",
          interviewTime: data.data.interviewTime || "",
        });

        // Refresh list
        fetchApplications();
        setEditMode(false);
      } else {
        setSnack({
          open: true,
          message: data.message || "Update failed",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      setSnack({
        open: true,
        message: err.response?.data?.message || "Update failed",
        severity: "error",
      });
    }
  };

  /* =========================
     CLOSE DIALOG
  ========================= */
  const handleCloseDialog = () => {
    if (editMode) {
      handleCancelEdit();
    }
    setViewOpen(false);
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      {
        field: "candidateName",
        headerName: "Candidate Name",
        flex: 1.2,
        renderCell: ({ row }) =>
          row.candidateId?.canname || "—",
      },
      {
        field: "candidateEmail",
        headerName: "Email",
        flex: 1.2,
        renderCell: ({ row }) =>
          row.candidateId?.canemail || "—",
      },
      {
        field: "referrer",
        headerName: "Referrer",
        flex: 0.8,
        renderCell: ({ row }) =>
          row.candidateId?.referrerName || row.candidateId?.referrername || "—",
      },
      {
        field: "referredBy",
        headerName: "Source",
        flex: 0.8,
        renderCell: ({ row }) =>
          row.candidateId?.referredBy || row.candidateId?.referredby || "—",
      },
      {
        field: "jobId",
        headerName: "Job ID",
        flex: 1.2,
        renderCell: ({ row }) =>
          row.jobId?._id || row.jobId || "—",
      },
      {
        field: "interviewMode",
        headerName: "Interview Mode",
        flex: 1,
      },
      {
        field: "interviewTime",
        headerName: "Interview Time",
        flex: 1,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        renderCell: ({ row }) => {
          const statusColors = {
            "Applied": "info",
            "Shortlisted": "warning",
            "Interview Scheduled": "secondary",
            "Selected": "success",
            "Hired": "success",
            "Rejected": "error",
            "Viewed": "default",
          };
          return (
            <Chip
              size="small"
              label={row.status}
              color={statusColors[row.status] || "primary"}
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.8,
        sortable: false,
        renderCell: ({ row }) => (
          <Tooltip title="View Details">
            <IconButton
              onClick={() => handleView(row)}
              disabled={loadingView}
              sx={{ bgcolor: "rgba(25, 118, 210, 0.08)", "&:hover": { bgcolor: "rgba(25, 118, 210, 0.15)" } }}
            >
              <VisibilityOutlined color="primary" fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [loadingView]
  );

  return (
    <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
      {/* --- Header --- */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
          📋 JOB APPLICATIONS
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Track and manage candidate applications, statuses, and interview schedules
        </Typography>
      </Box>

      {/* 🚀 TOOLBAR (Matching Candidate User Page) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Name, Email, or Job ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Applied">Applied</MenuItem>
              <MenuItem value="Shortlisted">Shortlisted</MenuItem>
              <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
              <MenuItem value="Hired">Hired</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={5} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={fetchApplications}
              size="small"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* --- Date Filters --- */}
      <Box mb={3}>
        <FiltersBar onFilterChange={setDateFilters} />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <Box height="65vh">
          <DataGrid
            rows={processedApps}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            pageSizeOptions={[20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 20 },
              },
            }}
            hideFooterPagination
          />
        </Box>
      </Paper>

      {/* VIEW / EDIT DIALOG (Premium Stylings) */}
      <Dialog
        open={viewOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
          <Typography fontWeight={900} variant="h6">
            {editMode ? "✍️ EDIT APPLICATION STATUS" : "📄 APPLICATION DETAILS"}
          </Typography>
          {!editMode && (
            <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }} onClick={handleEditToggle} disabled={loadingView}>
              <EditOutlined fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ mt: 2, p: 4, bgcolor: "#fafafa" }}>
          {loadingView ? (
            <Box textAlign="center" py={10}>
              <CircularProgress />
            </Box>
          ) : selectedApp ? (
            <Grid container spacing={3}>

              {/* --- CANDIDATE HEADER --- */}
              <Grid item xs={12} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "2rem", boxShadow: 3 }}>
                  {selectedApp.candidateId?.canname?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} color="primary.dark">
                    {selectedApp.candidateId?.canname || "Unknown Candidate"}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Ref ID: {selectedApp._id}
                  </Typography>
                </Box>
              </Grid>

              {/* --- SECTION 1: CANDIDATE INFO --- */}
              <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="text.disabled">CANDIDATE PROFILE</Typography></Divider></Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Candidate Name"
                  fullWidth
                  value={selectedApp.candidateId?.canname || ""}
                  disabled
                  InputProps={{ startAdornment: <PersonOutline sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Email Address"
                  fullWidth
                  value={selectedApp.candidateId?.canemail || ""}
                  disabled
                  InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Candidate Phone"
                  fullWidth
                  value={selectedApp.candidateId?.canphone || "—"}
                  disabled
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              {/* --- SECTION 1.5: REFERRAL INFO --- */}
              <Grid item xs={12} sx={{ mt: 1 }}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="text.disabled">REFERRAL & SOURCE</Typography></Divider></Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Referred By"
                  fullWidth
                  value={selectedApp.candidateId?.referredBy || selectedApp.candidateId?.referredby || "Direct Registry"}
                  disabled
                  InputProps={{ startAdornment: <PersonOutline sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Referrer Name"
                  fullWidth
                  value={selectedApp.candidateId?.referrerName || selectedApp.candidateId?.referrername || "N/A"}
                  disabled
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Referrer Phone"
                  fullWidth
                  value={selectedApp.candidateId?.referrerPhone || selectedApp.candidateId?.referrerphone || "N/A"}
                  disabled
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              {/* --- SECTION 2: JOB DETAILS --- */}
              <Grid item xs={12} sx={{ mt: 2 }}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="text.disabled">TARGET JOB DETAILS</Typography></Divider></Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Job ID / Code"
                  fullWidth
                  value={selectedApp.jobId?._id || selectedApp.jobId || ""}
                  disabled
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Job Title"
                  fullWidth
                  value={selectedApp.jobId?.jobTit || "N/A"}
                  disabled
                  InputProps={{ startAdornment: <WorkOutline sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Company"
                  fullWidth
                  value={selectedApp.jobId?.cmpName || "N/A"}
                  disabled
                  InputProps={{ startAdornment: <ApartmentOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Job Location"
                  fullWidth
                  value={selectedApp.jobId?.jobDist || selectedApp.jobId?.jobCity || "—"}
                  disabled
                  InputProps={{ startAdornment: <LocationOnOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              {/* --- SECTION 3: APPLICATION PIPELINE --- */}
              <Grid item xs={12} sx={{ mt: 2 }}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="text.disabled">APPLICATION PIPELINE & INTERVIEW</Typography></Divider></Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Interview Mode"
                  fullWidth
                  select
                  disabled={!editMode}
                  value={formData.interviewMode}
                  onChange={(e) => setFormData({ ...formData, interviewMode: e.target.value })}
                  InputProps={{ startAdornment: <EngineeringOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                >
                  <MenuItem value=""><em>None Selected</em></MenuItem>
                  <MenuItem value="Virtual">Virtual Meeting</MenuItem>
                  <MenuItem value="Offline">In-Person Interview</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Interview Time"
                  type="time"
                  fullWidth
                  disabled={!editMode}
                  value={formData.interviewTime}
                  onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <AccessTimeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Interview Date"
                  type="date"
                  fullWidth
                  disabled={!editMode}
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <CalendarTodayOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  label="Interview / Meeting Link"
                  fullWidth
                  disabled={!editMode}
                  value={formData.interviewLink}
                  onChange={(e) => setFormData({ ...formData, interviewLink: e.target.value })}
                  placeholder="https://..."
                  InputProps={{ startAdornment: <LinkOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Candidate Instructions"
                  fullWidth
                  multiline
                  rows={2}
                  disabled={!editMode}
                  value={formData.candidateInstructions}
                  onChange={(e) => setFormData({ ...formData, candidateInstructions: e.target.value })}
                  placeholder="Please bring your original documents, etc."
                  InputProps={{ startAdornment: <DescriptionOutlined sx={{ mr: 1, color: "primary.main", mt: 1 }} /> }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Internal Interview Notes"
                  fullWidth
                  multiline
                  rows={2}
                  disabled={!editMode}
                  value={formData.interviewNotes}
                  onChange={(e) => setFormData({ ...formData, interviewNotes: e.target.value })}
                  placeholder="Internal feedback, panel names, etc."
                  InputProps={{ startAdornment: <AssessmentOutlined sx={{ mr: 1, color: "primary.main", mt: 1 }} /> }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Pipeline status"
                  fullWidth
                  select
                  disabled={!editMode}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  InputProps={{ startAdornment: <AssessmentOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                >
                  {[
                    "Applied",
                    "Viewed",
                    "Shortlisted",
                    "Interview Scheduled",
                    "Selected",
                    "Rejected",
                    "Hired",
                  ].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f0f7ff", borderColor: "#c2e0ff", borderRadius: 2 }}>
                  <Typography variant="caption" color="primary" fontWeight={900} display="block" mb={0.5}>
                    ADMIN DASHBOARD INFO:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Application received on {new Date(selectedApp.createdAt).toLocaleDateString()} at {new Date(selectedApp.createdAt).toLocaleTimeString()}. All status changes are logged for candidate tracking.
                  </Typography>
                </Paper>
              </Grid>

            </Grid>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9" }}>
          {editMode ? (
            <Stack direction="row" spacing={2}>
              <Button startIcon={<CloseOutlined />} onClick={handleCancelEdit} variant="outlined">
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                Save Changes
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={handleCloseDialog} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnack({
            ...snack,
            open: false,
          })
        }
      >
        <Alert
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Applications;
