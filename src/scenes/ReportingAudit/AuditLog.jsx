import React, { useEffect, useMemo, useState } from "react";
import axios from "api/api";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Link,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DownloadOutlined, SearchOutlined } from "@mui/icons-material";

const ENDPOINT = "/admin/audit-logs";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(ENDPOINT, {
        params: {
          page: page + 1,
          limit: pageSize,
          module: moduleFilter || undefined,
          status: statusFilter || undefined,
          action: actionFilter || undefined,
          role: roleFilter || undefined,
          search: search || undefined,
        },
      });
      if (data?.success) {
        setLogs(data.logs || []);
        setTotalRows(data.total || 0);
      } else {
        setLogs([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error("Fetch Audit Logs Error:", err);
      setLogs([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, pageSize, moduleFilter, statusFilter, actionFilter, roleFilter, search]);

  const handleExport = () => {
    if (!logs.length) return;

    const csvRows = [
      ["User", "Role", "Module", "Action", "Status", "Description", "IP", "Device", "Date", "RefLink"],
      ...logs.map((log) => [
        log.user?.email || "N/A",
        log.user?.role?.name || "N/A",
        log.module,
        log.action,
        log.status,
        log.description || "",
        log.ip || "",
        log.device || "",
        new Date(log.createdAt).toLocaleString(),
        log.refLink ? `=HYPERLINK("${log.refLink}")` : "",
      ]),
    ];

    const blob = new Blob([csvRows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit_logs.csv";
    link.click();
  };

  const columns = useMemo(
    () => [
      {
        field: "user",
        headerName: "User",
        flex: 1,
        renderCell: ({ row }) => row.user?.email || "N/A",
      },
      {
        field: "role",
        headerName: "Role",
        flex: 1,
        renderCell: ({ row }) => row.user?.role?.name || "N/A",
      },
      { field: "module", headerName: "Module", flex: 1 },
      { field: "action", headerName: "Action", flex: 1 },
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        renderCell: ({ value }) => {
          const bg = value === "SUCCESS" ? "#4caf50" : value === "FAILED" ? "#f44336" : "#9e9e9e";
          return (
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: bg,
                color: "#fff",
                fontWeight: 600,
                borderRadius: 1,
                textAlign: "center",
                fontSize: "0.75rem",
              }}
            >
              {value}
            </Box>
          );
        },
      },
      {
        field: "description",
        headerName: "Description",
        flex: 2,
        renderCell: ({ value }) => (
          <Tooltip title={value || ""}>
            <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</Box>
          </Tooltip>
        ),
      },
      { field: "ip", headerName: "IP", flex: 1 },
      { field: "device", headerName: "Device", flex: 1.5 },
      {
        field: "createdAt",
        headerName: "Date",
        flex: 1,
        renderCell: ({ value }) => new Date(value).toLocaleString(),
      },
      {
        field: "refLink",
        headerName: "RefLink",
        flex: 1,
        renderCell: ({ value }) => value ? <Link href={value} target="_blank">View</Link> : "N/A",
      },
    ],
    []
  );

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Audit Logs</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={!logs.length}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Module"
            value={moduleFilter}
            onChange={(e) => {
              setPage(0);
              setModuleFilter(e.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="USER">USER</MenuItem>
            <MenuItem value="JOB">JOB</MenuItem>
            <MenuItem value="TUTORIAL">TUTORIAL</MenuItem>
            <MenuItem value="COMPANY">COMPANY</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Action"
            value={actionFilter}
            onChange={(e) => {
              setPage(0);
              setActionFilter(e.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="CREATE">CREATE</MenuItem>
            <MenuItem value="UPDATE">UPDATE</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
            <MenuItem value="LOGIN">LOGIN</MenuItem>
            <MenuItem value="LOGOUT">LOGOUT</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Role"
            value={roleFilter}
            onChange={(e) => {
              setPage(0);
              setRoleFilter(e.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="SUPER_ADMIN">SUPER_ADMIN</MenuItem>
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="USER">USER</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="SUCCESS">SUCCESS</MenuItem>
            <MenuItem value="FAILED">FAILED</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Paper>

      {/* Table */}
      <Paper>
        <Box height="70vh">
          <DataGrid
            rows={logs}
            columns={columns}
            getRowId={(row) => row._id}
            rowCount={totalRows}
            loading={loading}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeader": { backgroundColor: "#f5f5f" },
              "& .MuiDataGrid-cell": { whiteSpace: "nowrap" },
            }}
          />
        </Box>
      </Paper>

      {loading && (
        <Box mt={2} textAlign="center">
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default AuditLog;
