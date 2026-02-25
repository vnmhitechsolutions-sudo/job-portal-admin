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
  const [verifyOtp, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [step, setStep] = useState("LOGIN"); // LOGIN or OTP

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

      setUserId(res.userId);
      setStep("OTP");

      setSnack({
        open: true,
        message: "OTP sent to Super Admin for approval",
        severity: "info",
      });
    } catch (err) {
      setError(
        err?.data?.message || "Login failed. Please try again."
      );
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    try {
      const res = await verifyOtp({
        userId,
        otp,
      }).unwrap();

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      setSnack({
        open: true,
        message: "Login successful!",
        severity: "success",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(
        err?.data?.message || "Invalid or expired OTP"
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
              Secure Admin Portal
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            {/* STEP 1 – LOGIN */}
            {step === "LOGIN" && (
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
                      "Request Access"
                    )}
                  </Button>
                </Stack>
              </form>
            )}

            {/* STEP 2 – OTP */}
            {step === "OTP" && (
              <form onSubmit={handleOtpSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    fullWidth
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={otpLoading}
                    sx={{ borderRadius: 2 }}
                  >
                    {otpLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>

                  <Button
                    onClick={() => setStep("LOGIN")}
                    size="small"
                  >
                    Back to Login
                  </Button>
                </Stack>
              </form>
            )}

            <Typography
              variant="caption"
              textAlign="center"
              color="text.secondary"
            >
              Multi-layer secured authentication enabled
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