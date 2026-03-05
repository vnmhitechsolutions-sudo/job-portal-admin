import { Box, Paper, TextField, Button } from "@mui/material";
import { useState } from "react";

const FiltersBar = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const applyFilter = () => {
    // Validation
    if (startDate && endDate && startDate > endDate) {
      alert("Start date cannot be after End date");
      return;
    }

    onFilterChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange({});
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
        <TextField
          type="date"
          size="small"
          label="Start Date"
          value={startDate}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <TextField
          type="date"
          size="small"
          label="End Date"
          value={endDate}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <Button
          variant="contained"
          onClick={applyFilter}
          sx={{ textTransform: "none", height: "40px", px: 3, borderRadius: 2 }}
        >
          Apply Filter
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={clearFilter}
          sx={{ textTransform: "none", height: "40px", px: 3, borderRadius: 2 }}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
};

export default FiltersBar;
