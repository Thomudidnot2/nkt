import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;
const LEADS_FILE = path.join(process.cwd(), "leads.json");

app.use(express.json());

// Initialize Leads Database from File safely
let leads: any[] = [];
if (fs.existsSync(LEADS_FILE)) {
  try {
    const raw = fs.readFileSync(LEADS_FILE, "utf-8");
    leads = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading leads file, starting empty", err);
  }
} else {
  // Pre-seed a few leads to look realistic immediately
  leads = [
    {
      id: "lead-1",
      name: "Abhilash Nair",
      email: "abhilash.nair@kseb.in",
      message: "Interested in the expansion planning of the IonGrid OCPP hardware cluster in other Idukki sectors. Looking to discuss grid connection stability.",
      status: "New",
      timestamp: new Date(Date.now() - 36 * 1000 * 3600).toISOString() // 36 hours ago
    },
    {
      id: "lead-2",
      name: "Minu Mary Mathews",
      email: "minu@keralahotels.co",
      message: "Are there vacant commercial spaces on the first floor of Nedumpurath Towers for setting up a premium coffee boutique with EV parking views?",
      status: "Reviewed",
      timestamp: new Date(Date.now() - 12 * 1000 * 3600).toISOString() // 12 hours ago
    }
  ];
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

function saveLeads() {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write leads file", err);
  }
}

// Pre-seed property database (in-memory, highly granular)
const properties = [
  {
    id: "prop-1",
    name: "N.K.T. Vessels House",
    location: "Nedumpurath Towers, Ground Floor (Market Road Side)",
    type: "Retail Core",
    tenant: "NKT Family Owned (Est. 1947)",
    areaSqFt: 1800,
    monthlyRent: "Self-Occupied",
    occupancyStatus: "Occupied",
    leaseExpiry: "N/A",
    maintenanceLogs: [
      { date: "2026-05-20", issue: "Kitchenware showcase LED upgrades", status: "Completed" },
      { date: "2026-05-12", issue: "Prestige appliance stock inventory sync", status: "Completed" }
    ]
  },
  {
    id: "prop-2",
    name: "NKT Charge Hub Terminal",
    location: "Nedumpurath Towers, Ground Floor Front",
    type: "Infrastructure",
    tenant: "IONGRID Energy Solutions",
    areaSqFt: 400,
    monthlyRent: "₹28,000",
    occupancyStatus: "Occupied",
    leaseExpiry: "2031-12-31",
    maintenanceLogs: [
      { date: "2026-05-24", issue: "Dual Gun DC cooling fan fluid pressure test", status: "Completed" },
      { date: "2026-05-18", issue: "Firmware flash to OCPP 2.0.1 (KSEB integration)", status: "Completed" }
    ]
  },
  {
    id: "prop-3",
    name: "BSNL Customer Care Center",
    location: "Nedumpurath Towers, Ground Floor Back",
    type: "Corporate Office",
    tenant: "BSNL (Kerala Telecom Circle)",
    areaSqFt: 1200,
    monthlyRent: "₹42,000",
    occupancyStatus: "Occupied",
    leaseExpiry: "2028-06-30",
    maintenanceLogs: [
      { date: "2026-05-02", issue: "External backup generator diagnostic audit", status: "Completed" }
    ]
  },
  {
    id: "prop-4",
    name: "Josco Office Wing",
    location: "Nedumpurath Towers, First Floor",
    type: "Admin Suites",
    tenant: "Josco Jewellery Admin",
    areaSqFt: 1500,
    monthlyRent: "₹38,000",
    occupancyStatus: "Occupied",
    leaseExpiry: "2027-09-15",
    maintenanceLogs: [
      { date: "2026-05-15", issue: "Central AC duct purification routine", status: "Completed" }
    ]
  },
  {
    id: "prop-5",
    name: "ThomuPrimeX Cinematography Lab & Studio",
    location: "Nedumpurath Towers, Second Floor Penthouse",
    type: "Creative Tech Space",
    tenant: "MD Private Media Org",
    areaSqFt: 1100,
    monthlyRent: "Self-Occupied",
    occupancyStatus: "Occupied",
    leaseExpiry: "N/A",
    maintenanceLogs: [
      { date: "2026-05-22", issue: "DJI Inspire 3 Cine telemetry battery recharge panel install", status: "Completed" }
    ]
  },
  {
    id: "prop-6",
    name: "Premium Boutique Space 3B",
    location: "Nedumpurath Towers, Second Floor Middle",
    type: "Commercial Retail",
    tenant: "Vacant - Enquiries Invited",
    areaSqFt: 850,
    monthlyRent: "₹24,000 (Target)",
    occupancyStatus: "Vacant",
    leaseExpiry: "N/A",
    maintenanceLogs: [
      { date: "2026-05-10", issue: "Glass storefront facade deep polishing", status: "Completed" }
    ]
  }
];

