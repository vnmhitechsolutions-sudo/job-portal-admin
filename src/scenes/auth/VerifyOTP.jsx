import React, { useState, useEffect } from "react";
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
import { useNavigate, useLocation } from "react-router-dom";
import { useVerifyOtpMutation } from "state/api";

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!otp) {
            setError("Please enter the 6-digit OTP");
            return;
        }

        try {
            const res = await verifyOtp({
                email,
                otp,
            }).unwrap();

            localStorage.setItem("token", res.token);
            localStorage.setItem("user", JSON.stringify(res.user));

            setSnack({
                open: true,
                message: "Login successful! Redirecting...",
                severity: "success",
            });

            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        } catch (err) {
            setError(err?.data?.message || "Invalid or expired OTP");
        }
    };

    return (
        <Box
            minHeight="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
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
                        Verify OTP
                    </Typography>

                    <Typography
                        variant="body2"
                        textAlign="center"
                        color="text.secondary"
                    >
                        An OTP has been sent to <b>{email}</b>. Please enter it below to complete your login.
                    </Typography>

                    {error && <Alert severity="error">{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                label="6-Digit OTP"
                                variant="outlined"
                                fullWidth
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '20px' } }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                sx={{ borderRadius: 2 }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "Verify & Login"
                                )}
                            </Button>

                            <Button
                                onClick={() => navigate("/login")}
                                size="small"
                                variant="text"
                            >
                                Back to Login
                            </Button>
                        </Stack>
                    </form>
                </Stack>
            </Paper>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack({ ...snack, open: false })}
            >
                <MuiAlert severity={snack.severity} elevation={6} variant="filled">
                    {snack.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default VerifyOTP;
