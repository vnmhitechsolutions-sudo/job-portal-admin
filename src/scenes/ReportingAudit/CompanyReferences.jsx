import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";
import { RefreshOutlined } from "@mui/icons-material";
import apiClient from "../../api/apiClient";
import FiltersBar from "../dashboard/components/FiltersBar";

/* =========================
   PAGE ANIMATION
========================= */
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const Reports = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [openView, setOpenView] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiClient.get("/admin/jobs");

      const jobs = res.data || (Array.isArray(res) ? res : []);

      const formatted = jobs.map((job, index) => ({
        id: job._id || index,
        empname: job.postedBy?.empname || "-",
        empemail: job.postedBy?.empemail || "-",
        cmpName: job.cmpName || "-",
        jobTit: job.jobTit || "-",
        jobTyp: job.jobTyp || "-",
        jobMod: job.jobMod || "-",
        jobCity: job.jobCity || "-",
        salary:
          job.salTyp === "Unpaid"
            ? "Unpaid"
            : `₹${job.salMin || 0} - ₹${job.salMax || 0}`,
        openings: job.openings || 0,
        contactName: job.contactName || "-",
        contactPhone: job.contactPhone || "-",
        createdAt: job.createdAt
          ? new Date(job.createdAt).toISOString().split("T")[0]
          : "-",
        newDeadline: job.newDeadline
          ? new Date(job.newDeadline).toISOString().split("T")[0]
          : "-",
      }));

      setRows(formatted);
      setFilteredRows(formatted);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "API Fetch Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DATE FILTER
  ========================= */
  const handleFilterChange = (filters) => {
    const { startDate, endDate } = filters;

    // Reset only if both filters are cleared
    if (!startDate && !endDate) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter((row) => {
      if (!row.createdAt || row.createdAt === "-") return false;

      if (startDate && endDate) {
        return row.createdAt >= startDate && row.createdAt <= endDate;
      } else if (startDate) {
        return row.createdAt >= startDate;
      } else if (endDate) {
        return row.createdAt <= endDate;
      }
      return true;
    });

    setFilteredRows(filtered);
  };

  /* =========================
     SEARCH FILTER
  ========================= */
  const searchedFilteredRows = useMemo(() => {
    if (!search) return filteredRows;
    const q = search.toLowerCase();
    return filteredRows.filter(
      (r) =>
        (r.empname && r.empname.toLowerCase().includes(q)) ||
        (r.empemail && r.empemail.toLowerCase().includes(q)) ||
        (r.cmpName && r.cmpName.toLowerCase().includes(q)) ||
        (r.jobTit && r.jobTit.toLowerCase().includes(q)) ||
        (r.jobCity && r.jobCity.toLowerCase().includes(q))
    );
  }, [filteredRows, search]);

  /* =========================
     SUMMARY TOTALS
  ========================= */
  const totalJobs = searchedFilteredRows.length;

  const totalCompanies = [
    ...new Set(searchedFilteredRows.map((row) => row.cmpName)),
  ].length;

  const totalOpenings = searchedFilteredRows.reduce(
    (sum, row) => sum + (row.openings || 0),
    0
  );

  const totalEmployees = [
    ...new Set(searchedFilteredRows.map((row) => row.empemail)),
  ].length;

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      { field: "empname", headerName: "Employee Name", flex: 1 },
      { field: "empemail", headerName: "Employee Email", flex: 1 },
      { field: "cmpName", headerName: "Company Name", flex: 1 },
      { field: "jobTit", headerName: "Job Title", flex: 1 },
      { field: "jobTyp", headerName: "Job Type", flex: 1 },
      { field: "jobMod", headerName: "Job Mode", flex: 1 },
      { field: "jobCity", headerName: "City", flex: 1 },
      { field: "salary", headerName: "Salary", flex: 1 },
      { field: "openings", headerName: "Openings", flex: 0.7 },
      { field: "contactName", headerName: "Contact Person", flex: 1 },
      { field: "contactPhone", headerName: "Contact Phone", flex: 1 },
      { field: "createdAt", headerName: "Posted Date", flex: 1 },
      { field: "newDeadline", headerName: "Deadline", flex: 1 },
    ],
    []
  );

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4 }}
      >
        <Box p={4}>
          <Typography variant="h4" fontWeight={700} mb={3}>
            Company Reference Report
          </Typography>

          {/* ================= SUMMARY CARDS ================= */}
          <Grid container spacing={3} mb={4}>
            {[
              { label: "Total Jobs", value: totalJobs },
              { label: "Total Companies", value: totalCompanies },
              { label: "Total Openings", value: totalOpenings },
              { label: "Total Employees Posted", value: totalEmployees },
            ].map((item, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Card elevation={4} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6">
                      {item.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ================= SEARCH BAR ================= */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
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
                  onClick={fetchData}
                  sx={{ textTransform: "uppercase" }}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* ================= FILTER ================= */}
          <Box mb={3}>
            <FiltersBar onFilterChange={handleFilterChange} />
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {/* ================= TABLE ================= */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            {loading ? (
              <Box textAlign="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <Box height={520}>
                <DataGrid
                  rows={searchedFilteredRows}
                  columns={columns}
                  pageSizeOptions={[20]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 20 } },
                  }}
                  disableRowSelectionOnClick
                  hideFooterPagination
                />
              </Box>
            )}
          </Paper>
        </Box>
      </motion.div>

      {/* ================= VIEW DIALOG ================= */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Details</DialogTitle>
        <DialogContent dividers>
          {selectedRow &&
            Object.entries(selectedRow).map(([key, value]) => (
              <Typography key={key} mb={1}>
                <strong>{key}:</strong> {String(value)}
              </Typography>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Reports;