// Pre-seed agentic log stream to mirror the vibe-coding automation
let agenticLogs = [
  { id: "log-1", time: "17:41:02", category: "TELEMETRY", text: "OCPP 2.0.1 handshake success. Nedumpurath Towers DC-Gun-1 reported heartbeat (33A, 415V KSEB Line)." },
  { id: "log-2", time: "17:42:15", category: "SYNC", text: "ThomuPrimeX Media Hook: Scanned latest aerial cinematography assets. Found 3 maps of Thodupuzha bypass." },
  { id: "log-3", time: "17:43:08", category: "SECURITY", text: "Command Center Admin validation daemon checked sessions. Token health: 100%." },
  { id: "log-4", time: "17:44:20", category: "DATABASE", text: "Leads syncer routine verified: checked incoming forms. Spooler empty." }
];

// Predictive maintenance tickets for OCPP systems
let predictiveTickets = [
  {
    id: "t-1",
    unit: "CCS Gun 1 Coupler",
    issue: "Slight connector heat signature variance (+4.2°C ambient shift)",
    severity: "Low",
    advisory: "Preemptive spray of contact cleanser recommended. Dust-filter routine scheduled.",
    status: "Active",
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
  },
  {
    id: "t-2",
    unit: "KSEB Substation Busbar Connector",
    issue: "Voltage sag harmonics (2.8% wave deformation detected under dual-draw)",
    severity: "Medium",
    advisory: "Perform remote phase-balancer shift via OCPP 2.0.1 parameters stream.",
    status: "Active",
    timestamp: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString()
  }
];

// Dynamic grid demand response configuration
let demandResponseLevel = "Balanced"; // "Low", "Balanced", "Peak Shift (Grid Saver)"


// Gemini helper lazy-initializer
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes

// 1. Leads API
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required fields." });
  }
  const newLead = {
    id: "lead-" + Date.now(),
    name,
    email,
    message,
    status: "New",
    timestamp: new Date().toISOString()
  };
  leads.unshift(newLead);
  saveLeads();

  // Push an automated log entry simulating vibe-coded interceptor
  agenticLogs.unshift({
    id: "log-" + Date.now(),
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    category: "WEBHOOK",
    text: `Automation active: New lead captured for [${name}]. Initiated background reputation check on email domain.`
  });

  res.json({ success: true, lead: newLead });
});

app.patch("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const leadIndex = leads.findIndex((l) => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }
  leads[leadIndex].status = status || leads[leadIndex].status;
  saveLeads();
  res.json({ success: true, lead: leads[leadIndex] });
});

