import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Container, 
  IconButton, 
  Paper, 
  Stack, 
  TextField, 
  Typography, 
  Avatar, 
  Button,
  Drawer,
  Divider,
  Collapse
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { BarChart } from "@mui/x-charts/BarChart";
import { useLocation } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


function Chatbot() {
  const location = useLocation();
  const result = location.state?.result;
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(!!result); // Open sidebar if we have results
  const endRef = useRef(null);
  const [sidebarResult, setSidebarResult] = useState(result); // initialize with passed-in result
  const [isFirstMessageLoading, setIsFirstMessageLoading] = useState(true);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper functions for processing loan results
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

  // Process loan results if available
  const riskPercent = sidebarResult ? Math.round(sidebarResult.risk_score * 100) : 0;
  const gaugeColor = sidebarResult ? (
    riskPercent <= 20 ? "#4caf50" :
    riskPercent <= 40 ? "#8bc34a" :
    riskPercent <= 60 ? "#ffeb3b" :
    riskPercent <= 80 ? "#ff9800" :
    "#f44336"
  ) : "#9e9e9e";

  const factors = sidebarResult
  ? (sidebarResult.top_factors || sidebarResult.explanation || []).map((f) => ({
      name: getFriendlyName(f.name || f.feature || f.model || "Unknown"),
      value: f.value ?? f.impact ?? 0,
    }))
  : [];


  const positiveFactors = factors.filter(f => f.value > 0);
  const negativeFactors = factors.filter(f => f.value < 0);




  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message locally
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // ✅ Send user question to backend
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        question: trimmed
      }));
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const socketRef = useRef(null);
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");
    socketRef.current=socket;

    socket.onopen = () => {
      console.log("✅ Connected to backend");
      const name=localStorage.getItem("fullName") || "";
      // 👉 Send initial automatic question to LLM here:
      socket.send(JSON.stringify({
        ml_result:sidebarResult,
        question: "Introduce yourself briefly",
        name:name,
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS DATA:", data)
      // 1. Handle stream chunks
      if (data.type === "rag_stream") {
        setIsFirstMessageLoading(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.isStreaming) {
            // Append to existing assistant message
            const updated = { ...last, text: last.text + data.content };
            return [...prev.slice(0, -1), updated];
          } else {
            // Start a new streaming assistant message
            return [
              ...prev,
              { id: Date.now(), role: "assistant", text: data.content, isStreaming: true },
            ];
          }
        });
      }

      // 2. Handle "done" signal
      else if (data.type === "rag_done") {
        setMessages((prev) =>
          prev.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          )
        );
      }

      // 3. Handle final bundled ML result (don't overwrite streamed text)

      else if (data.ml_result) {
        setSidebarResult(data.ml_result)
      }


      // 4. Fallback if backend sends rag_response without streaming
      else if (data.rag_response) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "assistant", text: data.rag_response },
        ]);
      }
    };



    socket.onclose = () => console.log("❌ Disconnected from backend");
    socket.onerror = (err) => console.error("WebSocket error:", err);

    return () => socket.close();
  }, []);


  if (!sidebarResult) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          No risk assessment available yet. Try submitting your loan details first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      {result && (
        <Drawer
          variant="persistent"
          anchor="left"
          open={sidebarOpen}
          sx={{
            width: sidebarOpen ? 400 : 0,
            flexShrink: 0,
            transition: 'width 0.3s ease-in-out',
            '& .MuiDrawer-paper': {
              width: 400,
              boxSizing: 'border-box',
              position: 'fixed',
              top: 70,
              height: 'calc(100vh - 70px)',
              borderRight: '1px solid #e0e0e0',
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            },
          }}
        >
          <Box sx={{ 
            p: 2, 
            height: '100%', 
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}>
            {/* Sidebar Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon sx={{ mr: 1, color: '#0f624d' }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f624d', flex: 1 }}>
                Loan Risk Assessment
              </Typography>
              <IconButton onClick={() => setSidebarOpen(false)} size="small">
                <ChevronLeftIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Risk Gauge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Gauge
                width={200}
                height={200}
                value={riskPercent}
                valueMin={0}
                valueMax={100}
                sx={{
                  [`& .${gaugeClasses.valueArc}`]: { stroke: gaugeColor },
                  [`& .${gaugeClasses.valueText}`]: { fontSize: 24, fontWeight: 700, fill: gaugeColor },
                }}
                text={({ value }) => `${value}%`}
              />
            </Box>

            {/* Risk Label */}
            <Typography
              align="center"
              variant="h6"
              sx={{ color: gaugeColor, fontWeight: "bold", mb: 3 }}
            >
              {sidebarResult.risk_label ||
                (riskPercent >= 80
                  ? "Very High Risk"
                  : riskPercent >= 60
                  ? "High Risk"
                  : riskPercent >= 40
                  ? "Medium Risk"
                  : riskPercent >= 20
                  ? "Low Risk"
                  : "Very Low Risk")}
            </Typography>

            {/* Risk-Increasing Factors */}
            {positiveFactors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#d32f2f" }}>
                  🔴 Risk-Increasing Factors
                </Typography>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ 
                    scaleType: "band", 
                    data: positiveFactors.map((f) => f.name),
                    tickLabelStyle: { fontSize: 10, textAnchor: "end" },
                    width: 100,
                  }]}
                  xAxis={[{ label: "Impact" }]}
                  series={[{ 
                    data: positiveFactors.map((f) => f.value),
                    color: "#d32f2f"
                  }]}
                  width={350}
                  height={Math.max(150, positiveFactors.length * 30)}
                />
              </Box>
            )}

            {/* Risk-Decreasing Factors */}
            {negativeFactors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#2e7d32" }}>
                  🟢 Risk-Decreasing Factors
                </Typography>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ 
                    scaleType: "band", 
                    data: negativeFactors.map((f) => f.name),
                    tickLabelStyle: { fontSize: 10, textAnchor: "end" },
                    width: 100,
                  }]}
                  xAxis={[{ label: "Impact" }]}
                  series={[{ 
                    data: negativeFactors.map((f) => Math.abs(f.value)),
                    color: "#2e7d32"
                  }]}
                  width={350}
                  height={Math.max(150, negativeFactors.length * 30)}
                />
              </Box>
            )}
          </Box>
        </Drawer>
      )}



      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>


        {/* Chat Messages Area */}
        {!sidebarOpen && result && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 1 }}>
            <IconButton 
              onClick={() => setSidebarOpen(true)} 
              sx={{ 
                color: '#0f624d',
                '&:hover': { backgroundColor: 'rgba(15,98,77,0.1)' }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}

        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 3,
          pb: 0, // Remove bottom padding since input is sticky
          background: 'transparent'
        }}>
          <Container maxWidth="lg">
            <Stack spacing={3}>
              {messages.map((m) => (
                <Stack 
                  key={m.id} 
                  direction={m.role === 'user' ? 'row-reverse' : 'row'} 
                  spacing={2} 
                  alignItems="flex-start"
                  sx={{ width: '100%' }}
                >
                  <Avatar sx={{ 
                    bgcolor: m.role === 'user' 
                      ? 'linear-gradient(45deg, #0f624d, #148f77)' 
                      : 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                    width: 48,
                    height: 48,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {m.role === 'user' ? '👤' : '🤖'}
                  </Avatar>
                  <Box sx={{
                    maxWidth: m.role === 'user' ? '70%' : '80%',
                    minWidth: '200px'
                  }}>
                    <Box sx={{
                      background: m.role === 'user' 
                        ? 'linear-gradient(135deg, #0f624d, #148f77)'
                        : 'white',
                      color: m.role === 'user' ? 'white' : '#2d3748',
                      px: 3,
                      py: 2,
                      borderRadius: 3,
                      boxShadow: m.role === 'user' 
                        ? '0 8px 25px rgba(15, 98, 77, 0.3)'
                        : '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: m.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      position: 'relative',
                      '&::before': m.role === 'user' ? {
                        content: '""',
                        position: 'absolute',
                        right: -8,
                        top: 20,
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid #148f77',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                      } : {
                        content: '""',
                        position: 'absolute',
                        left: -8,
                        top: 20,
                        width: 0,
                        height: 0,
                        borderRight: '8px solid white',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                      }
                    }}>
                    {m.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "1rem" }}
                      >
                        {m.text}
                      </Typography>
                    )}

                    </Box>
                  </Box>
                </Stack>
              ))}
              {isFirstMessageLoading && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'linear-gradient(45deg, #6366f1, #8b5cf6)' }}>🤖</Avatar>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderRadius: 3,
                      background: 'white',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontStyle: 'italic',
                        letterSpacing: 0.3,
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                    >
                      Thinking...
                    </Typography>
                  </Box>
                </Stack>
              )}

              <div ref={endRef} />
            </Stack>
          </Container>
        </Box>

        {/* Sticky Input Area */}
        <Box sx={{ 
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
        }}>
          <Container maxWidth="lg">
            <Stack direction="row" spacing={2} alignItems="flex-end">
              <TextField
                fullWidth
                placeholder="Ask me anything about your loan application..."
                multiline
                minRows={1}
                maxRows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '& fieldset': {
                      border: '2px solid transparent',
                    },
                    '&:hover fieldset': {
                      border: '2px solid rgba(15, 98, 77, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      border: '2px solid #0f624d',
                    },
                  },
                }}
              />
              <IconButton 
                onClick={handleSend} 
                aria-label="send message"
                sx={{
                  backgroundColor: 'linear-gradient(45deg, #0f624d, #148f77)',
                  background: 'linear-gradient(45deg, #0f624d, #148f77)',
                  color: 'white',
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  boxShadow: '0 8px 25px rgba(15, 98, 77, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0c4c3c, #10705e)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(15, 98, 77, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <SendIcon sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default Chatbot;


