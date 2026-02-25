import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  NotificationsActiveOutlined,
  MarkEmailReadOutlined,
  DeleteOutline,
} from "@mui/icons-material";

/* =========================
   NOTIFICATION TYPE ENUM
========================= */
export const NOTIFICATION_TYPE = Object.freeze({
  JOB: "Job",
  USER: "User",
  COMPANY: "Company",
  SECURITY: "Security",
  SYSTEM: "System",
});

/* =========================
   NOTIFICATION STATUS ENUM
========================= */
export const NOTIFICATION_STATUS = Object.freeze({
  READ: "Read",
  UNREAD: "Unread",
});

/* =========================
   MOCK NOTIFICATION DATA (API READY)
========================= */
const notificationData = [
  {
    id: 1,
    title: "New Job Posted",
    message: "Frontend Developer job posted by ABC Tech",
    module: NOTIFICATION_TYPE.JOB,
    status: NOTIFICATION_STATUS.UNREAD,
    createdAt: "2026-01-28 09:30",
  },
  {
    id: 2,
    title: "User Blocked",
    message: "User Arun Dev has been blocked due to policy violation",
    module: NOTIFICATION_TYPE.USER,
    status: NOTIFICATION_STATUS.READ,
    createdAt: "2026-01-28 10:10",
  },
  {
    id: 3,
    title: "Company Verification Approved",
    message: "XYZ Solutions verification approved",
    module: NOTIFICATION_TYPE.COMPANY,
    status: NOTIFICATION_STATUS.UNREAD,
    createdAt: "2026-01-28 11:00",
  },
  {
    id: 4,
    title: "Multiple Failed Login Attempts",
    message: "Security alert: Failed login attempts detected",
    module: NOTIFICATION_TYPE.SECURITY,
    status: NOTIFICATION_STATUS.UNREAD,
    createdAt: "2026-01-28 11:45",
  },
];

/* =========================
   NOTIFICATION PAGE
========================= */
const Notifications = () => {
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* =========================
     MARK AS READ HANDLER
  ========================== */
  const handleMarkRead = (id) => {
    console.log("Mark notification as read:", id);
    alert(`Notification ${id} marked as read (API call here)`);
  };

  /* =========================
     DELETE HANDLER
  ========================== */
  const handleDelete = (id) => {
    console.log("Delete notification:", id);
    alert(`Notification ${id} deleted (API call here)`);
  };

  /* =========================
     TABLE COLUMNS
  ========================== */
  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1.5,
      },
      {
        field: "message",
        headerName: "Message",
        flex: 2,
      },
      {
        field: "module",
        headerName: "Module",
        flex: 1,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color="primary"
            variant="outlined"
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === NOTIFICATION_STATUS.UNREAD ? "warning" : "success"}
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "Created At",
        flex: 1,
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            {row.status === NOTIFICATION_STATUS.UNREAD && (
              <Tooltip title="Mark as Read">
                <IconButton
                  size="small"
                  onClick={() => handleMarkRead(row.id)}
                >
                  <MarkEmailReadOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row.id)}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  /* =========================
     FILTERED NOTIFICATIONS
  ========================== */
  const filteredRows = useMemo(
    () =>
      notificationData.filter(
        (row) =>
          (moduleFilter ? row.module === moduleFilter : true) &&
          (statusFilter ? row.status === statusFilter : true)
      ),
    [moduleFilter, statusFilter]
  );

  return (
    <Box p="1.5rem">
      {/* ===== HEADER ===== */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="1.5rem"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveOutlined />
          <Typography variant="h4" fontWeight={600}>
            Notifications
          </Typography>
        </Stack>
        <Button variant="outlined" sx={{ borderRadius: "8px" }}>
          Mark All as Read
        </Button>
      </Box>

      {/* ===== FILTER BAR ===== */}
      <Paper sx={{ p: "1rem", mb: "1rem" }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            size="small"
            select
            label="Module"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Modules</MenuItem>
            {Object.values(NOTIFICATION_TYPE).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Status</MenuItem>
            {Object.values(NOTIFICATION_STATUS).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* ===== NOTIFICATION TABLE ===== */}
      <Box height="65vh">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20]}
          disableRowSelectionOnClick
          sx={{
            borderRadius: "10px",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#1f2a40",
              color: "#fff",
              fontWeight: 600,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Notifications;
