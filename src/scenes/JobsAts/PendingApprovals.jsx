import React, { useEffect, useMemo, useState } from "react";
import axios from "state/instant";
import {
  Box,
  Button,
  IconButton,
  Typography,
  TextField,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Tooltip,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  DeleteOutline,
  SaveOutlined,
  CloseOutlined,
  AccountCircleOutlined,
  VisibilityOffOutlined,
  ApartmentOutlined,
  CategoryOutlined,
  MapOutlined,
  PhoneOutlined,
  PaidOutlined,
  WorkOutline,
  DescriptionOutlined,
  PsychologyOutlined,
  CalendarTodayOutlined,
  BusinessCenterOutlined,
  SchoolOutlined,
  EngineeringOutlined,
  RoomOutlined,
  PublicOutlined,
  NotificationImportantOutlined,
  PeopleOutline,
  LinkOutlined,
  BusinessOutlined,
  AccessTimeOutlined,
  BadgeOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FiltersBar from "../dashboard/components/FiltersBar";
import { RefreshOutlined } from "@mui/icons-material";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* =========================
     FETCH JOBS
  ========================= */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/jobs", {
        params: {
          search: search || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });
      setJobs(res.data?.data || []);
    } catch {
      setSnack({
        open: true,
        message: "Failed to load jobs",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, dateFilters]);

  const processedJobs = useMemo(() => {
    let result = jobs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.jobTit?.toLowerCase().includes(q) ||
          j.cmpName?.toLowerCase().includes(q) ||
          j.jobDist?.toLowerCase().includes(q) ||
          j.jobInd?.toLowerCase().includes(q) ||
          j.jobMod?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [jobs, search]);

  /* =========================
     OPEN VIEW
  ========================= */
  const openView = (job) => {
    setSelectedJob(job);
    setFormData(job);
    setEditMode(false);
    setViewOpen(true);
  };

  /* =========================
     SAVE UPDATE
  ========================= */
  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`/admin/jobs/${selectedJob._id}`, formData);
      fetchJobs();
      setEditMode(false);
      setSnack({
        open: true,
        message: "Job updated successfully",
        severity: "success",
      });
    } catch {
      setSnack({
        open: true,
        message: "Update failed",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     DELETE JOB (Permanent)
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?"))
      return;

    try {
      await axios.delete(`/admin/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      setSnack({
        open: true,
        message: "Job deleted permanently",
        severity: "success",
      });
    } catch {
      setSnack({
        open: true,
        message: "Delete failed",
        severity: "error",
      });
    }
  };

  /* =========================
     HIDE/UNHIDE JOB
  ========================= */
  const handleToggleVisibility = async (id, isCurrentlyHidden) => {
    const action = isCurrentlyHidden ? "unhide" : "hide";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this job?`))
      return;

    try {
      const res = await axios.patch(`/admin/jobs/${id}/toggle-hide`);

      // Update the job in state with the new isHidden value
      setJobs((prev) =>
        prev.map((j) =>
          j._id === id ? { ...j, isHidden: res.data?.data?.isHidden } : j
        )
      );

      setSnack({
        open: true,
        message: `Job ${action}d successfully`,
        severity: "success",
      });
    } catch (error) {
      setSnack({
        open: true,
        message: error?.response?.data?.message || `${action} failed`,
        severity: "error",
      });
    }
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      { field: "jobTit", headerName: "Job Name", flex: 1.5 },
      { field: "cmpName", headerName: "Company", flex: 1.5 },
      { field: "jobTyp", headerName: "Type", flex: 1 },
      { field: "jobMod", headerName: "Work Mode", flex: 1 },
      { field: "jobDist", headerName: "District", flex: 1 },
      { field: "contactName", headerName: "Contact", flex: 1.2 },
      { field: "contactPhone", headerName: "Mobile", flex: 1 },
      {
        field: "jobInd",
        headerName: "Industry",
        flex: 1.2,
      },
      {
        field: "salary_range",
        headerName: "Salary",
        flex: 1.2,
        renderCell: ({ row }) => row.salary_range || (row.salMin && row.salMax ? `${row.salMin} - ${row.salMax}` : "-"),
      },
      {
        field: "createdAt",
        headerName: "Posted",
        flex: 1.2,
        renderCell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
      {
        field: "newDeadline",
        headerName: "Closing",
        flex: 1.2,
        renderCell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1.3,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => openView(row)}>
                <VisibilityOutlined />
              </IconButton>
            </Tooltip>

            <Tooltip title={row.isHidden ? "Unhide Job" : "Hide Job"}>
              <IconButton
                size="small"
                color={row.isHidden ? "success" : "warning"}
                onClick={() => handleToggleVisibility(row._id, row.isHidden)}
              >
                {row.isHidden ? <VisibilityOutlined /> : <VisibilityOffOutlined />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Permanently">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row._id)}
              >
                <DeleteOutline />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );



  return (
    <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
      {/* --- Header --- */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
          💼 JOB MANAGEMENT
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Manage and monitor all job postings, visibility, and company details
        </Typography>
      </Box>

      {/* 🚀 TOOLBAR (Matching Candidate User Page) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Job Name, Company, or District..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={fetchJobs}
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
        <Box height="70vh">
          <DataGrid
            rows={processedJobs}
            columns={columns}
            loading={loading}
            getRowId={(row) => row._id}
            pageSizeOptions={[20]}
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
            }}
            disableRowSelectionOnClick
            hideFooterPagination
            getRowClassName={(params) =>
              params.row.isHidden ? "hidden-row" : ""
            }
            sx={{
              "& .hidden-row": {
                opacity: 0.5,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              },
            }}
          />
        </Box>
      </Paper>

      {/* VIEW / EDIT DIALOG (Perfectly Synced with Backend) */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
          <Typography fontWeight={900} variant="h6">
            {editMode ? "✍️ EDIT JOB POSTING" : "💼 JOB DETAILS"}
          </Typography>
          {!editMode && (
            <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }} onClick={() => setEditMode(true)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ mt: 2, p: 4, bgcolor: "#fafafa" }}>
          <Grid container spacing={3}>

            {/* --- SECTION: BASIC JOB INFO --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">BASIC JOB INFORMATION</Typography></Divider></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Job Title" fullWidth value={formData.jobTit || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobTit: e.target.value })}
                InputProps={{ startAdornment: <WorkOutline sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Industry" fullWidth value={formData.jobInd || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobInd: e.target.value })}
                InputProps={{ startAdornment: <BusinessCenterOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Job Type" fullWidth value={formData.jobTyp || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobTyp: e.target.value })}
                InputProps={{ startAdornment: <CategoryOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Work Mode" fullWidth value={formData.jobMod || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobMod: e.target.value })}
                InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Category" fullWidth value={formData.jobCat || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobCat: e.target.value })}
                InputProps={{ startAdornment: <PublicOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>

            {/* --- SECTION: COMPANY & CONTACT --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">COMPANY & CONTACT PERSON</Typography></Divider></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Company Name" fullWidth value={formData.cmpName || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, cmpName: e.target.value })}
                InputProps={{ startAdornment: <ApartmentOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Company Website" fullWidth value={formData.cmpWeb || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, cmpWeb: e.target.value })}
                InputProps={{ startAdornment: <LinkOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Person" fullWidth value={formData.contactName || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Phone" fullWidth value={formData.contactPhone || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>

            {/* --- SECTION: LOCATION DETAILS --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">LOCATION & ADDRESS</Typography></Divider></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="District" fullWidth value={formData.jobDist || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobDist: e.target.value })}
                InputProps={{ startAdornment: <MapOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="City" fullWidth value={formData.jobCity || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobCity: e.target.value })}
                InputProps={{ startAdornment: <RoomOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Area" fullWidth value={formData.jobArea || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobArea: e.target.value })}
                InputProps={{ startAdornment: <RoomOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="PIN Code" fullWidth value={formData.jobPin || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobPin: e.target.value })}
                InputProps={{ startAdornment: <RoomOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>


            {/* --- SECTION: REQUIREMENTS & ELIGIBILITY --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">REQUIREMENTS & EDUCATION</Typography></Divider></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Education Level" fullWidth value={formData.eduLvl || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, eduLvl: e.target.value })}
                InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Course" fullWidth value={formData.eduCourse || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, eduCourse: e.target.value })}
                InputProps={{ startAdornment: <SchoolOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Experience Level" fullWidth value={formData.expLvl || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, expLvl: e.target.value })}
                InputProps={{ startAdornment: <WorkOutline sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Notice Period" fullWidth value={formData.notPer || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, notPer: e.target.value })}
                InputProps={{ startAdornment: <NotificationImportantOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Openings" type="number" fullWidth value={formData.openings || 1} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                InputProps={{ startAdornment: <PeopleOutline sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>

            {/* --- SECTION: SALARY & ON-JOB TRAINING --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">PAYROLL & OJT DETAILS</Typography></Divider></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Salary Range" fullWidth value={formData.salary_range || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                InputProps={{ startAdornment: <PaidOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Salary Type" fullWidth value={formData.salTyp || "Monthly"} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, salTyp: e.target.value })}
                InputProps={{ startAdornment: <PaidOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Deadline" type="date" fullWidth
                value={formData.newDeadline ? new Date(formData.newDeadline).toISOString().split('T')[0] : ""}
                disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, newDeadline: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <CalendarTodayOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="OJT Available?" select fullWidth value={formData.ojtAvailable ? "Yes" : "No"} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, ojtAvailable: e.target.value === "Yes" })}
                SelectProps={{ native: true }}
                InputProps={{ startAdornment: <EngineeringOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="OJT Duration" fullWidth value={formData.ojtDuration || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, ojtDuration: e.target.value })}
                InputProps={{ startAdornment: <AccessTimeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
              />
            </Grid>

            {/* --- SECTION: SKILLS & DESCRIPTION --- */}
            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" fontWeight={900} color="primary">SKILLS & JOB DESCRIPTION</Typography></Divider></Grid>

            <Grid item xs={12}>
              <TextField label="Required Skills" fullWidth multiline rows={2}
                value={Array.isArray(formData.reqSkills) ? formData.reqSkills.join(", ") : formData.reqSkills || ""}
                disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, reqSkills: e.target.value.split(",").map(s => s.trim()) })}
                placeholder="Skill 1, Skill 2, etc."
                InputProps={{ startAdornment: <PsychologyOutlined sx={{ mr: 1, color: "primary.main", mt: 1 }} /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Job Description" fullWidth multiline rows={4} value={formData.jobDesc || ""} disabled={!editMode}
                onChange={(e) => setFormData({ ...formData, jobDesc: e.target.value })}
                InputProps={{ startAdornment: <DescriptionOutlined sx={{ mr: 1, color: "primary.main", mt: 1 }} /> }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9" }}>
          {editMode ? (
            <Stack direction="row" spacing={2}>
              <Button startIcon={<CloseOutlined />} onClick={() => setEditMode(false)} variant="outlined">
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={() => setViewOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminJobs;
