import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "state/instant";
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
  Divider,
  TextField,
  Paper,
  Grid,
  Tooltip,
  MenuItem,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  SaveOutlined,
  ToggleOn,
  ToggleOff,
  RefreshOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FiltersBar from "../dashboard/components/FiltersBar";

const LEVELS = ["Basic", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Tamil", "Hindi"];

const AdminTutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});
  const [viewTutorial, setViewTutorial] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  /* ================= FETCH ================= */
  const fetchTutorials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/tutorials", {
        params: {
          search: search || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });
      setTutorials(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFilters]);

  useEffect(() => {
    fetchTutorials();
  }, [fetchTutorials]);

  const processedTutorials = useMemo(() => {
    let result = tutorials.map((tut) => ({
      ...tut,
      id: tut._id,
      level: tut.level || "Beginner", // Use the actual data from the database
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title?.toLowerCase().includes(q) || t.foss?.toLowerCase().includes(q));
    }

    return result;
  }, [tutorials, search]);

  const openView = (tutorial) => {
    setViewTutorial(tutorial);
    setFormData(tutorial);
    setEditMode(false);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await axios.put(`/admin/tutorials/${viewTutorial._id}`, formData);
      fetchTutorials();
      setEditMode(false);
      setViewTutorial(null);
    } catch (err) {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await axios.patch(`/admin/tutorials/${id}/toggle`);
      setTutorials(prev => prev.map(t => t._id === id ? { ...t, isActive: !t.isActive } : t));
    } catch {
      alert("Toggle failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tutorial? This action cannot be undone.")) return;
    try {
      await axios.delete(`/admin/tutorials/${id}`);
      setTutorials(prev => prev.filter(t => t._id !== id));
      alert("Tutorial deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const columns = useMemo(() => [
    {
      field: "title",
      headerName: "TUTORIAL TITLE",
      flex: 2,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 8, height: 35, borderRadius: 1, bgcolor: row.isActive ? "success.main" : "warning.main" }} />
          <Stack>
            <Typography variant="body2" fontWeight={700}>{row.title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>{row.outline}</Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      field: "foss",
      headerName: "FOSS CATEGORY",
      flex: 1,
      renderCell: ({ value }) => <Chip size="small" label={value || "—"} color="primary" sx={{ fontWeight: 600, borderRadius: "6px" }} />,
    },
    { field: "level", headerName: "LEVEL", flex: 0.8 },
    {
      field: "isActive",
      headerName: "STATUS",
      flex: 0.7,
      renderCell: ({ row }) => (
        <Chip
          label={row.isActive ? "ACTIVE" : "INACTIVE"}
          size="small"
          color={row.isActive ? "success" : "default"}
          onClick={() => toggleActive(row._id)}
          sx={{ fontWeight: 700, cursor: "pointer" }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => openView(row)} sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(row._id)} sx={{ bgcolor: "rgba(211, 47, 47, 0.08)" }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], []);

  return (
    <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
      {/* --- Header --- */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
          🎥 TUTORIALS MANAGEMENT
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Organize and manage video tutorials, FOSS categories, and technical resources
        </Typography>
      </Box>

      {/* 🚀 TOOLBAR (Matching Candidate User Page) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Title, FOSS, or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={fetchTutorials}
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

      {/* --- Grid --- */}
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <Box height="70vh">
          <DataGrid
            rows={processedTutorials}
            columns={columns}
            loading={loading}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "text.secondary", fontWeight: 700 },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f8faff" },
            }}
          />
        </Box>
      </Paper>

      {/* --- View/Edit Dialog --- */}
      <Dialog
        open={!!viewTutorial}
        onClose={() => setViewTutorial(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle component="div" sx={{ bgcolor: "primary.main", color: "white", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={800}>
            {editMode ? "✍️ EDIT TUTORIAL" : "🔍 TUTORIAL DETAILS"}
          </Typography>
          {!editMode && (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              sx={{ bgcolor: "white", color: "primary.main", fontWeight: 700, borderRadius: 2 }}
            >
              Edit
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4} mt={1}>
            <Box>
              <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, mb: 2, display: "block" }}>Tutorial Info</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Tutorial Title" value={formData.title || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Program Outline" value={formData.outline || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, outline: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="FOSS Category" value={formData.foss || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, foss: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Video Resource URL" value={formData.videoUrl || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Primary Language" value={formData.language || "English"} disabled={!editMode} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                    {LANGUAGES.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Difficulty Level" value={formData.level || "Basic"} disabled={!editMode} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                    {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={6} label="Full Transcript / Notes" value={formData.transcript || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, transcript: e.target.value })} />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9" }}>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdate} disabled={saving}>Save Changes</Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setViewTutorial(null)}>Done</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTutorials;