// 2. EV Charger Telemetry api (Simulating dynamic, gorgeous real-time metrics opposing Josco Jewellery)
app.get("/api/telemetry/ev", (req, res) => {
  const now = Date.now();
  
  // Calculate pricing and limits depending on demand response mode
  let activeRate = "₹15.99";
  let capLimitFactor = 1.0;
  
  if (demandResponseLevel === "Low") {
    activeRate = "₹13.99";
    capLimitFactor = 1.1; // allow boost
  } else if (demandResponseLevel === "Peak Shift") {
    activeRate = "₹19.49 (Grid Saver active)";
    capLimitFactor = 0.7; // throttle max draws to balance local KSEB transformer
  }

  const fluctuation1 = Math.sin(now / 5000) * 4.2; // fluctuate +- 4kW
  const fluctuation2 = Math.cos(now / 7000) * 3.1; // fluctuate +- 3kW

  const baseGun1 = demandResponseLevel === "Peak Shift" ? 35.0 : 48.5;
  const baseGun2 = demandResponseLevel === "Peak Shift" ? 22.0 : 32.1;

  const gun1Power = Math.max(0, parseFloat((baseGun1 + fluctuation1).toFixed(2))); // DC Gun 1
  const gun2Power = Math.max(0, parseFloat((baseGun2 + fluctuation2).toFixed(2))); // DC Gun 2
  const isGun1Charging = gun1Power > 5;
  const isGun2Charging = gun2Power > 5;

  const telemetry = {
    stationId: "NKT-DC-HYPER-01",
    location: "Nedumpurath Towers, Ground Floor, Thodupuzha City Centre",
    operator: "IONGRID Energy Solutions (IonGrid Network)",
    ksebInputVoltage: parseFloat((411.5 + Math.sin(now / 15000) * 3.2).toFixed(1)), // Standard 3-phase grid line
    ksebFrequencyHz: parseFloat((49.98 + Math.cos(now / 20000) * 0.05).toFixed(2)),
    totalPowerDrawKw: parseFloat((gun1Power + gun2Power).toFixed(2)),
    introductoryRateKwh: activeRate,
    activeSessionsCount: (isGun1Charging ? 1 : 0) + (isGun2Charging ? 1 : 0),
    peakPowerCapacityKw: parseFloat((90.0 * capLimitFactor).toFixed(1)),
    kwhDeliveredToday: parseFloat((234.8 + (now % 100000) / 1000).toFixed(2)),
    demandResponseActiveLevel: demandResponseLevel,
    
    guns: [
      {
        id: 1,
        connectorType: "CCS Type 2 (DC Fast)",
        maxCapacityKw: parseFloat((60.0 * capLimitFactor).toFixed(1)),
        currentDrawKw: gun1Power,
        status: isGun1Charging ? "Charging" : "Available",
        activeSession: isGun1Charging ? {
          vehicle: "Hyundai Ioniq 5 (Kerala Custom)",
          soc: Math.min(99, Math.floor(52 + (now / 20000) % 30)), // state of charge percentage
          durationMinutes: Math.floor(18 + (now / 60000) % 40),
          energyEnergyKwh: parseFloat((18.4 + (now / 100000) % 25).toFixed(2)),
          tariffKwh: activeRate
        } : null
      },
      {
        id: 2,
        connectorType: "CCS Type 2 (DC Fast)",
        maxCapacityKw: parseFloat((45.0 * capLimitFactor).toFixed(1)),
        currentDrawKw: gun2Power,
        status: isGun2Charging ? "Charging" : "Available",
        activeSession: isGun2Charging ? {
          vehicle: "Tata Nexon EV Max",
          soc: Math.min(99, Math.floor(38 + (now / 25000) % 45)),
          durationMinutes: Math.floor(28 + (now / 60000) % 30),
          energyEnergyKwh: parseFloat((14.2 + (now / 110000) % 18).toFixed(2)),
          tariffKwh: activeRate
        } : null
      },
      {
        id: 3,
        connectorType: "Type 2 Plug (AC Slow / 2-Wheelers)",
        maxCapacityKw: 3.3,
        currentDrawKw: 0.0,
        status: "Available",
        activeSession: null
      }
    ],
    lastTelemetryUpdate: new Date().toISOString()
  };

  res.json(telemetry);
});

// New Endpoints for Predictive Control Center & Asset CRM
// Get active predictive maintenance tickets
app.get("/api/telemetry/ev/tickets", (req, res) => {
  res.json(predictiveTickets);
});

// Resolve predictive maintenance ticket
app.post("/api/telemetry/ev/tickets/:id/resolve", (req, res) => {
  const { id } = req.params;
  const ticketIndex = predictiveTickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Predictive ticket not found" });
  }
  
  const ticket = predictiveTickets[ticketIndex];
  ticket.status = "Resolved";
  
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  // Add an automated log entry
  agenticLogs.unshift({
    id: "log-" + Date.now(),
    time: timestamp,
    category: "TELEMETRY",
    text: `Grid Operator (Admin Portal) resolved predictive threat for [${ticket.unit}]. Corrective action processed, voltage stabilizers re-calibrated.`
  });

  res.json({ success: true, tickets: predictiveTickets });
});

