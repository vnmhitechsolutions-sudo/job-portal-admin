import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Divider,
  Avatar,
  Stack,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  VisibilityOutlined,
  EditOutlined,
  CloseOutlined,
  BlockOutlined,
  CheckCircleOutline,
  AddOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import apiClient from "../../api/apiClient";

import FiltersBar from "../dashboard/components/FiltersBar";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const roleOptions = ["SUPER_ADMIN", "ADMIN"];

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});

  const [openView, setOpenView] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN",
    isActive: true,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentRole = localStorage.getItem("role");

  /* ================= FETCH ADMINS ================= */

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users");

      const rows = (res.data || (Array.isArray(res) ? res : [])).map((admin) => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role?.name || admin.role,
        status: admin.isActive ? "Active" : "Inactive",
        createdAt: admin.createdAt, // Store raw for filtering
        formattedDate: new Date(admin.createdAt).toLocaleString(),
      }));

      setAdmins(rows);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to fetch admins",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ================= CREATE ADMIN ================= */

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      return setSnackbar({
        open: true,
        message: "All fields are required",
        severity: "warning",
      });
    }

    if (form.password !== form.confirmPassword) {
      return setSnackbar({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
    }

    try {
      await apiClient.post("/admin/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
      });

      setSnackbar({
        open: true,
        message: "Admin created successfully",
        severity: "success",
      });

      setOpenCreate(false);
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "ADMIN",
        isActive: true,
      });

      fetchAdmins();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Create failed",
        severity: "error",
      });
    }
  };

  /* ================= UPDATE ADMIN ================= */
  const handleOpenEdit = (adminRow) => {
    setSelectedAdmin(adminRow);
    setForm({
      name: adminRow.name,
      email: adminRow.email,
      password: "", // Left blank unless they want to reset it
      confirmPassword: "",
      role: adminRow.role === "Super Admin" || adminRow.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      isActive: adminRow.status === "Active",
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!form.name || !form.email) {
      return setSnackbar({
        open: true,
        message: "Name and Email are required",
        severity: "warning",
      });
    }

    if (form.password && form.password !== form.confirmPassword) {
      return setSnackbar({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
      };
      // Only include password if the user entered a new one
      if (form.password) {
        payload.password = form.password;
      }

      await apiClient.put(`/admin/users/${selectedAdmin.id}`, payload);

      setSnackbar({
        open: true,
        message: "Admin updated successfully",
        severity: "success",
      });

      setOpenEdit(false);
      fetchAdmins();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Update failed",
        severity: "error",
      });
      setLoading(false);
    }
  };

  /* ================= DELETE ADMIN ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this admin?")) return;
    try {
      setLoading(true);
      await apiClient.delete(`/admin/users/${id}`);
      setSnackbar({
        open: true,
        message: "Admin removed successfully",
        severity: "success"
      });
      fetchAdmins();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Delete failed",
        severity: "error"
      });
      setLoading(false);
    }
  };

  /* ================= TOGGLE STATUS ================= */
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? false : true;
      await apiClient.patch(`/admin/users/${id}`, { isActive: newStatus });
      fetchAdmins();
      setSnackbar({
        open: true,
        message: `Admin status changed to ${newStatus ? 'Active' : 'Inactive'}`,
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Status update failed",
        severity: "error"
      });
    }
  };

  /* ================= CLIENT-SIDE FILTER ================= */
  const filteredAdmins = useMemo(() => {
    let result = admins;

    // Search Filter
    if (search) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Date Filter Fallback
    if (dateFilters.startDate || dateFilters.endDate) {
      result = result.filter((a) => {
        if (!a.createdAt) return false;
        const d = new Date(a.createdAt).toISOString().split("T")[0];
        if (dateFilters.startDate && dateFilters.endDate)
          return d >= dateFilters.startDate && d <= dateFilters.endDate;
        if (dateFilters.startDate) return d >= dateFilters.startDate;
        if (dateFilters.endDate) return d <= dateFilters.endDate;
        return true;
      });
    }

    return result;
  }, [admins, search, dateFilters]);

  /* ================= COLUMNS ================= */

  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.2 },
    {
      field: "role",
      headerName: "Role",
      flex: 0.7,
      renderCell: (params) => (
        <Chip label={params.value} size="small" />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Active" ? "success" : "warning"}
        />
      ),
    },
    { field: "formattedDate", headerName: "Created", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={() => {
              setSelectedAdmin(params.row);
              setOpenView(true);
            }}
          >
            <VisibilityOutlined />
          </IconButton>
          <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
            <EditOutlined />
          </IconButton>
          <IconButton
            onClick={() => handleToggleStatus(params.row.id, params.row.status)}
            color={
              params.row.status === "Active"
                ? "warning"
                : "success"
            }
          >
            {params.row.status === "Active" ? (
              <BlockOutlined />
            ) : (
              <CheckCircleOutline />
            )}
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteOutline />
          </IconButton>
        </Stack>
      ),
    },
  ];

  /* ================= UI ================= */

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h4">
          Admin Management
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setOpenCreate(true)}
        >
          Create Admin
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Search by name"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      <Box mb={2}>
        <FiltersBar onFilterChange={setDateFilters} />
      </Box>

      <Box height="70vh">
        <DataGrid
          rows={filteredAdmins}
          columns={columns}
          loading={loading}
          pageSize={20}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          hideFooterPagination
        />
      </Box>

      {/* ================= CREATE DIALOG ================= */}
      <Dialog
        open={openCreate}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
        onClose={() => setOpenCreate(false)}
      >
        <DialogTitle>Create New Admin</DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              fullWidth
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword: e.target.value,
                })
              }
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={form.isActive ? "Active" : "Inactive"}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.value === "Active",
                })
              }
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog
        open={openEdit}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
        onClose={() => setOpenEdit(false)}
      >
        <DialogTitle>Edit Admin</DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              fullWidth
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <TextField
              label="New Password (Optional)"
              type="password"
              fullWidth
              placeholder="Leave blank to keep current password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword: e.target.value,
                })
              }
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={form.isActive ? "Active" : "Inactive"}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.value === "Active",
                })
              }
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEdit(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdate}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= VIEW DIALOG ================= */}
      <Dialog
        open={openView}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
        onClose={() => setOpenView(false)}
      >
        <DialogTitle>Admin Details</DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          {selectedAdmin && (
            <Stack spacing={2} alignItems="center">
              <Avatar sx={{ width: 80, height: 80 }}>
                {selectedAdmin.name.charAt(0)}
              </Avatar>
              <Typography variant="h6">
                {selectedAdmin.name}
              </Typography>
              <Typography color="text.secondary">
                {selectedAdmin.email}
              </Typography>
              <Chip label={selectedAdmin.role} />
              <Chip
                label={selectedAdmin.status}
                color={
                  selectedAdmin.status === "Active"
                    ? "success"
                    : "warning"
                }
              />
              <Typography variant="body2">
                Created At: {selectedAdmin.createdAt}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= SNACKBAR ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Admins;