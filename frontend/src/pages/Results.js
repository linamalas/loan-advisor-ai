// src/pages/Results.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
} from "@mui/material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { BarChart } from "@mui/x-charts/BarChart";

function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <Container sx={{ py: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            No results available. Please go back and try again.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/predict")}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }

  const riskPercent = Math.round(result.risk_score * 100);
  
  // Fix gauge color - 69% should be orange (High Risk)
  const gaugeColor =
    riskPercent <= 20 ? "#4caf50" :  // Green - Very Low Risk
    riskPercent <= 40 ? "#8bc34a" :  // Light Green - Low Risk  
    riskPercent <= 60 ? "#ffeb3b" :  // Yellow - Medium Risk
    riskPercent <= 80 ? "#ff9800" :  // Orange - High Risk (69% falls here)
    "#f44336";                       // Red - Very High Risk

  // Utility to convert technical feature names into user-friendly labels
  const getFriendlyName = (technicalName) => {
    if (!technicalName) return "Unknown Feature";

    // --- Credit History ---
    if (technicalName.includes("DELINQ")) return "Past Due Payments";
    if (technicalName.includes("DEROG")) return "Derogatory Credit Marks";
    if (technicalName.includes("NINQ")) return "Number of Recent Credit Inquiries";
    if (technicalName.includes("CLAGE")) return "Credit History Length (Months)";
    if (technicalName.includes("CLNO")) return "Number of Credit Lines";

    // --- Debt / Income ---
    if (technicalName.includes("DEBTINC")) return "Debt-to-Income Ratio";

    // --- Loan / Mortgage ---
    if (technicalName.includes("LOAN")) return "Loan Amount Requested";
    if (technicalName.includes("MORTDUE")) return "Outstanding Mortgage Balance";
    if (technicalName.includes("VALUE")) return "Property Value";

    // --- Employment / Job ---
    if (technicalName.includes("YOJ")) return "Years at Current Job";
    if (technicalName.includes("JOB_Self")) return "Self-Employed";
    if (technicalName.includes("JOB_Office")) return "Office Worker";
    if (technicalName.includes("JOB_Sales")) return "Sales Professional";
    if (technicalName.includes("JOB_Mgr")) return "Managerial Position";
    if (technicalName.includes("JOB_ProfExe")) return "Professional/Executive";
    if (technicalName.includes("JOB_Other")) return "Other Job";

    // --- Loan Reason ---
    if (technicalName.includes("REASON_HomeImp")) return "Loan for Home Improvement";
    if (technicalName.includes("REASON_DebtCon")) return "Loan for Debt Consolidation";

    // --- Income / Demographics ---
    if (technicalName.includes("INCOME")) return "Applicant Income";
    if (technicalName.includes("CCSCORE")) return "Credit Score";   // (if included in your version)

    // --- Default Fallback ---
    return technicalName; // If unmapped, return the raw name
  };


  // Normalize factors with user-friendly names
  const factors = (result.top_factors || result.explanation || []).map((f) => ({
    name: getFriendlyName(f.name || f.feature || f.model || "Unknown"),
    value: f.value ?? f.impact ?? 0,
  }));

  // Separate factors into positive (risk-increasing) and negative (risk-decreasing)
  const positiveFactors = factors.filter(f => f.value > 0);
  const negativeFactors = factors.filter(f => f.value < 0);

  console.log("All factors:", factors);
  console.log("Positive:", positiveFactors);
  console.log("Negative:", negativeFactors);
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        sx={{
          p: 5,
          borderRadius: 4,
          mx: "auto",
          maxWidth: 950,
          boxShadow: "0px 6px 25px rgba(0,0,0,0.12)",
          background: "linear-gradient(135deg, #ffffff, #f9f9f9)",
        }}
      >
        {/* Title */}
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          align="center"
          sx={{ color: "#0f624d" }}
        >
          Loan Risk Analysis
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          Personalized insights based on your financial profile
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Risk Gauge */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Gauge
            width={260}
            height={260}
            value={riskPercent}
            valueMin={0}
            valueMax={100}
            sx={{
              [`& .${gaugeClasses.valueArc}`]: { stroke: gaugeColor },
              [`& .${gaugeClasses.valueText}`]: { fontSize: 34, fontWeight: 700, fill: gaugeColor },
            }}

            text={({ value }) => `${value}%`}
          />
        </Box>

        {/* Risk Label */}
        <Typography
          align="center"
          variant="h5"
          sx={{ color: gaugeColor, fontWeight: "bold", mb: 5 }}
        >
          {result.risk_label ||
            (riskPercent > 60
              ? "High Risk (Likely to Default)"
              : "Low Risk (Likely to Repay)")}
        </Typography>

        {/* Explanation Paragraph */}
        <Typography
          variant="body1"
          align="center"
          sx={{ mb: 4, lineHeight: 1.6 }}
        >
          {result.explanation_paragraph ||
            "Based on your data, here is your loan risk assessment:"}
        </Typography>


        {/* Risk Factors - Separated by Impact */}
        {factors.length > 0 && (
          <>
            {/* Risk-Increasing Factors (Positive Values) */}
            {positiveFactors.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 2, color: "#d32f2f" }}
                >
                  🔴 Risk-Increasing Factors
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  These features increase your loan default risk
                </Typography>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ 
                    scaleType: "band", 
                    data: positiveFactors.map((f,i) => `${f.name} (${i})`),
                    tickLabelStyle: { fontSize: 12, textAnchor: "end" },
                    width: 120,
                  }]}
                  xAxis={[{ label: "Risk Impact" }]}
                  series={[{ 
                    data: positiveFactors.map((f) => f.value),
                    color: "#d32f2f"
                  }]}
                  width={600}
                  height={Math.max(200, positiveFactors.length * 40)}
                />
              </Box>
            )}

            {/* Risk-Decreasing Factors (Negative Values) */}
            {negativeFactors.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 2, color: "#2e7d32" }}
                >
                  🟢 Risk-Decreasing Factors
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  These features decrease your loan default risk
                </Typography>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ 
                    scaleType: "band", 
                    data: negativeFactors.map((f) => f.name),
                    tickLabelStyle: { fontSize: 12, textAnchor: "end" },
                    width: 120,
                  }]}
                  xAxis={[{ label: "Risk Impact" }]}
                  series={[{ 
                    data: negativeFactors.map((f) => Math.abs(f.value)),
                    color: "#2e7d32"
                  }]}
                  width={600}
                  height={Math.max(200, negativeFactors.length * 40)}
                />
              </Box>
            )}

          </>
        )}

        {/* Chat Button */}
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              mt: 5,
              px: 4,
              fontSize: "1rem",
              background: "linear-gradient(90deg,#0f624d,#148f77)",
              "&:hover": {
                background: "linear-gradient(90deg,#0c4c3c,#10705e)",
              },
            }}
            onClick={() => navigate("/chat", { state: { result } })}
          >
            Chat with Advisor
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Results;