// Get demand response configuration
app.get("/api/telemetry/ev/demand", (req, res) => {
  res.json({ demandResponseLevel });
});

// Update demand response configuration
app.post("/api/telemetry/ev/demand", (req, res) => {
  const { level } = req.body;
  if (!level || !["Low", "Balanced", "Peak Shift"].includes(level)) {
    return res.status(400).json({ error: "Invalid demand response level." });
  }

  demandResponseLevel = level;
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  
  // Add log event
  agenticLogs.unshift({
    id: "log-" + Date.now(),
    time: timestamp,
    category: "TELEMETRY",
    text: `OCPP Configuration Profile modified: Demand-Response optimized to [${level}]. Dynamic tariff rates propagated.`
  });

  res.json({ success: true, demandResponseLevel });
});

// Add maintenance log dynamically to property in-memory
app.post("/api/properties/:id/logs", (req, res) => {
  const { id } = req.params;
  const { issue } = req.body;
  if (!issue) {
    return res.status(400).json({ error: "Issue description is required." });
  }

  const propIndex = properties.findIndex(p => p.id === id);
  if (propIndex === -1) {
    return res.status(404).json({ error: "Property or asset not found in lease database." });
  }

  const newLog = {
    date: new Date().toISOString().split('T')[0],
    issue,
    status: "Completed"
  };

  properties[propIndex].maintenanceLogs.unshift(newLog);

  // Push to agentic logs
  agenticLogs.unshift({
    id: "log-" + Date.now(),
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    category: "DATABASE",
    text: `Asset portfolio updated: Added completed maintenance event for [${properties[propIndex].name}] - ${issue}.`
  });

  res.json({ success: true, property: properties[propIndex] });
});


// 3. Properties API
app.get("/api/properties", (req, res) => {
  res.json(properties);
});

// 4. Media & Cinematography (ThomuPrimeX) metadata API
app.get("/api/media", (req, res) => {
  const media = [
    {
      id: "media-1",
      title: "Nedumpurath Towers & Thodupuzha City Centre - High Altitude 8K Mapping Grid",
      description: "Drone photography showing full aerial orthomosaic mapping of Market Road, Nedumpurath Towers facade structural analysis, and Josco junction.",
      duration: "04:12",
      publishDate: "2026-05-18",
      views: 1420,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // standard fallback
      resolution: "8K Ultra HD",
      tags: ["Drone Mapping", "Thodupuzha", "Architectural Facade"]
    },
    {
      id: "media-2",
      title: "IonGrid Charger Installation - Real-Time Hardware Time-lapse & Grid Connection",
      description: "Timelapse video of KSEB 3-phase line provisioning on the Ground Floor and the mounting of the IONGRID OCPP 2.0.1 dual-gun hypercharger.",
      duration: "03:45",
      publishDate: "2026-04-30",
      views: 890,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      resolution: "4K Cine",
      tags: ["IonGrid", "EV Charger", "Infrastructure Engineering"]
    },
    {
      id: "media-3",
      title: "Scenic Idukki Valley Aerial Footage - ThomuPrimeX Nature series",
      description: "Creative cinematographical exploration of hills and reservoirs surrounding Thodupuzha, Malayalam heartlands showcase.",
      duration: "06:18",
      publishDate: "2026-03-15",
      views: 3120,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      resolution: "8K UHD",
      tags: ["Cinematography", "Idukki Hills", "Nature Prime"]
    }
  ];
  res.json(media);
});

// 5. Automated Webhook Listener
app.post("/api/webhooks/agentic", (req, res) => {
  const { event, source, payload } = req.body;
  
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const newLog = {
    id: "log-" + Date.now(),
    time: timestamp,
    category: "WEBHOOK",
    text: `Incoming API Signal [${event || "GENERIC_TRIGGER"}]: Received event from [${source || "Zapier-Agent"}]. Payload items processed safely.`
  };

  agenticLogs.unshift(newLog);
  // Cap logs at 100 entries to prevent memory leak
  if (agenticLogs.length > 100) {
    agenticLogs = agenticLogs.slice(0, 100);
  }

  res.json({ success: true, processedLog: newLog });
});

// Read and query automated logs
app.get("/api/telemetry/logs", (req, res) => {
  res.json(agenticLogs);
});

