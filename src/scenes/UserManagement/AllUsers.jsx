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

// 🚀 CENTRALIZED SERVICE INJECTED
import adminCandidateService from "../../services/adminCandidateService";
import FiltersBar from "../dashboard/components/FiltersBar";

const AdminCandidates = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [dateFilters, setDateFilters] = useState({});

  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  /* ================= FETCH DATA (ALIGNED WITH BACKEND) ================= */

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminCandidateService.getAll({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: search || undefined,
        startDate: dateFilters.startDate || undefined,
        endDate: dateFilters.endDate || undefined,
      });

      // BACKEND FORMAT: { success: true, total: 100, page: 1, data: [...] }
      if (response.success) {
        setTotalRows(response.total || 0);
        setRows(
          (response.data || []).map((c) => ({
            id: c._id,
            name: c.canname || c.personal?.canname || c.name || "N/A",
            email: c.canemail || c.personal?.canemail || c.email || "N/A",
            mobile: c.canphone || c.personal?.canphone || c.mobile || "N/A",
            referrerName: c.referrerName || c.referrername || "N/A",
            referrerPhone: c.referrerPhone || c.referrerphone || "N/A",
            referredBy: c.referredBy || c.referredby || "N/A",
            verification: c.isVerified,
            createdAt: c.createdAt,
            status: c.isBlocked,
            avatar: c.profilePicture,
            raw: c,
          }))
        );
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      // alert(err); // Consider using a Snackbar instead
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, dateFilters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleFilterChange = (newDates) => {
    if (!newDates.startDate && !newDates.endDate) {
      setSearch("");
    }
    setDateFilters(newDates);
  };

  /* ================= CRUD ACTIONS (USING API SERVICE) ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Irreversible: Delete candidate permanently?")) return;
    try {
      await adminCandidateService.delete(id);
      fetchCandidates();
    } catch (err) {
      alert(err);
    }
  };

  const handleBlockToggle = async (id) => {
    try {
      setActionLoading(id);
      await adminCandidateService.toggleBlock(id);
      fetchCandidates();
    } catch (err) {
      alert(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("🔥 CRITICAL: Delete ALL candidates in DB?")) return;
    try {
      await adminCandidateService.deleteAll();
      fetchCandidates();
    } catch (err) {
      alert(err);
    }
  };

  const openViewModal = (candidate) => {
    setSelected(candidate);
    setFormData({ ...candidate });
    setEditMode(false);
    setOpenView(true);
  };

  /* ================= CLIENT-SIDE FILTER FALLBACK ================= */
  const filteredRows = useMemo(() => {
    if (!dateFilters.startDate && !dateFilters.endDate) return rows;

    return rows.filter((row) => {
      if (!row.createdAt) return false;
      // Convert backend date to YYYY-MM-DD for comparison
      const d = new Date(row.createdAt).toISOString().split("T")[0];

      if (dateFilters.startDate && dateFilters.endDate) {
        return d >= dateFilters.startDate && d <= dateFilters.endDate;
      } else if (dateFilters.startDate) {
        return d >= dateFilters.startDate;
      } else if (dateFilters.endDate) {
        return d <= dateFilters.endDate;
      }
      return true;
    });
  }, [rows, dateFilters]);

  const handleSaveEdit = async () => {
    try {
      await adminCandidateService.update(selected._id, formData);
      setEditMode(false);
      setOpenView(false);
      fetchCandidates();
    } catch (err) {
      alert(err);
    }
  };

  /* ================= DATAGRID COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Candidate Name",
        flex: 1.2,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={row.avatar} sx={{ width: 32, height: 32 }}>{row.name?.charAt(0)}</Avatar>
            <Typography fontSize="0.9rem" fontWeight={500}>{row.name}</Typography>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email Address", flex: 1 },
      { field: "mobile", headerName: "Mobile", flex: 0.8 },
      { field: "referrerName", headerName: "Referrer", flex: 0.8 },
      {
        field: "verification",
        headerName: "Verified",
        flex: 0.8,
        renderCell: ({ value }) => (
          <Chip
            variant="outlined"
            label={value ? "Verified" : "Pending"}
            color={value ? "success" : "warning"}
            size="small"
          />
        ),
      },
      {
        field: "status",
        headerName: "Account Status",
        flex: 0.8,
        renderCell: ({ value }) => (
          <Chip
            label={value ? "Blocked" : "Active"}
            color={value ? "error" : "primary"}
            size="small"
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "Joined Date",
        flex: 1,
        renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : "N/A",
      },
      {
        field: "actions",
        headerName: "Control Panel",
        flex: 1.2,
        sortable: false,
        renderCell: ({ row }) => {
          const isBlocked = row.status;
          const isLoading = actionLoading === row.id;

          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View Profile">
                <IconButton color="info" size="small" onClick={() => openViewModal(row.raw)}>
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={isBlocked ? "Re-activate Account" : "Suspend Account"}>
                <IconButton
                  color={isBlocked ? "success" : "warning"}
                  size="small"
                  onClick={() => handleBlockToggle(row.id)}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={16} /> : <BlockOutlined fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              <Tooltip title="Permanent Wipe">
                <IconButton color="error" size="small" onClick={() => handleDelete(row.id)}>
                  <DeleteOutlined fontSize="small" />
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
      <Typography variant="h5" fontWeight="900" mb={4} color="primary.main">
        👥 CANDIDATE MANAGEMENT
      </Typography>

      {/* 🚀 TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Name, Email, or Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ bgcolor: "" }}
            />
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={fetchCandidates}
              size="small"
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              disableElevation
              color="error"
              startIcon={<DeleteSweepOutlined />}
              onClick={handleDeleteAll}
              size="small"
            >
              Bulk Wipe
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box mb={3}>
        <FiltersBar onFilterChange={handleFilterChange} />
      </Box>

      {/* 📊 DATA TABLE */}
      <Box height="65vh">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          rowCount={totalRows}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[20]}
          hideFooterPagination
          sx={{
            "& .MuiDataGrid-columnHeaders": { bgcolor: "", borderRadius: 0 },
            "& .MuiDataGrid-footerContainer": { borderTop: "1px solid" }
          }}
        />
      </Box>

      {/* 🖊️ REVAMPED MODAL DIALOG */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          px: 3,
          py: 2
        }}>
          <Typography variant="h6" fontWeight={800}>
            {editMode ? "✍️ EDIT CANDIDATE DETAILS" : "👤 CANDIDATE FULL PROFILE"}
          </Typography>
          {!editMode && (
            <IconButton
              sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              onClick={() => setEditMode(true)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: "#fafafa" }}>
          <Stack spacing={4}>
            {/* 👤 TOP SECTION: AVATAR & PRIMARY INFO */}
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
              <Avatar
                src={formData.profilePicture}
                sx={{ width: 100, height: 100, mb: 2, boxShadow: 4, border: "4px solid #fff" }}
              >
                {formData.canname?.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={900} color="primary.dark">
                {formData.canname || "N/A"}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                {formData.canemail}
              </Typography>

              <Stack direction="row" spacing={1.5} mt={2.5} justifyContent="center">
                <Chip
                  label={formData.isBlocked ? "SUSPENDED" : "ACTIVE"}
                  color={formData.isBlocked ? "error" : "success"}
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 24 }}
                />
                <Chip
                  label={formData.isVerified ? "VERIFIED" : "UNVERIFIED"}
                  variant="outlined"
                  color={formData.isVerified ? "success" : "warning"}
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 24 }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* 📋 SECTIONS: VERTICAL STACK */}
            <Stack spacing={5}>
              {/* --- Section: General Details --- */}
              <Box>
                <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2.5 }}>
                  General Information
                </Typography>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    size="small"
                    value={formData.canname || ""}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, canname: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    variant="outlined"
                    size="small"
                    value={formData.canphone || ""}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, canphone: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    size="small"
                    value={formData.canemail || ""}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, canemail: e.target.value })}
                  />
                </Stack>
              </Box>

              {/* --- Section: Referral Details --- */}
              <Box>
                <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2.5 }}>
                  Referral & Source
                </Typography>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Referred By"
                    variant="outlined"
                    size="small"
                    value={formData.referredBy || "Direct Registry"}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Referrer Name"
                    variant="outlined"
                    size="small"
                    value={formData.referrerName || "N/A"}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Referrer Phone"
                    variant="outlined"
                    size="small"
                    value={formData.referrerPhone || "N/A"}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, referrerPhone: e.target.value })}
                  />
                </Stack>
              </Box>

              {/* --- Section: Account Governance (Only in Edit Mode) --- */}
              {editMode && (
                <Box>
                  <Typography variant="overline" color="error" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                    Account Governance
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fffafd", borderColor: "#ffeef2", borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isVerified || false}
                            onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                            color="success"
                          />
                        }
                        label={<Typography variant="body2" fontWeight={800}>IDENTITY VERIFICATION STATUS</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isBlocked || false}
                            onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                            color="error"
                          />
                        }
                        label={<Typography variant="body2" fontWeight={800}>ACCOUNT BLOCK STATUS</Typography>}
                      />
                    </Stack>
                  </Paper>
                </Box>
              )}
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9", borderTop: "1px solid #eee" }}>
          {editMode ? (
            <>
              <Button
                onClick={() => setEditMode(false)}
                sx={{ fontWeight: 700, px: 3 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={handleSaveEdit}
                sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => setOpenView(false)}
              sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
            >
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCandidates;