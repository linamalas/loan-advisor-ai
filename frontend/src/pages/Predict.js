// src/pages/Predict.js
import React, { useState } from "react";
import {
  Box, Button, Container, Typography, TextField, Grid,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, CircularProgress, Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Predict() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setLoading(false);
      navigate("/results", { state: { result: data } });
    } catch (error) {
      console.error("Prediction failed", error);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
        Loan Information Form
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* ================= Financials Section ================= */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Financial Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Loan Amount" type="number"
                onChange={(e) => handleChange("LOAN", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Mortgage Due" type="number"
                onChange={(e) => handleChange("MORTDUE", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Property Value" type="number"
                onChange={(e) => handleChange("VALUE", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Debt-to-Income Ratio (%)" type="number"
                onChange={(e) => handleChange("DEBTINC", parseFloat(e.target.value))} />
            </Grid>
          </Grid>
        </Box>

        {/* ================= Credit History Section ================= */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Credit History
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Derogatory Reports" type="number"
                onChange={(e) => handleChange("DEROG", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Delinquent Credit Lines" type="number"
                onChange={(e) => handleChange("DELINQ", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Oldest Credit Line (months)" type="number"
                onChange={(e) => handleChange("CLAGE", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Recent Inquiries" type="number"
                onChange={(e) => handleChange("NINQ", parseFloat(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Total Credit Lines" type="number"
                onChange={(e) => handleChange("CLNO", parseFloat(e.target.value))} />
            </Grid>
          </Grid>
        </Box>

        {/* ================= Personal Info Section ================= */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Personal & Job Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Years on Job" type="number"
                onChange={(e) => handleChange("YOJ", parseFloat(e.target.value))} />
            </Grid>
          </Grid>

          {/* Reason */}
          <FormControl component="fieldset" sx={{ mt: 3 }}>
            <FormLabel>Reason</FormLabel>
            <RadioGroup row onChange={(e) => {
              setFormData({
                ...formData,
                REASON_HomeImp: e.target.value === "HomeImp",
                REASON_DebtCon: e.target.value === "DebtCon",
                REASON_Unknown: e.target.value === "Unknown"
              });
            }}>
              <FormControlLabel value="HomeImp" control={<Radio />} label="Home Improvement" />
              <FormControlLabel value="DebtCon" control={<Radio />} label="Debt Consolidation" />
              <FormControlLabel value="Unknown" control={<Radio />} label="Other/Unknown" />
            </RadioGroup>
          </FormControl>

          {/* Job */}
          <FormControl component="fieldset" sx={{ mt: 3 }}>
            <FormLabel>Job Type</FormLabel>
            <RadioGroup row onChange={(e) => {
              setFormData({
                ...formData,
                JOB_Office: e.target.value === "Office",
                JOB_Other: e.target.value === "Other",
                JOB_ProfExe: e.target.value === "ProfExe",
                JOB_Sales: e.target.value === "Sales",
                JOB_Self: e.target.value === "Self",
                JOB_Mgr: e.target.value === "Mgr"
              });
            }}>
              <FormControlLabel value="Office" control={<Radio />} label="Office" />
              <FormControlLabel value="ProfExe" control={<Radio />} label="Professional/Executive" />
              <FormControlLabel value="Sales" control={<Radio />} label="Sales" />
              <FormControlLabel value="Mgr" control={<Radio />} label="Manager" />
              <FormControlLabel value="Self" control={<Radio />} label="Self-employed" />
              <FormControlLabel value="Other" control={<Radio />} label="Other" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Submit */}
        <Box textAlign="center" sx={{ mt: 5 }}>
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Predict Risk"}
          </Button>
        </Box>
      </form>
    </Container>
  );
}

export default Predict;
