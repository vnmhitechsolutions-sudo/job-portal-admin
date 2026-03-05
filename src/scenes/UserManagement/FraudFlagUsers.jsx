import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  TextField,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  VisibilityOutlined,
  BlockOutlined,
  CheckCircleOutline,
  FlagOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

const FraudFlags = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dateFilters, setDateFilters] = useState({});

  /* ===============================
     FETCH FRAUD FLAGGED USERS
  =============================== */
  const fetchFraudUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/candidates/fraud-flagged", {
        params: {
          search: search || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });

      const list = res.data || [];

      const mapped = list.map((u) => ({
        id: u._id,
        name: u.canname,
        email: u.canemail,
        role: "candidate",
        isFlagged: Boolean(u.isFlagged),
        isBlocked: Boolean(u.isBlocked),
        createdAt: u.createdAt,
        raw: u, // full object for modal
      }));

      setUsers(mapped);
    } catch (err) {
      console.error("Fetch fraud users error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFilters]);

  useEffect(() => {
    fetchFraudUsers();
  }, [fetchFraudUsers]);

  const handleFilterChange = (newDates) => {
    if (!newDates.startDate && !newDates.endDate) {
      setSearch("");
    }
    setDateFilters(newDates);
  };

  /* ===============================
     CLIENT-SIDE FILTER FALLBACK
  =============================== */
  const filteredUsers = useMemo(() => {
    let result = users;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (dateFilters.startDate || dateFilters.endDate) {
      result = result.filter((u) => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt).toISOString().split("T")[0];

        if (dateFilters.startDate && dateFilters.endDate) {
          return d >= dateFilters.startDate && d <= dateFilters.endDate;
        } else if (dateFilters.startDate) {
          return d >= dateFilters.startDate;
        } else if (dateFilters.endDate) {
          return d <= dateFilters.endDate;
        }
        return true;
      });
    }
    return result;
  }, [users, dateFilters, search]);

  /* ===============================
     BLOCK USER
  =============================== */
  const handleBlock = async (id) => {
    if (!window.confirm("Block this user?")) return;

    try {
      await apiClient.patch(`/admin/candidates/${id}/block`);
      fetchFraudUsers();
    } catch (err) {
      console.error("Block error:", err);
    }
  };

  /* ===============================
     UNFLAG USER
  =============================== */
  const handleUnflag = async (id) => {
    if (!window.confirm("Remove fraud flag from this user?")) return;

    try {
      await apiClient.patch(`/admin/candidates/${id}/unflag-fraud`);
      fetchFraudUsers();
    } catch (err) {
      console.error("Unflag error:", err);
    }
  };

  /* ===============================
     VIEW USER
  =============================== */
  const handleView = (user) => {
    setSelectedUser(user.raw);
    setViewOpen(true);
  };

  /* ===============================
     TABLE COLUMNS
  =============================== */
  const columns = useMemo(() => [
    {
      field: "name",
      headerName: "Candidate",
      flex: 1.2,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 32, height: 32 }}>{row.name?.charAt(0)}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.6,
      renderCell: ({ value }) => <Chip size="small" label={value} color="info" />,
    },
    {
      field: "fraud",
      headerName: "Fraud",
      flex: 0.8,
      renderCell: ({ row }) =>
        row.isFlagged ? (
          <Chip size="small" label="Flagged" color="warning" icon={<FlagOutlined />} />
        ) : (
          <Chip size="small" label="Clean" variant="outlined" />
        ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: ({ row }) => (
        <Chip size="small" label={row.isBlocked ? "Blocked" : "Active"} color={row.isBlocked ? "error" : "success"} />
      ),
    },
    {
      field: "createdAt",
      headerName: "Joined Date",
      flex: 1.2,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : "N/A",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.3,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <IconButton color="primary" onClick={() => handleView(row)}><VisibilityOutlined /></IconButton>
          {!row.isBlocked && <IconButton color="warning" onClick={() => handleBlock(row.id)}><BlockOutlined /></IconButton>}
          {row.isFlagged && <IconButton color="success" onClick={() => handleUnflag(row.id)}><CheckCircleOutline /></IconButton>}
        </Box>
      ),
    },
  ], []);

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>Fraud Flagged Users</Typography>
        <Button variant="outlined">Export Users</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Search"
            sx={{ width: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<RefreshOutlined />}
            onClick={fetchFraudUsers}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      <Box mb={2}>
        <FiltersBar onFilterChange={handleFilterChange} />
      </Box>

      <Box height="65vh">
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          pageSize={20}
          disableRowSelectionOnClick
          hideFooterPagination
        />
      </Box>

      {/* VIEW USER */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>User Details</DialogTitle>
        <Divider />
        {selectedUser && (
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 56, height: 56 }}>{selectedUser.name?.charAt(0)}</Avatar>
                <Box>
                  <Typography fontWeight={600}>{selectedUser.name}</Typography>
                  <Typography color="text.secondary">{selectedUser.email}</Typography>
                </Box>
              </Stack>
              <Divider />
              <Typography><strong>Role:</strong> {selectedUser.role?.name || selectedUser.role?.key}</Typography>
              <Typography><strong>Status:</strong> {!selectedUser.isBlocked ? "Active" : "Blocked"}</Typography>
              <Typography><strong>Fraud Flagged:</strong> {selectedUser.isFlagged ? "Yes" : "No"}</Typography>
              <Typography><strong>Joined On:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FraudFlags;
