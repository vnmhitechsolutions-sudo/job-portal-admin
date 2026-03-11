import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { SaveOutlined, VideoLibraryOutlined } from "@mui/icons-material";
import axios from "state/instant";

const LEVELS = ["Basic", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Tamil", "Hindi"];

const CreateTutorial = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    foss: "",
    language: "English",
    level: "Basic",
    videoUrl: "",
    outline: "",
    transcript: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&]+)/);
    return match ? match[1] : "";
  };

  const handleSubmit = async () => {
    if (!form.title || !form.foss || !form.videoUrl) {
      alert("Required fields missing ❌");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title,
        foss: form.foss,
        language: form.language,
        level: form.level,
        videoUrl: form.videoUrl,
        videoId: extractVideoId(form.videoUrl),
        outline: form.outline,
        transcript: form.transcript,
      };

      await axios.post("/admin/tutorials", payload);
      alert("Tutorial Created Successfully ✅");

      setForm({
        title: "",
        foss: "",
        language: "English",
        level: "Basic",
        videoUrl: "",
        outline: "",
        transcript: "",
      });
    } catch (err) {
      alert("Create failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} sx={{ bgcolor: "#fafcfe", minHeight: "100vh" }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: -0.5 }}>
          🎥 CREATE NEW TUTORIAL
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Upload and organize educational resources, video content, and exercise materials
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #eef2f6", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <Stack spacing={4}>
          {/* Section: Core Info */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
              General Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField fullWidth label="Tutorial Title" name="title" value={form.title} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="FOSS / Software Name" name="foss" value={form.foss} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Primary Language" name="language" value={form.language} onChange={handleChange}>
                  {LANGUAGES.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Difficulty Level" name="level" value={form.level} onChange={handleChange}>
                  {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="YouTube / Resource Video URL"
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  InputProps={{ startAdornment: <VideoLibraryOutlined sx={{ mr: 1, color: "primary.main" }} /> }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Section: Content */}
          <Box>
            <Typography variant="overline" color="success.main" fontWeight={900} fontSize="0.75rem" sx={{ letterSpacing: 2, display: "block", mb: 2 }}>
              Content & Transcript
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={4} label="Program Outline" name="outline" value={form.outline} onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={6} label="Full Transcript / Notes" name="transcript" value={form.transcript} onChange={handleChange} />
              </Grid>
            </Grid>
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
              {loading ? "PROCESSING CONTENT..." : "PUBLISH TUTORIAL MODULE"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CreateTutorial;
