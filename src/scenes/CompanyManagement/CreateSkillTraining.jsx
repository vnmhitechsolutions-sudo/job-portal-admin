import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    MenuItem,
    Switch,
    Chip,
    Divider,
    Paper,
    Grid,
    FormControlLabel,
} from "@mui/material";
import { LinkOutlined, SaveOutlined } from "@mui/icons-material";
import axios from "state/instant";

/* =========================
   CONSTANTS (BACKEND MATCH)
========================= */
const LANGUAGES = ["English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada"];
const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CANCELLED"];
const CATEGORY_OPTIONS = ["Soft Skills", "IT", "Non-IT", "Career"];

const CreateSkillTraining = () => {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: "",
        shortTag: "",
        description: "",
        category: "",
        date: "",
        time: "",
        durationMinutes: "",
        language: [],
        price: "",
        isFree: true,
        benefits: [],
        curriculum: [],
        instructor: {
            name: "",
            photo: "",
            designation: "",
        },
        maxSeats: "",
        status: "DRAFT",
        meetingLink: "",
        isActive: true,
    });

    /* =========================
       HANDLERS
    ========================= */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleInstructorChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            instructor: { ...form.instructor, [name]: value },
        });
    };

    const handleArrayInput = (key, value) => {
        setForm({ ...form, [key]: value.split("\n").filter(Boolean) });
    };

    const toggleLanguage = (lang) => {
        setForm({
            ...form,
            language: form.language.includes(lang)
                ? form.language.filter((l) => l !== lang)
                : [...form.language, lang],
        });
    };

    /* =========================
       SUBMIT
    ========================= */
    const handleSubmit = async () => {
        if (!form.title || !form.category || !form.date || !form.time) {
            alert("Required fields missing ❌");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...form,
                date: new Date(form.date),
                durationMinutes: Number(form.durationMinutes),
                price: form.isFree ? 0 : Number(form.price),
                maxSeats: Number(form.maxSeats),
            };

            await axios.post("/admin/skill-trainings", payload);

            alert("Skill Training Created Successfully ✅");

            // RESET
            setForm({
                title: "",
                shortTag: "",
                description: "",
                category: "",
                date: "",
                time: "",
                durationMinutes: "",
                language: [],
                price: "",
                isFree: true,
                benefits: [],
                curriculum: [],
                instructor: { name: "", photo: "", designation: "" },
                maxSeats: "",
                status: "DRAFT",
                meetingLink: "",
                isActive: true,
            });
        } catch (err) {
            console.error(err.response?.data || err);
            alert(err.response?.data?.message || "Create failed ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
                    🚀 CREATE SKILL TRAINING
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Initialize new training programs, workshops, and placement development modules
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
                <Stack spacing={4}>
                    {/* Section: Core Info */}
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                            Course Specifications
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <TextField fullWidth label="Training Title" name="title" value={form.title} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth label="Short Tag / ID" name="shortTag" value={form.shortTag} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth multiline rows={3} label="Program Description" name="description" value={form.description} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField select fullWidth label="Main Category" name="category" value={form.category} onChange={handleChange}>
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField select fullWidth label="Initial Status" name="status" value={form.status} onChange={handleChange}>
                                    {STATUS_OPTIONS.map((s) => (
                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Photo Reference URL" name="photo" value={form.instructor.photo} onChange={handleInstructorChange} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Section: Delivery & Connectivity */}
                    <Box>
                        <Typography variant="overline" color="success.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                            Time & Connectivity
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="date" label="Start Date" name="date" value={form.date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth label="Preferred Time" name="time" value={form.time} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth label="Duration (min)" name="durationMinutes" value={form.durationMinutes} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Meeting / Webinar Link"
                                    name="meetingLink"
                                    value={form.meetingLink}
                                    onChange={handleChange}
                                    placeholder="Zoom, MS Teams, Google Meet link"
                                    InputProps={{
                                        startAdornment: <LinkOutlined sx={{ mr: 1, color: "primary.main" }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={700} mb={1}>Instructional Languages</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {LANGUAGES.map((l) => (
                                        <Chip
                                            key={l}
                                            label={l}
                                            clickable
                                            color={form.language.includes(l) ? "primary" : "default"}
                                            onClick={() => toggleLanguage(l)}
                                            sx={{ mb: 1, borderRadius: "6px" }}
                                        />
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Section: Financials & Capacity */}
                    <Box>
                        <Typography variant="overline" color="secondary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                            Pricing & Availability
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fcfdff", borderRadius: 2 }}>
                            <Grid container spacing={4} alignItems="center">
                                <Grid item>
                                    <FormControlLabel
                                        control={<Switch checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} />}
                                        label="Free Session"
                                    />
                                </Grid>
                                {!form.isFree && (
                                    <Grid item xs={12} sm={3}>
                                        <TextField fullWidth label="Price (₹)" name="price" value={form.price} onChange={handleChange} />
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={3}>
                                    <TextField fullWidth label="Max Capacity" name="maxSeats" value={form.maxSeats} onChange={handleChange} />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    <Divider />

                    {/* Section: Curriculum */}
                    <Box>
                        <Typography variant="overline" color="info.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                            Detailed Curriculum
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth multiline rows={4} label="Program Benefits (one per line)" onChange={(e) => handleArrayInput("benefits", e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth multiline rows={4} label="Learning Modules (one per line)" onChange={(e) => handleArrayInput("curriculum", e.target.value)} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Section: Instructor */}
                    <Box>
                        <Typography variant="overline" color="warning.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
                            Resource Person Details
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fffcf8", borderColor: "#fff1e1", borderRadius: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Instructor Full Name" name="name" value={form.instructor.name} onChange={handleInstructorChange} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Professional Designation" name="designation" value={form.instructor.designation} onChange={handleInstructorChange} />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    <Box pt={2}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<SaveOutlined />}
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{ py: 2, borderRadius: 2, fontWeight: 900, fontSize: "1rem", boxShadow: 4 }}
                        >
                            {loading ? "INITIALIZING PROGRAM..." : "LAUNCH SKILL TRAINING PROGRAM"}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};

export default CreateSkillTraining;
