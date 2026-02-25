import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import {
  useLoginMutation,
  useVerifyOtpMutation,
} from "state/api";

const Login = () => {
  const navigate = useNavigate();

  const [loginUser, { isLoading: loginLoading }] = useLoginMutation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }

    try {
      const res = await loginUser({
        email: form.email.trim(),
        password: form.password,
      }).unwrap();

      setSnack({
        open: true,
        message: "OTP sent to your email",
        severity: "info",
      });

      // Navigate to OTP verification page with email in state
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: res.email } });
      }, 1000);
    } catch (err) {
      setError(
        err?.data?.message || "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <>
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          background:
            "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: 420,
            p: 4,
            borderRadius: 3,
          }}
        >
          <Stack spacing={2.5}>
            <Typography
              variant="h4"
              fontWeight={700}
              textAlign="center"
              color="primary"
            >
              EMPEX HITECH
            </Typography>

            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
            >
              Secure Admin Portal Login
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleLoginSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  required
                  value={form.email}
                  onChange={handleChange}
                />

                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  fullWidth
                  required
                  value={form.password}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loginLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {loginLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Login"
                  )}
                </Button>
              </Stack>
            </form>

            <Typography
              variant="caption"
              textAlign="center"
              color="text.secondary"
            >
              Multi-factor authentication enabled for all admins
            </Typography>
          </Stack>
        </Paper>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <MuiAlert
          severity={snack.severity}
          elevation={6}
          variant="filled"
        >
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Login;

