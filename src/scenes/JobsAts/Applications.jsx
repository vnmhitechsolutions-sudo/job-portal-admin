import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import axiosInstance from "state/instant";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formData, setFormData] = useState({});

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* =========================
     FETCH APPLICATIONS
  ========================= */
  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get("/admin/applications");
    if (data.success) setApplications(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  /* =========================
     VIEW
  ========================= */
  const handleView = async (app) => {
    const { data } = await axiosInstance.get(
      `/admin/applications/${app._id}`
    );
    if (data.success) {
      setSelectedApp(data.data);
      setFormData(data.data);
      setEditMode(false);
      setViewOpen(true);
    }
  };

  /* =========================
     SAVE UPDATE
  ========================= */
  const handleSave = async () => {
    try {
      await axiosInstance.put(
        `/admin/applications/${selectedApp._id}`,
        {
          status: formData.status,
          interviewMode: formData.interviewMode,
          interviewTime: formData.interviewTime,
        }
      );

      setSnack({
        open: true,
        message: "Application updated successfully",
        severity: "success",
      });

      fetchApplications();
      setEditMode(false);
    } catch {
      setSnack({
        open: true,
        message: "Update failed",
        severity: "error",
      });
    }
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = useMemo(
    () => [
      {
        field: "candidateName",
        headerName: "Candidate Name",
        flex: 1.2,
        renderCell: ({ row }) =>
          row.candidateId?.canname || "—",
      },
      {
        field: "candidateEmail",
        headerName: "Email",
        flex: 1.4,
        renderCell: ({ row }) =>
          row.candidateId?.canemail || "—",
      },
      {
        field: "jobId",
        headerName: "Job ID",
        flex: 1.2,
        renderCell: ({ row }) =>
          row.jobId?._id || row.jobId || "—",
      },
      {
        field: "interviewMode",
        headerName: "Interview Mode",
        flex: 1,
      },
      {
        field: "interviewTime",
        headerName: "Interview Time",
        flex: 1,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.status}
            color="primary"
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.8,
        sortable: false,
        renderCell: ({ row }) => (
          <Tooltip title="View">
            <IconButton
              onClick={() => handleView(row)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Box p="1.5rem">
      <Typography
        variant="h4"
        fontWeight={600}
        mb={2}
      >
        Job Applications
      </Typography>

      <Paper elevation={3}>
        <Box height="65vh">
          <DataGrid
            rows={applications}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
          />
        </Box>
      </Paper>

      {/* VIEW / EDIT DIALOG */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
          >
            <Typography fontWeight={600}>
              Application Details
            </Typography>
            {!editMode && (
              <IconButton
                onClick={() =>
                  setEditMode(true)
                }
              >
                <EditOutlined />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>

        <Divider />

        {selectedApp && (
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Candidate Name"
                  fullWidth
                  value={
                    selectedApp.candidateId
                      ?.canname
                  }
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  value={
                    selectedApp.candidateId
                      ?.canemail
                  }
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Job ID"
                  fullWidth
                  value={
                    selectedApp.jobId?._id ||
                    selectedApp.jobId
                  }
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Interview Mode"
                  fullWidth
                  select
                  disabled={!editMode}
                  value={
                    formData.interviewMode ||
                    ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interviewMode:
                        e.target.value,
                    })
                  }
                >
                  <MenuItem value="Virtual">
                    Virtual
                  </MenuItem>
                  <MenuItem value="Offline">
                    Offline
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Interview Time"
                  type="time"
                  fullWidth
                  disabled={!editMode}
                  value={
                    formData.interviewTime ||
                    ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interviewTime:
                        e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Status"
                  fullWidth
                  select
                  disabled={!editMode}
                  value={
                    formData.status || ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status:
                        e.target.value,
                    })
                  }
                >
                  {[
                    "Applied",
                    "Viewed",
                    "Shortlisted",
                    "Interview Scheduled",
                    "Selected",
                    "Rejected",
                    "Hired",
                  ].map((s) => (
                    <MenuItem
                      key={s}
                      value={s}
                    >
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
        )}

        <DialogActions>
          {editMode ? (
            <>
              <Button
                startIcon={
                  <CloseOutlined />
                }
                onClick={() =>
                  setEditMode(false)
                }
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={
                  <SaveOutlined />
                }
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              onClick={() =>
                setViewOpen(false)
              }
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnack({
            ...snack,
            open: false,
          })
        }
      >
        <Alert
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Applications;
