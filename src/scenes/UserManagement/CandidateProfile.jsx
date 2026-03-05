import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "state/instant";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  ExpandMore as ExpandMoreIcon,
  BusinessOutlined,
  SchoolOutlined,
  WorkHistoryOutlined,
  AssignmentOutlined,
  LinkOutlined,
  EmailOutlined,
  PhoneOutlined,
  HomeOutlined,
  TranslateOutlined,
  StarBorderOutlined,
  GroupOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FiltersBar from "../dashboard/components/FiltersBar";

/* ===============================
   STATUS CHIP
================================ */
const JobStatusChip = ({ status }) => {
  const map = {
    "Actively Looking": "success",
    "Open to Offers": "info",
    "Not Looking": "default",
  };
  return (
    <Chip size="small" label={status || "N/A"} color={map[status] || "default"} />
  );
};

/* ===============================
   MAIN COMPONENT
================================ */
const AdminCandidateProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewProfile, setViewProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilters, setDateFilters] = useState({});

  /* ===============================
     FETCH PROFILES
  =================================*/
  const handleFilterChange = (newDates) => {
    // If newDates is empty (Clear button clicked), reset ALL filters
    if (!newDates.startDate && !newDates.endDate) {
      setSearch("");
      setStatusFilter("");
    }
    setDateFilters(newDates);
  };

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/candidate-profiles", {
        params: {
          search: search || undefined,
          jobSearchStatus: statusFilter || undefined,
          startDate: dateFilters.startDate || undefined,
          endDate: dateFilters.endDate || undefined,
        },
      });

      setProfiles(res.data?.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load candidate profiles");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFilters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /* ===============================
     PROCESS DATA & FILTER FALLBACK
  =================================*/
  const processedProfiles = useMemo(() => {
    let result = profiles;

    // Search Filter Fallback
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.personal?.canname && p.personal.canname.toLowerCase().includes(q)) ||
          (p.personal?.canemail && p.personal.canemail.toLowerCase().includes(q)) ||
          (p.personal?.canphone && p.personal.canphone.includes(q))
      );
    }

    // Status Filter Fallback
    if (statusFilter) {
      result = result.filter(
        (p) => p.personal?.jobSearchStatus === statusFilter
      );
    }

    // Date Filter Fallback
    if (dateFilters.startDate || dateFilters.endDate) {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt).toISOString().split("T")[0];

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

    return result.map((p) => {
      const latestEdu =
        p.education?.length > 0
          ? p.education[p.education.length - 1]
          : null;

      return {
        ...p,
        mobile: p.personal?.canphone || "N/A",
        college: latestEdu?.caneduIns || "N/A",
        course: latestEdu?.caneduCrs || "N/A",
        qualification: latestEdu?.caneduQual || "N/A",
        skillsList: p.skills?.map((s) => s.canskicou).join(", ") || "N/A",
        createdAt: p.createdAt,
      };
    });
  }, [profiles, dateFilters, search, statusFilter]);


  /* ===============================
     SAVE EDIT
  =================================*/
  const handleSave = async () => {
    try {
      await axiosInstance.put(
        `/admin/candidate-profiles/${viewProfile._id}`,
        formData
      );

      setEditMode(false);
      setViewProfile(null);
      fetchProfiles();
    } catch {
      alert("Update failed");
    }
  };

  /* ===============================
     TABLE COLUMNS
  =================================*/
  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Candidate",
        flex: 1.5,
        renderCell: ({ row }) => (
          <Stack spacing={0.3}>
            <Typography fontWeight={600}>
              {row.personal?.canname || "N/A"}
            </Typography>
            <Typography fontSize="0.75rem" color="text.secondary">
              {row.personal?.canemail}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "mobile",
        headerName: "Mobile Number",
        flex: 1.2,
      },
      {
        field: "college",
        headerName: "College",
        flex: 1.5,
      },
      {
        field: "course",
        headerName: "Course",
        flex: 1.2,
      },
      {
        field: "skillsList",
        headerName: "Skills",
        flex: 2,
      },
      {
        field: "jobStatus",
        headerName: "Job Status",
        flex: 1,
        renderCell: ({ row }) => (
          <JobStatusChip status={row.personal?.jobSearchStatus} />
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
        flex: 0.8,
        sortable: false,
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            onClick={() => {
              setViewProfile(row);
              setFormData(row);
              setEditMode(false);
            }}
          >
            <VisibilityOutlined />
          </IconButton>
        ),
      },
    ],
    []
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600}>
        Candidate Profiles Admin
      </Typography>

      {/* FILTERS */}
      <Stack direction="row" spacing={2} my={3} alignItems="center">
        <TextField
          size="small"
          label="Search name/email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <Button
          variant="contained"
          onClick={fetchProfiles}
          sx={{ height: 40, px: 3 }}
        >
          Search
        </Button>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="Actively Looking">Actively Looking</MenuItem>
            <MenuItem value="Open to Offers">Open to Offers</MenuItem>
            <MenuItem value="Not Looking">Not Looking</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box mb={2}>
        <FiltersBar onFilterChange={handleFilterChange} />
      </Box>

      {/* GRID */}
      <Box height="65vh">
        <DataGrid
          rows={processedProfiles}
          loading={loading}
          columns={columns}
          getRowId={(row) => row._id}
          pageSize={20}
          disableRowSelectionOnClick
          hideFooterPagination
        />
      </Box>

      {/* 🖊️ REVAMPED VIEW + EDIT DIALOG */}
      {viewProfile && (
        <Dialog
          open
          onClose={() => setViewProfile(null)}
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
              {editMode ? "✍️ EDIT CANDIDATE PROFILE" : "👤 CANDIDATE FULL PROFILE"}
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
            {/* 👤 TOP HEADER: STICKY STYLED HEADER */}
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
                src={formData.personal?.profilePicture}
                sx={{ width: 110, height: 110, mb: 2, boxShadow: 4, border: "4px solid #fff" }}
              >
                {formData.personal?.canname?.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={900} color="primary.dark">{formData.personal?.canname || "N/A"}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8, mb: 2 }}>{formData.personal?.canemail}</Typography>

              <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" gap={1}>
                <Chip label={formData.personal?.jobSearchStatus || "N/A"} color="primary" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                <Chip
                  label={formData.isVerified ? "VERIFIED" : "UNVERIFIED"}
                  color={formData.isVerified ? "success" : "warning"}
                  sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                />
                <Chip label={`JOINEED: ${new Date(formData.createdAt).toLocaleDateString()}`} variant="outlined" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
              </Stack>
            </Box>

            <Stack spacing={0} sx={{ p: 2 }}>
              {/* --- SECTION: PERSONAL & CONTACT --- */}
              <Accordion defaultExpanded elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HomeOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">PERSONAL & CONTACT DETAILS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Father's Name", path: "personal.canfatNam" },
                      { label: "DOB", path: "personal.candob" },
                      { label: "Gender", path: "personal.cangen" },
                      { label: "Phone", path: "personal.canphone" },
                      { label: "Email", path: "personal.canemail" },
                      { label: "Street", path: "personal.canstreet" },
                      { label: "Area", path: "personal.canarea" },
                      { label: "Area Type", path: "personal.canareaTp" },
                      { label: "District", path: "personal.candist" },
                      { label: "State", path: "personal.canstate" },
                      { label: "Nationality", path: "personal.cannation" },
                      { label: "Pincode", path: "personal.canpin" },
                    ].map((f) => (
                      <Grid item xs={12} sm={6} key={f.label}>
                        <TextField
                          fullWidth size="small" label={f.label}
                          value={f.path.split('.').reduce((o, i) => o?.[i], formData) || ""}
                          disabled={!editMode}
                          onChange={(e) => {
                            const keys = f.path.split(".");
                            const updated = { ...formData };
                            let temp = updated;
                            keys.slice(0, -1).forEach(k => { temp[k] = { ...temp[k] }; temp = temp[k]; });
                            temp[keys[keys.length - 1]] = e.target.value;
                            setFormData(updated);
                          }}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth multiline rows={3} label="About Candidate"
                        value={formData.personal?.canabout || ""}
                        disabled={!editMode}
                        onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, canabout: e.target.value } })}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: REFERENCE INFORMATION --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">REFERENCE INFORMATION</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Referrer Name", field: "referrerName" },
                      { label: "Referrer Phone", field: "referrerPhone" },
                      { label: "Referred By (Source)", field: "referredBy" },
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

              {/* --- SECTION: ACADEMIC HISTORY --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">ACADEMIC HISTORY</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.education?.length > 0 ? (
                    <Stack spacing={3}>
                      {formData.education.map((edu, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fcfcfc" }}>
                          <Typography variant="overline" color="text.secondary" fontWeight={900}>Entry #{idx + 1}</Typography>
                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Qualification" value={edu.caneduQual} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Institute" value={edu.caneduIns} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Course" value={edu.caneduCrs} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Specialization" value={edu.caneduSpc} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Passing Year" value={edu.caneduYr} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Percentage" value={edu.caneduPct} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Type" value={edu.caneduTyp} disabled={!editMode} /></Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">No education recorded</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: WORK EXPERIENCE --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WorkHistoryOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">WORK EXPERIENCE</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.experience?.length > 0 ? (
                    <Stack spacing={3}>
                      {formData.experience.map((exp, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fcfcfc" }}>
                          <Typography variant="overline" color="text.secondary" fontWeight={900}>Company #{idx + 1}</Typography>
                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Company" value={exp.canexpOrg} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Designation" value={exp.canexpDesig} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Start Year" value={exp.canexpStYr} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="End Year" value={exp.canexpEdYr} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Current" value={exp.canexpCurr ? "Yes" : "No"} disabled={!editMode} /></Grid>
                            <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Description" value={exp.canexpDesc} disabled={!editMode} /></Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">Fresher (No experience recorded)</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: INTERNSHIPS --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">INTERNSHIPS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.internships?.length > 0 ? (
                    <Stack spacing={3}>
                      {formData.internships.map((int, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fcfcfc" }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Company" value={int.canintComp} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Duration" value={int.canintDur} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Stipend" value={int.canintStip} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Type" value={int.canintType} disabled={!editMode} /></Grid>
                            <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Responsibility" value={int.canintResp} disabled={!editMode} /></Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">No internships recorded</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: KEY PROJECTS --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AssignmentOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">KEY PROJECTS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.projects?.length > 0 ? (
                    <Stack spacing={3}>
                      {formData.projects.map((pro, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#fcfcfc" }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Title" value={pro.canproTit} disabled={!editMode} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="URL" value={pro.canproUrl} disabled={!editMode} /></Grid>
                            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={pro.canproDsc} disabled={!editMode} /></Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" fontStyle="italic">No projects recorded</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: SKILLS & LANGUAGES --- */}
              <Accordion elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TranslateOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">SKILLS & LANGUAGES</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">TECHNICAL SKILLS</Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 0.5 }}>
                        <Typography variant="body2">{formData.skills?.map(s => s.canskicou).join(", ") || "No skills listed"}</Typography>
                      </Paper>
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">LANGUAGES KNOWN</Typography>
                      <Grid container spacing={1} mt={0.5}>
                        {formData.languages?.map((lan, idx) => (
                          <Grid item key={idx}>
                            <Chip label={`${lan.canlanNam} (${lan.canlanLvl})`} size="small" variant="outlined" />
                          </Grid>
                        )) || <Typography variant="body2" ml={1}>No languages listed</Typography>}
                      </Grid>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* --- SECTION: JOB PREFERENCES --- */}
              <Accordion elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StarBorderOutlined color="primary" />
                    <Typography fontWeight={800} variant="subtitle2">JOB PREFERENCES</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Looking For" value={formData.jobPreferences?.lookingFor || ""} disabled={!editMode} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Expected Salary" value={formData.jobPreferences?.expectedSalary || "Not specified"} disabled={!editMode} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Preferred Roles" value={formData.jobPreferences?.preferredRoles?.join(", ") || ""} disabled={!editMode} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Preferred Locations" value={formData.jobPreferences?.preferredLocations?.join(", ") || ""} disabled={!editMode} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>

            {/* --- SECTION: GOVERNANCE --- */}
            {editMode && (
              <Box sx={{ p: 4, bgcolor: "#fff5f5" }}>
                <Typography variant="overline" color="error" fontWeight={900}>ACCOUNT CONTROL</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderColor: "#ffeef2", borderRadius: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={formData.isVerified || false} color="success" onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })} />}
                    label={<Typography fontWeight={800} variant="body2">MARK AS VERIFIED PROFILE</Typography>}
                  />
                </Paper>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: "1px solid #eee", bgcolor: "white" }}>
            {editMode ? (
              <Stack direction="row" spacing={2}>
                <Button onClick={() => setEditMode(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}>Save Updates</Button>
              </Stack>
            ) : (
              <Button variant="contained" onClick={() => setViewProfile(null)} sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}>Done</Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AdminCandidateProfiles;