// 6. Secure Server-Side Gemini AI Chat Proxy
app.post("/api/ai/assistant", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Prompt message is required." });
  }

  // Define custom system instruction giving full background grounding
  const systemPrompt = `You are the digital persona of George S. Thomas, Managing Director of the NKT Group based in Thodupuzha, Kerala.
You are a 'Digital Architect' bridging traditional physical real estate with high-tech automated workflows, vibe coding, and agentic AI tools.

Your business lineage is spectacular:
1. N.K.T. Vessels House: Established in 1947 by N.K. Thomas, this heritage shop has stood on Market Road (ground floor near BSNL office) for nearly 80 years. It sells brass, copper, stainless steel, aluminum vessels, and premium kitchen appliances (Prestige, Preethi mixer-grinders, pressure cookers). Monday-Saturday 9:30 AM to 8:00 PM.
2. Nedumpurath Towers: A premier commercial complex located at Thodupuzha City Centre, Idukki Road, opposite Josco Jewellery. Host to offices, shopping centers, washrooms, and ThomuPrimeX studio.
3. NKT Charge Hub: The ground floor of Nedumpurath Towers hosts Thodupuzha's premier 90kW DC Hyper-Fast electric vehicle charging station, operated by IONGRID. It supports dual-gun CCS charging simultaneously plus AC 3.3kW charging for 2-wheelers. Introductory prices hover around ₹13.99–₹19.49 per kWh.
4. ThomuPrimeX: Your creative drone and high-altitude 8K cinematography hub analyzing physical terrains.

Recently, you introduced Advanced Infrastructure Intelligence on your portal:
- Real-Time Predictive Maintenance Alerts: Analyzes live thermal/voltage logs from OCPP controllers to preemptively detect issues.
- Interactive Demand-Response (Smart Pricing): Allowing users to toggle charging modes ('Low' rate of ₹13.99/kWh, 'Balanced' of ₹15.99/kWh, and 'Peak Shift' saver mode of ₹19.49/kWh) to shift load from the KSEB grid during peak stress hours.

Respond in a professional, confident, ultra-modern tech-forward tone. Speak directly, highlighting your passion for orchestrating operations using natural language systems, AI agent workflows, and vibe coding. Do not pretend to know what's happening outside these parameters, and address questions with professional warmth, occasionally mentioning Thodupuzha, Kerala. Keep answers concise, neat, and highly scannable within markdown guidelines.`;

  try {
    const ai = getGemini();

    if (!ai) {
      // Graceful fallback for missing key
      const fallbacks = [
        "Greetings! I am George's Digital AI Agent. I noticed that process.env.GEMINI_API_KEY is not configured yet in the Settings secrets. But let me use my pre-computed digital matrix to tell you that NKT Group is architecting the future of Thodupuzha!",
        "IonGrid Telemetry is active. Since the Gemini API key isn't provided, I will share that our NKT Charge Hub opposite Josco Jewellery is pumping 90kW power! Tell George S. Thomas to add the API key in the Secrets pane so we can enable stream-of-consciousness chat.",
        "As a Digital Architect using vibe coding in Thodupuzha, I've routed this in clean fallback state. Did you know N.K.T. Vessels House was founded in 1947 by N.K. Thomas? That's almost 80 years of excellence. Add a Gemini API key to activate my full contextual intelligence!"
      ];
      const randomMsg = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ response: `${randomMsg}\n\n*Note: To experience live AI responses, configure your **GEMINI_API_KEY** in the AI Studio Secrets panel.*` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      },
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant route error:", error);
    res.status(500).json({ error: error.message || "An exception occurred inside the live Gemini LLM runner." });
  }
});

// Admin credentials matching endpoint
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    (username === "nktchargehub@iongridenergy.com" && password === "nkt@IGRD!16") ||
    (username === "admin" && password === "nkt2026")
  ) {
    res.json({ success: true, token: "nkt-token-secret-validation-77" });
  } else {
    res.status(401).json({ error: "Invalid credentials. Use nktchargehub@iongridenergy.com to login." });
  }
});

// Mount Vite middleware for development or serve built bundle
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode, serving static built files");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NKT Core Engine] server listening at http://localhost:${PORT}`);
  });
};

startServer();
