import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Switch,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";

import {
  AddOutlined,
  EditOutlined,
  VisibilityOutlined,
  SecurityOutlined,
} from "@mui/icons-material";

import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useAssignPermissionsMutation,
  useGetPermissionsQuery,
} from "state/api";

/* =========================
   AUTH UTILS
========================= */
const getLoggedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

/* =========================
   COMPONENT
========================= */
const RolesPermissions = () => {
  const user = getLoggedInUser();

  // ✅ Safe Role Check
  const isSuperAdmin =
    user?.role?.key?.toUpperCase() === "SUPER_ADMIN";

  /* =========================
     API CALLS
  ========================= */
  const { data: roles = [], isLoading: rolesLoading } =
    useGetRolesQuery();

  const { data: permissions = [], isLoading: permLoading } =
    useGetPermissionsQuery();

  const [createRole] = useCreateRoleMutation();
  const [assignPermissions] = useAssignPermissionsMutation();

  /* =========================
     STATE
  ========================= */
  const [selectedRole, setSelectedRole] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  const [newRole, setNewRole] = useState({
    key: "",
    name: "",
  });

  /* =========================
     GROUP PERMISSIONS
  ========================= */
  const permissionGroups = useMemo(() => {
    const grouped = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.group]) grouped[perm.group] = [];
      grouped[perm.group].push(perm);
    });
    return grouped;
  }, [permissions]);

  /* =========================
     TOGGLE PERMISSION
  ========================= */
  const handleTogglePermission = async (permKey) => {
    if (!isSuperAdmin || !selectedRole) return;

    const updatedPermissions = selectedRole.permissions.includes(
      permKey
    )
      ? selectedRole.permissions.filter((p) => p !== permKey)
      : [...selectedRole.permissions, permKey];

    await assignPermissions({
      roleId: selectedRole._id,
      permissions: updatedPermissions,
    });

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions,
    });
  };

  /* =========================
     CREATE ROLE
  ========================= */
  const handleCreateRole = async () => {
    if (!newRole.key || !newRole.name) return;

    await createRole({
      key: newRole.key.trim().toUpperCase(),
      name: newRole.name.trim(),
    });

    setNewRole({ key: "", name: "" });
    setOpenCreate(false);
  };

  /* =========================
     LOADING
  ========================= */
  if (rolesLoading || permLoading) {
    return (
      <Box p="2rem" textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p="2rem">
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="2rem"
      >
        <Typography variant="h4" fontWeight="600">
          Roles & Permissions
        </Typography>

        {isSuperAdmin && (
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 2 }}
          >
            Create Role
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* ROLES LIST */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={600} mb={2}>
              System Roles
            </Typography>

            {roles.map((role) => (
              <Paper
                key={role._id}
                onClick={() => setSelectedRole(role)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  cursor: "pointer",
                  borderRadius: 2,
                  border:
                    selectedRole?._id === role._id
                      ? "2px solid #1976d2"
                      : "1px solid #ddd",
                  transition: "0.2s",
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography fontWeight={600}>
                      {role.name}
                    </Typography>
                    <Typography
                      fontSize="0.75rem"
                      color="text.secondary"
                    >
                      {role.key}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={role.isActive ? "Active" : "Disabled"}
                    color={
                      role.isActive ? "success" : "default"
                    }
                  />
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  mt={1}
                >
                  <Typography fontSize="0.7rem">
                    Permissions: {role.permissions.length}
                  </Typography>

                  <Box>
                    <IconButton size="small">
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>

                    {isSuperAdmin && (
                      <IconButton size="small">
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Paper>
        </Grid>

        {/* PERMISSIONS PANEL */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, minHeight: "60vh" }}>
            {selectedRole ? (
              <>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <SecurityOutlined color="primary" />
                  <Typography fontWeight={600}>
                    Permissions – {selectedRole.name}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {Object.entries(permissionGroups).map(
                  ([groupName, perms]) => (
                    <Box key={groupName} mb={2}>
                      <Typography
                        fontSize="0.8rem"
                        fontWeight={600}
                        mb={1}
                      >
                        {groupName}
                      </Typography>

                      {perms.map((perm) => (
                        <Box
                          key={perm.key}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          py={0.5}
                        >
                          <Typography fontSize="0.85rem">
                            {perm.name}
                          </Typography>

                          <Switch
                            checked={selectedRole.permissions.includes(
                              perm.key
                            )}
                            disabled={!isSuperAdmin}
                            onChange={() =>
                              handleTogglePermission(
                                perm.key
                              )
                            }
                          />
                        </Box>
                      ))}
                    </Box>
                  )
                )}
              </>
            ) : (
              <Typography color="text.secondary">
                Select a role to manage permissions
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* CREATE ROLE DIALOG */}
      {isSuperAdmin && (
        <Dialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Role</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Role Key (ex: HR_ADMIN)"
              margin="normal"
              value={newRole.key}
              onChange={(e) =>
                setNewRole({
                  ...newRole,
                  key: e.target.value,
                })
              }
            />

            <TextField
              fullWidth
              label="Role Name"
              margin="normal"
              value={newRole.name}
              onChange={(e) =>
                setNewRole({
                  ...newRole,
                  name: e.target.value,
                })
              }
            />
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setOpenCreate(false)}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateRole}
            >
              Create Role
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default RolesPermissions;