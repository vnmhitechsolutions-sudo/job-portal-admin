import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
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
  CircularProgress,
  Select,
  MenuItem,
  Alert,
  TextField,
  Avatar,
  Divider,
  Grid,
  Paper,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import {
  VisibilityOutlined,
  RefreshOutlined,
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
  ExpandMore as ExpandMoreIcon,
  BusinessOutlined,
  BadgeOutlined,
  DescriptionOutlined,
  VerifiedOutlined,
  EmailOutlined,
  PhoneOutlined,
  HomeOutlined,
  LinkOutlined,
  AccountBalanceOutlined,
  GroupsOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

/* ===============================
   STATUS CHIP
================================ */
const StatusChip = ({ verified }) => (
  <Chip
    size="small"
    label={verified ? "Verified" : "Pending"}
    color={verified ? "success" : "warning"}
  />
);

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewCompany, setViewCompany] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilters, setDateFilters] = useState({});
  const [search, setSearch] = useState("");

  /* ===============================
     FETCH
  ================================= */
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiClient.get("/admin/companies", {
        params: {
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });

      // Based on Step 1340, apiClient has response interceptor that returns data.
      // So 'res' is the JSON object from the server.
      if (res && res.data) {
        setCompanies(res.data);
      } else if (Array.isArray(res)) {
        setCompanies(res);
      }
    } catch (err) {
      setError(err?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [dateFilters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ===============================
     FILTER
  ================================= */
  const handleFilterChange = (newDates) => {
    if (!newDates.startDate && !newDates.endDate) {
      setSearch("");
      setStatusFilter("");
    }
    setDateFilters(newDates);
  };

  const filteredCompanies = useMemo(() => {
    let result = companies;

    // Status Filter
    if (statusFilter === "Verified")
      result = result.filter((c) => c.empisVer === true);
    else if (statusFilter === "Pending")
      result = result.filter((c) => !c.empisVer);

    // Search Filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.empcomNam && c.empcomNam.toLowerCase().includes(q)) ||
          (c.empindTyp && c.empindTyp.toLowerCase().includes(q)) ||
          (c.empstate && c.empstate.toLowerCase().includes(q)) ||
          (c.empdist && c.empdist.toLowerCase().includes(q))
      );
    }

    // Date Filter Fallback
    if (dateFilters.startDate || dateFilters.endDate) {
      result = result.filter((c) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt).toISOString().split("T")[0];
        if (dateFilters.startDate && dateFilters.endDate)
          return d >= dateFilters.startDate && d <= dateFilters.endDate;
        if (dateFilters.startDate) return d >= dateFilters.startDate;
        if (dateFilters.endDate) return d <= dateFilters.endDate;
        return true;
      });
    }

    return result;
  }, [companies, statusFilter, search, dateFilters]);

  /* ===============================
     OPEN VIEW
  ================================= */
  const openView = useCallback((company) => {
    setViewCompany(company);
    setFormData(company);
    setEditMode(false);
  }, []);

  /* ===============================
     SAVE UPDATE
  ================================= */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      await apiClient.put(`/admin/companies/${viewCompany._id}`, formData);

      setEditMode(false);
      fetchCompanies();
    } catch (err) {
      alert(err || "Update failed");
    } finally {
      setSaving(false);
    }
  }, [viewCompany, formData, fetchCompanies]);

  /* ===============================
     TABLE COLUMNS
  ================================= */
  const columns = useMemo(() => [
    { field: "empcomNam", headerName: "Company Name", flex: 2 },
    { field: "empindTyp", headerName: "Industry", flex: 1.2 },
    { field: "empstate", headerName: "State", flex: 1 },
    { field: "empdist", headerName: "District", flex: 1 },
    { field: "empstf", headerName: "Employees", flex: 1 },
    {
      field: "empisVer",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row }) => (
        <StatusChip verified={row.empisVer} />
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
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="View Details">
          <IconButton
            color="primary"
            onClick={() => openView(row)}
          >
            <VisibilityOutlined />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [openView]);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Company Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box mb={3}>
        <FiltersBar onFilterChange={handleFilterChange} />
      </Box>

      {/* FILTER BAR */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Verified">Verified</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              startIcon={<RefreshOutlined />}
              onClick={fetchCompanies}
              sx={{ textTransform: "uppercase" }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLE */}
      <Box height="70vh">
        <DataGrid
          rows={filteredCompanies}
          loading={loading}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[20]}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          disableRowSelectionOnClick
          hideFooterPagination
        />
      </Box>

      {/* VIEW / EDIT DIALOG */}
      {viewCompany && (
        <Dialog
          open
          onClose={() => setViewCompany(null)}
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
              {editMode ? "✍️ EDIT COMPANY PROFILE" : "🏢 COMPANY FULL PROFILE"}
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

          <DialogContent sx={{ p: 0, bgcolor: "#fafafa" }}>
            {/* 🏢 TOP HEADER: COMPANY LOGO & STATUS */}
            <Box sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              borderBottom: "1px solid #eee",
              bgcolor: "white"
            }}>
              <Avatar
                src={formData.companyLogo}
                sx={{ width: 110, height: 110, mb: 2, boxShadow: 4, border: "4px solid #fff", bgcolor: "primary.light" }}
                variant="rounded"
              >
                {formData.empcomNam?.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={900} color="primary.dark">{formData.empcomNam || "N/A"}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8, mb: 2 }}>{formData.empindTyp} • {formData.empstf} Employees</Typography>

              <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" gap={1}>
                <Chip
                  label={formData.empisVer ? "VERIFIED" : "PENDING VERIFICATION"}
                  color={formData.empisVer ? "success" : "warning"}
                  icon={formData.empisVer ? <VerifiedOutlined /> : undefined}
                  sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                />
                <Chip
                  label={`JOINED: ${formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}`}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Stack>
            </Box>

            <Stack spacing={0} sx={{ p: 2 }}>
              {/* --- SECTION: BASIC INFO --- */}
              <Accordion defaultExpanded elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">BASIC COMPANY INFORMATION</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Company Name", field: "empcomNam" },
                      { label: "Contact Person Name", field: "empname" },
                      { label: "Designation", field: "empdesig" },
                      { label: "Industry Type", field: "empindTyp" },
                      { label: "Staff Count", field: "empstf" },
                      { label: "Website URL", field: "empweb" },
                    ].map((f) => (
                      <Grid item xs={12} sm={6} key={f.label}>
                        <TextField
                          fullWidth size="small" label={f.label}
                          value={formData[f.field] || ""}
                          disabled={!editMode}
                          onChange={(e) => setFormData({ ...formData, [f.field]: e.target.value })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: CONTACT & LOCATION --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HomeOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">CONTACT & LOCATION DETAILS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Primary Phone", field: "empphone" },
                      { label: "Alternate Phone", field: "empaltPhone" },
                      { label: "Address Line", field: "empaddr" },
                      { label: "Locality", field: "emplocal" },
                      { label: "District", field: "empdist" },
                      { label: "State", field: "empstate" },
                      { label: "Pincode", field: "emppin" },
                    ].map((f) => (
                      <Grid item xs={12} sm={6} key={f.label}>
                        <TextField
                          fullWidth size="small" label={f.label}
                          value={formData[f.field] || ""}
                          disabled={!editMode}
                          onChange={(e) => setFormData({ ...formData, [f.field]: e.target.value })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: ABOUT --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BadgeOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">ABOUT COMPANY</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth multiline rows={4} label="Company Overview"
                    value={formData.empabout || ""}
                    disabled={!editMode}
                    onChange={(e) => setFormData({ ...formData, empabout: e.target.value })}
                  />
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: DOCUMENTS --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">VERIFICATION DOCUMENTS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.documents?.length > 0 ? (
                    <Grid container spacing={2}>
                      {formData.documents.map((doc, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fcfcfc" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="overline" color="primary" fontWeight={900}>{doc.type?.toUpperCase()}</Typography>
                              {doc.fileUrl && (
                                <Button
                                  size="small"
                                  startIcon={<LinkOutlined />}
                                  href={doc.fileUrl}
                                  target="_blank"
                                  sx={{ fontWeight: 700, p: 0 }}
                                >
                                  View File
                                </Button>
                              )}
                            </Stack>
                            <Typography variant="body2" fontWeight={700}>{doc.number || "No Number Provided"}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">No documents uploaded for verification</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Stack>

            {/* --- SECTION: GOVERNANCE --- */}
            {editMode && (
              <Box sx={{ p: 4, bgcolor: "#fff5f5" }}>
                <Typography variant="overline" color="error" fontWeight={900}>ACCOUNT CONTROL</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderColor: "#ffeef2", borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.empisVer || false}
                        color="success"
                        onChange={(e) => setFormData({ ...formData, empisVer: e.target.checked })}
                      />
                    }
                    label={<Typography fontWeight={800} variant="body2">MARK COMPANY AS VERIFIED</Typography>}
                  />
                </Paper>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: "1px solid #eee", bgcolor: "white" }}>
            {editMode ? (
              <Stack direction="row" spacing={2}>
                <Button onClick={() => setEditMode(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}
                >
                  {saving ? "Saving..." : "Save Updates"}
                </Button>
              </Stack>
            ) : (
              <Button variant="contained" onClick={() => setViewCompany(null)} sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}>Done</Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AdminCompanies;
