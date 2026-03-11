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
    CircularProgress,
    Divider,
    Grid,
} from "@mui/material";
import {
    VisibilityOutlined,
    EditOutlined,
    DeleteOutline,
    CloseOutlined,
    SaveOutlined,
    CalendarTodayOutlined,
    LinkOutlined,
    AccessTimeOutlined,
    AssignmentOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

const Meetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [dateFilters, setDateFilters] = useState({});

    const [viewOpen, setViewOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [formData, setFormData] = useState({
        topic: "",
        meetingTime: "",
        meetingLink: "",
        status: "Scheduled",
    });
    const [saving, setSaving] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    /* ================= FETCH MEETINGS ================= */
    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await apiClient.get("/admin/meetings", {
                params: {
                    startDate: dateFilters.startDate,
                    endDate: dateFilters.endDate,
                },
            });
            // Standardizing response mapping based on common project structure
            const data = res.data || (Array.isArray(res) ? res : []);
            setMeetings(data);
        } catch (err) {
            setError("Failed to load meetings");
            setSnackbar({
                open: true,
                message: err || "Failed to fetch meetings",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [dateFilters]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    /* ================= VIEW / EDIT HANDLERS ================= */
    const handleOpenView = (meeting) => {
        setSelectedMeeting(meeting);
        setFormData({
            topic: meeting.topic || "",
            meetingTime: meeting.meetingTime || "",
            meetingLink: meeting.meetingLink || "",
            status: meeting.status || "Scheduled",
        });
        setEditMode(false);
        setViewOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedMeeting) return;
        try {
            setSaving(true);
            await apiClient.put(`/admin/meetings/${selectedMeeting._id}`, formData);

            setSnackbar({
                open: true,
                message: "Meeting updated successfully",
                severity: "success",
            });
            setViewOpen(false);
            fetchMeetings();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err || "Update failed",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this meeting?")) return;
        try {
            setLoading(true);
            await apiClient.delete(`/admin/meetings/${id}`);
            setSnackbar({
                open: true,
                message: "Meeting deleted successfully",
                severity: "success",
            });
            fetchMeetings();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err || "Delete failed",
                severity: "error",
            });
            setLoading(false);
        }
    };

    /* ================= FILTER LOGIC ================= */
    const filteredMeetings = useMemo(() => {
        let result = meetings;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                (m.topic && m.topic.toLowerCase().includes(q)) ||
                (m.candidateId?.canname && m.candidateId.canname.toLowerCase().includes(q))
            );
        }
        return result;
    }, [meetings, search]);

    /* ================= COLUMNS ================= */
    const columns = useMemo(() => [
        {
            field: "topic",
            headerName: "Topic",
            flex: 1.5,
            renderCell: ({ row }) => (
                <Stack>
                    <Typography fontWeight={700} color="primary.main">{row.topic}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {row._id.slice(-6).toUpperCase()}</Typography>
                </Stack>
            )
        },
        {
            field: "candidate",
            headerName: "Candidate",
            flex: 1.2,
            renderCell: ({ row }) => row.candidateId?.canname || "N/A"
        },
        {
            field: "meetingTime",
            headerName: "Schedule",
            flex: 1.2,
            renderCell: ({ value }) => value ? new Date(value).toLocaleString() : "TBD"
        },
        {
            field: "status",
            headerName: "Status",
            flex: 1,
            renderCell: ({ value }) => (
                <Chip
                    label={value}
                    size="small"
                    color={value === "Completed" ? "success" : value === "Cancelled" ? "error" : "primary"}
                    sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                />
            )
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                        <IconButton color="primary" onClick={() => handleOpenView(row)}>
                            <VisibilityOutlined />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDelete(row._id)}>
                            <DeleteOutline />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ], [fetchMeetings]);

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight={800} mb={3}>
                Meeting Management
            </Typography>

            <Box mb={3}>
                <FiltersBar onFilterChange={setDateFilters} />
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Search by Topic or Candidate"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box height="70vh">
                <DataGrid
                    rows={filteredMeetings}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[20]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 20 } },
                    }}
                    disableRowSelectionOnClick
                />
            </Box>

            {/* VIEW / EDIT DIALOG */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ bgcolor: "primary.main", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontWeight={900}>
                        {editMode ? "✍️ EDIT MEETING" : "📅 MEETING DETAILS"}
                    </Typography>
                    {!editMode && (
                        <IconButton sx={{ color: "white" }} onClick={() => setEditMode(true)}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    )}
                </DialogTitle>

                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Topic"
                                value={formData.topic}
                                disabled={!editMode}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                InputProps={{ startAdornment: <AssignmentOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Status"
                                select
                                value={formData.status}
                                disabled={!editMode}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <MenuItem value="Scheduled">Scheduled</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Meeting Time"
                                type="datetime-local"
                                value={formData.meetingTime ? formData.meetingTime.slice(0, 16) : ""}
                                disabled={!editMode}
                                onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <AccessTimeOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Meeting Link"
                                value={formData.meetingLink}
                                disabled={!editMode}
                                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                InputProps={{
                                    startAdornment: <LinkOutlined sx={{ mr: 1, color: "primary.main" }} />,
                                    endAdornment: !editMode && formData.meetingLink && (
                                        <Button size="small" href={formData.meetingLink} target="_blank">Join</Button>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    {editMode ? (
                        <Stack direction="row" spacing={2}>
                            <Button onClick={() => setEditMode(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                startIcon={<SaveOutlined />}
                                onClick={handleUpdate}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </Stack>
                    ) : (
                        <Button variant="contained" onClick={() => setViewOpen(false)}>Close</Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Meetings;
