import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Avatar,
  Chip,
  IconButton,
  Typography,
  TextField,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  VisibilityOutlined,
  DeleteOutlined,
  BlockOutlined,
  CheckCircleOutline,
  DeleteSweepOutlined,
  RefreshOutlined,
  EditOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

const API = "http://localhost:5000/api/admin/candidates";

const AdminCandidates = () => {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);

  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  /* ================= FETCH ================= */

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: search || undefined,
        },
      });

      const data = res.data?.data || [];
      setTotalRows(res.data?.total || 0);

      setRows(
  data.map((c) => ({
    id: c._id,
    name: c.canname,
    email: c.canemail,
    mobile: c.canphone,

    // ✅ FIXED FIELD NAMES
    referrerName: c.referrerName || "N/A",
    referrerPhone: c.referrerPhone || "N/A",
    referredBy: c.referredBy || "N/A",

    verification: c.isVerified,
    createdAt: c.createdAt,
    status: c.isBlocked,
    avatar: c.profilePicture,
    raw: c,
  }))
);



    } catch (err) {
      alert("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, token]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  /* ================= ACTIONS ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate permanently?")) return;
    await axios.delete(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCandidates();
  };

  const handleBlockToggle = async (id, isBlocked) => {
  try {
    setActionLoading(id);

    const action = isBlocked ? "unblock" : "block";
    const endpoint = `${API}/${id}/${action}`;

    const res = await axios.patch(endpoint, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Action failed");
    }

    // 🔥 BEST PRACTICE → Refresh from server
    await fetchCandidates();

  } catch (err) {
     console.log("FULL ERROR:", err);
  console.log("STATUS:", err.response?.status);
  console.log("DATA:", err.response?.data);
  alert(err.response?.data?.message || "Action failed");
  } finally {
    setActionLoading(null);
  }
};


  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL candidates?")) return;
    await axios.delete(API, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCandidates();
  };

  /* ================= EDIT ================= */

  const openViewModal = (candidate) => {
    setSelected(candidate);
    setFormData(candidate);
    setEditMode(false);
    setOpenView(true);
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/${selected._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditMode(false);
      setOpenView(false);
      fetchCandidates();
    } catch {
      alert("Update failed");
    }
  };

  /* ================= COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1.2,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={row.avatar}>{row.name?.charAt(0)}</Avatar>
            <Typography fontWeight={600}>{row.name}</Typography>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "mobile", headerName: "Mobile", flex: 1 },

      // ✅ FIXED FIELDS
      { field: "referrerName", headerName: "Reference Name", flex: 1 },
      { field: "referrerPhone", headerName: "Reference Mobile Number", flex: 1 },
      { field: "referredBy", headerName: "Reference By", flex: 1 },

      {
        field: "verification",
        headerName: "Verification",
        flex: 1,
        renderCell: ({ value }) => (
          <Chip
            label={value ? "Verified" : "Not Verified"}
            color={value ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "Created Date",
        flex: 1.2,
        renderCell: ({ value }) =>
          value ? new Date(value).toLocaleString() : "N/A",
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1.5,
        sortable: false,
        renderCell: ({ row }) => {
          const isBlocked = row.status;
          const isLoading = actionLoading === row.id;

          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="View">
                <IconButton
                  color="primary"
                  onClick={() => openViewModal(row.raw)}
                >
                  <VisibilityOutlined />
                </IconButton>
              </Tooltip>

              <Tooltip title={isBlocked ? "Unblock User" : "Block User"}>
                <IconButton
                  color={isBlocked ? "success" : "warning"}
                  onClick={() => handleBlockToggle(row.id, isBlocked)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={18} />
                  ) : isBlocked ? (
                    <CheckCircleOutline />
                  ) : (
                    <BlockOutlined />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  onClick={() => handleDelete(row.id)}
                >
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [actionLoading]
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Candidate Management
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              startIcon={<RefreshOutlined />}
              onClick={fetchCandidates}
            >
              Refresh
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepOutlined />}
              onClick={handleDeleteAll}
            >
              Delete All
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box height="70vh">
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={totalRows}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Box>

      {/* VIEW + EDIT MODAL (UNCHANGED) */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Candidate Details
          {!editMode && (
            <IconButton
              sx={{ float: "right" }}
              onClick={() => setEditMode(true)}
            >
              <EditOutlined />
            </IconButton>
          )}
        </DialogTitle>

        <Divider />

        <DialogContent>
          {selected && (
            <Grid container spacing={2}>
              {[
                { label: "Name", field: "canname" },
                { label: "Email", field: "canemail" },
                { label: "Mobile", field: "canphone" },
                { label: "Reference Name", field: "referrerName" },
                { label: "Reference Mobile", field: "referrerPhone" },
                { label: "Reference By", field: "referredBy" },
              ].map((item) => (
                <Grid item xs={6} key={item.field}>
                  <TextField
                    fullWidth
                    label={item.label}
                    value={formData[item.field] || ""}
                    disabled={!editMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [item.field]: e.target.value,
                      })
                    }
                  />
                </Grid>
              ))}

              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVerified || false}
                      disabled={!editMode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isVerified: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Verified"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpenView(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCandidates;
