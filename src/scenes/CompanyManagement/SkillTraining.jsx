import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  DeleteOutline,
  SaveOutlined,
  RefreshOutlined,
  LinkOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

/* =========================
   CONSTANTS (BACKEND MATCH)
========================= */
const LANGUAGES = ["English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada"];
const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CANCELLED"];
const CATEGORY_OPTIONS = ["Soft Skills", "IT", "Non-IT", "Career"];

const SkillTrainingManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    shortTag: "",
    description: "",
    category: "",
    date: "",
    time: "",
    durationMinutes: "",
    language: [],
    price: "",
    isFree: true,
    benefits: "",
    curriculum: "",
    instructor: {
      name: "",
      photo: "",
      designation: "",
    },
    maxSeats: "",
    status: "DRAFT",
    meetingLink: "",
    isActive: true,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* ================= FETCH ================= */
  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/skill-trainings");
      const data = res.data || (Array.isArray(res) ? res : []);
      setTrainings(data);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  /* ================= HANDLERS ================= */
  const handleOpenView = (item) => {
    setSelectedItem(item);
    setFormData({
      title: item.title || "",
      shortTag: item.shortTag || "",
      description: item.description || "",
      category: item.category || "",
      date: item.date ? item.date.split("T")[0] : "",
      time: item.time || "",
      durationMinutes: item.durationMinutes || "",
      language: item.language || [],
      price: item.price || "",
      isFree: typeof item.isFree === "boolean" ? item.isFree : true,
      benefits: Array.isArray(item.benefits) ? item.benefits.join("\n") : "",
      curriculum: Array.isArray(item.curriculum) ? item.curriculum.join("\n") : "",
      instructor: item.instructor || { name: "", photo: "", designation: "" },
      maxSeats: item.maxSeats || "",
      status: item.status || "DRAFT",
      meetingLink: item.meetingLink || "",
      isActive: typeof item.isActive === "boolean" ? item.isActive : true,
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        benefits: formData.benefits.split("\n").filter(Boolean),
        curriculum: formData.curriculum.split("\n").filter(Boolean),
        price: formData.isFree ? 0 : Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        maxSeats: Number(formData.maxSeats),
      };

      await apiClient.put(`/admin/skill-trainings/${selectedItem._id}`, payload);
      setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
      setOpenDialog(false);
      fetchTrainings();
    } catch (err) {
      setSnackbar({ open: true, message: "Update failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this training?")) return;
    try {
      await apiClient.delete(`/admin/skill-trainings/${id}`);
      setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
      fetchTrainings();
    } catch (err) {
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  const toggleLanguage = (lang) => {
    setFormData({
      ...formData,
      language: formData.language.includes(lang)
        ? formData.language.filter((l) => l !== lang)
        : [...formData.language, lang],
    });
  };

  /* ================= FILTER ================= */
  const filteredRows = useMemo(() => {
    let result = trainings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q));
    }
    if (dateFilters.startDate || dateFilters.endDate) {
      result = result.filter((tut) => {
        if (!tut.date) return false;
        const d = new Date(tut.date).toISOString().split("T")[0];
        if (dateFilters.startDate && dateFilters.endDate)
          return d >= dateFilters.startDate && d <= dateFilters.endDate;
        if (dateFilters.startDate) return d >= dateFilters.startDate;
        if (dateFilters.endDate) return d <= dateFilters.endDate;
        return true;
      });
    }
    return result;
  }, [trainings, search, dateFilters]);

  /* ================= COLUMNS ================= */
  const columns = useMemo(() => [
    {
      field: "title",
      headerName: "TRAINING TITLE",
      flex: 1.5,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 8, height: 35, borderRadius: 1, bgcolor: row.status === "PUBLISHED" ? "success.main" : "warning.main" }} />
          <Stack>
            <Typography variant="body2" fontWeight={700} color="text.primary">{row.title}</Typography>
            <Typography variant="caption" color="text.secondary">{row.shortTag}</Typography>
          </Stack>
        </Stack>
      )
    },
    { field: "category", headerName: "CATEGORY", flex: 0.8 },
    { field: "date", headerName: "DATE", flex: 0.8, renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : "—" },
    { field: "price", headerName: "PRICE", flex: 0.7, renderCell: ({ row }) => row.isFree ? "Free" : `₹${row.price}` },
    {
      field: "status",
      headerName: "STATUS",
      flex: 0.8,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === "PUBLISHED" ? "success" : value === "CANCELLED" ? "error" : "warning"}
          sx={{ fontWeight: 700, borderRadius: "6px" }}
        />
      )
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleOpenView(row)} sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(row._id)} sx={{ bgcolor: "rgba(211, 47, 47, 0.08)" }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [fetchTrainings]);

  return (
    <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
      {/* --- Header Section --- */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
          📘 SKILL TRAINING MANAGEMENT
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Plan, oversee, and manage specialized workshops and candidate development programs
        </Typography>
      </Box>

      {/* 🚀 TOOLBAR (Matching Candidate User Page) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Title, Category, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={fetchTrainings}
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

      {/* --- Data Grid --- */}
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <Box height="70vh">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            getRowId={(r) => r._id}
            pageSizeOptions={[20]}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "text.secondary", fontWeight: 700, borderBottom: "1px solid #eef2f6" },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f8faff" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fbfcfe" },
            }}
          />
        </Box>
      </Paper>

      {/* --- View/Edit Dialog --- */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle component="div" sx={{ bgcolor: "primary.main", color: "white", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={800}>
            {editMode ? "✍️ EDIT SKILL TRAINING" : "� TRAINING DETAILS"}
          </Typography>
          {!editMode && (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              sx={{ bgcolor: "white", color: "primary.main", "&:hover": { bgcolor: "#f0f0f0" }, fontWeight: 700, borderRadius: 2 }}
            >
              Edit
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4} mt={1}>
            {/* Section: General Info */}
            <Box>
              <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Course Specifications
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Training Title" value={formData.title} disabled={!editMode} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Short Tag / ID" value={formData.shortTag} disabled={!editMode} onChange={(e) => setFormData({ ...formData, shortTag: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Program Description" value={formData.description} disabled={!editMode} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Main Category" value={formData.category} disabled={!editMode} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Course Status" value={formData.status} disabled={!editMode} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Photo Reference URL" value={formData.instructor.photo} disabled={!editMode} onChange={(e) => setFormData({ ...formData, instructor: { ...formData.instructor, photo: e.target.value } })} />
                </Grid>
              </Grid>
            </Box>

            {/* Section: Schedule & Logistics */}
            <Box>
              <Typography variant="overline" color="success.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Time & Connectivity
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="date" label="Start Date" value={formData.date} disabled={!editMode} onChange={(e) => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Preferred Time" value={formData.time} disabled={!editMode} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Duration (min)" value={formData.durationMinutes} disabled={!editMode} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Meeting / Webinar Link"
                    value={formData.meetingLink}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="Zoom, MS Teams, Google Meet link"
                    InputProps={{
                      startAdornment: <LinkOutlined sx={{ mr: 1, color: "primary.main" }} />,
                    }}
                  />
                  {formData.meetingLink && !editMode && (
                    <Button variant="text" size="small" href={formData.meetingLink} target="_blank" sx={{ mt: 1, fontWeight: 700 }}>Launch Program</Button>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Section: Pricing & Capacity */}
            <Box>
              <Typography variant="overline" color="secondary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Pricing & Availability
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fcfdff", borderRadius: 2 }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item>
                    <FormControlLabel
                      control={<Switch checked={formData.isFree} disabled={!editMode} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} />}
                      label="Free Session"
                    />
                  </Grid>
                  {!formData.isFree && (
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Price (₹)" value={formData.price} disabled={!editMode} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth label="Max Capacity" value={formData.maxSeats} disabled={!editMode} onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })} />
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Section: Curriculum & Benefits */}
            <Box>
              <Typography variant="overline" color="info.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Detailed Curriculum
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth multiline rows={4} label="Program Benefits (one per line)" value={formData.benefits} disabled={!editMode} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth multiline rows={4} label="Learning Modules (one per line)" value={formData.curriculum} disabled={!editMode} onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })} />
                </Grid>
              </Grid>
            </Box>

            {/* Section: Instructor */}
            <Box>
              <Typography variant="overline" color="warning.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Resource Person Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fffcf8", borderColor: "#fff1e1", borderRadius: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Instructor Full Name" value={formData.instructor.name} disabled={!editMode} onChange={(e) => setFormData({ ...formData, instructor: { ...formData.instructor, name: e.target.value } })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Professional Designation" value={formData.instructor.designation} disabled={!editMode} onChange={(e) => setFormData({ ...formData, instructor: { ...formData.instructor, designation: e.target.value } })} />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9", borderTop: "1px solid #eee" }}>
          {editMode ? (
            <Stack direction="row" spacing={2}>
              <Button onClick={() => setEditMode(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdate} disabled={saving} sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}>Done</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
};

export default SkillTrainingManagement;
