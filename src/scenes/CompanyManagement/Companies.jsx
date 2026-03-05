import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "state/instant";
import {
  Box,
  Paper,
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
  MenuItem,
  CircularProgress,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  VisibilityOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined as UnhideIcon,
  RefreshOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FiltersBar from "../dashboard/components/FiltersBar";

/* =========================
   STATUS CHIP
========================= */
const StatusChip = ({ status }) => {
  const map = {
    UPCOMING: "info",
    COMPLETED: "success",
    CANCELLED: "warning",
    BLOCKED: "error",
  };

  return (
    <Chip
      size="small"
      label={status || "UNKNOWN"}
      color={map[status] || "default"}
    />
  );
};

const AdminMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});
  const [viewMeeting, setViewMeeting] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  /* ================= FETCH ================= */
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/meetings", {
        params: {
          search: search || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });
      const data = (res.data?.data || []).map(m => ({
        ...m,
        id: m._id,
        employerName: m.employer?.empname || m.employer?.name || "N/A",
        employerEmail: m.employer?.empemail || m.employer?.email || "N/A",
      }));
      setMeetings(data);
    } catch (err) {
      console.error("Meeting fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFilters]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleFilterChange = (newDates) => {
    setDateFilters(newDates);
  };

  const openView = (row) => {
    setViewMeeting(row);
    setFormData(row);
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // We use the generic update endpoint if it exists, or specific status update
      await axios.put(`/admin/meetings/${viewMeeting._id}`, formData);
      fetchMeetings();
      setEditMode(false);
      setViewMeeting(null);
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (id) => {
    try {
      await axios.patch(`/admin/meetings/${id}/toggle-visibility`);
      fetchMeetings();
    } catch {
      alert("Toggle failed");
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm("Delete this meeting permanently?")) return;
    try {
      await axios.delete(`/admin/meetings/${id}`);
      fetchMeetings();
    } catch {
      alert("Delete failed");
    }
  };

  const filteredMeetings = useMemo(() => {
    let result = meetings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.companyName?.toLowerCase().includes(q) ||
        m.employerName?.toLowerCase().includes(q) ||
        m.topic?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [meetings, search]);

  /* ================= TABLE COLUMNS ================= */
  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "MEETING TITLE",
        flex: 1.5,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src={row.companyLogo || "https://via.placeholder.com/40"}
              sx={{ width: 35, height: 35, borderRadius: "8px", objectFit: "cover", bgcolor: "#f0f0f0" }}
            />
            <Typography fontWeight={600} fontSize="0.85rem">{row.title}</Typography>
          </Box>
        )
      },
      { field: "companyName", headerName: "COMPANY", flex: 1.2 },
      { field: "topic", headerName: "TOPIC", flex: 1.2 },
      { field: "employerName", headerName: "EMPLOYER", flex: 1.2 },
      { field: "date", headerName: "DATE", flex: 0.8 },
      { field: "time", headerName: "TIME", flex: 0.7 },
      {
        field: "status",
        headerName: "STATUS",
        flex: 1,
        renderCell: ({ value }) => <StatusChip status={value} />,
      },
      {
        field: "actions",
        headerName: "ACTIONS",
        flex: 1,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View Details">
              <IconButton size="small" color="primary" onClick={() => openView(row)} sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}>
                <VisibilityOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => deleteMeeting(row._id)} sx={{ bgcolor: "rgba(211, 47, 47, 0.08)" }}>
                <DeleteOutlined fontSize="small" />
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
      {/* --- Header Section --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
            🤝 VIRTUAL MEETINGS
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Manage employer-hosted meetings, webinars and placement talks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshOutlined />}
          onClick={fetchMeetings}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3, boxShadow: 3 }}
        >
          REFRESH
        </Button>
      </Box>

      {/* --- Filter Bar --- */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #eef2f6", display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Search by Title, Company, or Employer..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
        <FiltersBar onFilterChange={handleFilterChange} />
      </Paper>

      {/* --- Data Table --- */}
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <Box height="70vh">
          <DataGrid
            rows={filteredMeetings}
            loading={loading}
            columns={columns}
            getRowId={(row) => row._id}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "text.secondary", fontWeight: 700, borderBottom: "1px solid #eef2f6" },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f8faff" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fbfcfe" },
            }}
          />
        </Box>
      </Paper>

      {/* --- View/Edit Modal --- */}
      <Dialog
        open={!!viewMeeting}
        onClose={() => setViewMeeting(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          component="div"
          sx={{
            bgcolor: "primary.main",
            color: "white",
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            {editMode ? "✍️ EDIT MEETING" : "📅 MEETING DETAILS"}
          </Typography>
          {!editMode && (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: "#f0f0f0" },
                fontWeight: 700,
                borderRadius: 2,
              }}
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
                General Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Meeting Title" value={formData.title || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Topic / Abstract" value={formData.topic || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Name" value={formData.companyName || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Logo URL" value={formData.companyLogo || ""} disabled={!editMode} onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })} />
                </Grid>
              </Grid>
            </Box>

            {/* Section: Employer Info */}
            <Box>
              <Typography variant="overline" color="secondary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Host Information
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fcfdff", borderRadius: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Employer Name" value={formData.employerName || ""} disabled />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Employer Email" value={formData.employerEmail || ""} disabled />
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Section: Logistics */}
            <Box>
              <Typography variant="overline" color="success.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                Logistics & Schedule
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="date" label="Meeting Date" value={formData.date || ""} disabled={!editMode} InputLabelProps={{ shrink: true }} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="time" label="Start Time" value={formData.time || ""} disabled={!editMode} InputLabelProps={{ shrink: true }} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Meeting Status" select value={formData.status || "UPCOMING"} disabled={!editMode} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <MenuItem value="UPCOMING">Upcoming</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="BLOCKED">Blocked</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Meeting Link (URL)" value={formData.link || ""} color="primary" disabled={!editMode} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
                  {formData.link && !editMode && (
                    <Button
                      href={formData.link}
                      target="_blank"
                      size="small"
                      sx={{ mt: 1, fontWeight: 700 }}
                      startIcon={<VisibilityOutlined />}
                    >
                      Join Meeting
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Section: Admin Controls (Only if Blocked) */}
            {(formData.status === "BLOCKED" || editMode) && (
              <Box>
                <Typography variant="overline" color="error" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                  Admin Governance
                </Typography>
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fffafd", borderColor: "#ffeef2", borderRadius: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Blocking Reason / Internal Note"
                    value={formData.blockedReason || ""}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })}
                  />
                  {!editMode && formData.blockedBy && (
                    <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.secondary", fontWeight: 600 }}>
                      Logged by: {formData.blockedBy?.name || "System Admin"}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9", borderTop: "1px solid #eee" }}>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setViewMeeting(null)} sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}>Done</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMeetings;
