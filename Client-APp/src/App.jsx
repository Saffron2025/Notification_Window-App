import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "PC-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

export default function App() {
  const [savedName, setSavedName] = useState(null);
  const [tempName, setTempName] = useState("");
  const [connected, setConnected] = useState(false);

  const deviceId = getDeviceId();

  useEffect(() => {
    const name = localStorage.getItem("clientName");
    if (name) setSavedName(name);
  }, []);

  useEffect(() => {
    if (!savedName) return;

    const socket = io("https://notification-window-app-backend.onrender.com");

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register", {
        deviceId,
        name: savedName,
        pcName: navigator.userAgent,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("message", (d) => {
      window.api.notify({
        title: d.meta.from || "Message",
        body: d.message,
      });

      if (d.meta.speak) {
        try {
          const voice = new SpeechSynthesisUtterance(d.message);
          speechSynthesis.speak(voice);
        } catch (e) {}
      }
    });

    const hb = setInterval(() => socket.emit("heartbeat"), 30000);

    return () => {
      clearInterval(hb);
      socket.disconnect();
    };
  }, [savedName, deviceId]);

  const saveNameFunc = () => {
    if (!tempName.trim()) return alert("Please enter your name!");
    localStorage.setItem("clientName", tempName);
    setSavedName(tempName);
  };

  /* -------------------------------------------------
       FIRST SCREEN: ENTER NAME
  ------------------------------------------------- */
  if (!savedName) {
    return (
      <div className="center-screen">
        <div className="name-box">
          <h1 className="title">Notification Client</h1>
          <p className="subtitle">Please enter your name to continue</p>

          <input
            className="input"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Enter your name..."
          />

          <button className="button" onClick={saveNameFunc}>
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------
       MAIN WINDOWS-STYLE UI
  ------------------------------------------------- */

  return (
    <div className="window-frame">

      {/* TOP TITLE BAR */}
      <div className="title-bar">
        <span className="title-text">Notification Client</span>

        <div className="win-buttons">
          <div className="win-btn">—</div>
          <div className="win-btn win-close">✖</div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="page">

        <h1 className="main-heading">Cyber Safety & Fraud Protection</h1>
        <p className="sub-heading">Simple English guide — designed for elders</p>

        <div className="status-box">
          <span className="user-pill">👤 {savedName}</span>
          <span className={`status-pill ${connected ? "online" : "offline"}`}>
            ● {connected ? "Online" : "Reconnecting..."}
          </span>
        </div>

        <div className="info-box">
          <h2 className="section-title">Complete Cyber Safety, Fraud Prevention & Awareness Guide</h2>

          <ul className="list">

            {/* 1. BASIC */}
            <h3 className="sub-title">🔐 BASIC SAFETY RULES</h3>
            <li>Never share OTP, PIN or Password — even with the bank.</li>
            <li>“Share OTP for verification” is 100% fraud.</li>
            <li>Scanning any QR code ALWAYS sends money.</li>
            <li>Do not click unknown links in SMS/WhatsApp.</li>
            <li>Never share personal details with unknown callers.</li>
            <li>Do not allow screen-share to strangers.</li>
            <li>Always enable 2-step verification.</li>
            <li>Never send Aadhaar or PAN to anyone.</li>
            <li>Fake customer care numbers appear on Google — always check official site.</li>

            {/* 2. PARCEL */}
            <h3 className="sub-title">📦 PARCEL / COURIER FRAUD</h3>
            <li>“Customs hold your parcel” messages are 99% fake.</li>
            <li>Delivery agents never ask for bank details.</li>
            <li>Fake tracking sites are common.</li>

            {/* 3. LOAN */}
            <h3 className="sub-title">💰 LOAN SCAMS</h3>
            <li>“Instant loan approved” WhatsApp is fraud.</li>
            <li>Asking for fees before loan approval = scam.</li>
            <li>Fake loan apps steal contacts & photos.</li>

            {/* 4. BANK */}
            <h3 className="sub-title">🏦 BANK FRAUD</h3>
            <li>Banks never ask for your password or OTP.</li>
            <li>“Your account is blocked” messages are phishing.</li>
            <li>Refund calls asking OTP are fake.</li>

            {/* 5. UPI */}
            <h3 className="sub-title">💳 UPI & QR CODE SCAMS</h3>
            <li>Never scan a QR code to receive money.</li>
            <li>“Scan to get refund” is fraud.</li>
            <li>Fake UPI apps divert money.</li>

            {/* 6. WHATSAPP */}
            <h3 className="sub-title">📱 WHATSAPP FRAUD</h3>
            <li>Fake profile pictures and documents are common.</li>
            <li>“You won iPhone” messages are scams.</li>
            <li>Deepfake voice scams increasing.</li>

            {/* 7. SOCIAL */}
            <h3 className="sub-title">🌐 SOCIAL MEDIA FRAUD</h3>
            <li>Giveaway scams like “Pay ₹50 to claim AirPods”.</li>
            <li>Fake Facebook Marketplace sellers.</li>
            <li>Work-from-home typing jobs are mostly scams.</li>

            {/* 8. ROMANCE */}
            <h3 className="sub-title">❤️ ROMANCE SCAMS</h3>
            <li>Scammers use fake photos and emotional stories.</li>
            <li>Emergency money requests are fake.</li>

            {/* 9. SENIORS */}
            <h3 className="sub-title">👵 SENIOR CITIZEN TARGET SCAMS</h3>
            <li>Pension verification calls are fake.</li>
            <li>Fake hospital bill collection calls.</li>

            {/* 10. INVESTMENT */}
            <h3 className="sub-title">📈 INVESTMENT SCAMS</h3>
            <li>“Double your money in 10 days” is fraud.</li>
            <li>Fake crypto schemes.</li>
            <li>Fake stock market experts.</li>

            {/* 11. TECH SUPPORT */}
            <h3 className="sub-title">🖥 TECH SUPPORT SCAMS</h3>
            <li>Fake pop-ups claiming your computer has a virus.</li>
            <li>Microsoft/Google never call you directly.</li>

            {/* 12. ATM */}
            <h3 className="sub-title">💳 ATM / CARD FRAUD</h3>
            <li>Skimming devices clone your card.</li>
            <li>Never share CVV.</li>

            {/* 13. PHONE */}
            <h3 className="sub-title">📞 PHONE SCAMS</h3>
            <li>Caller ID can be faked.</li>
            <li>Voice phishing is common.</li>

            {/* 14. SAFETY */}
            <h3 className="sub-title">🧠 REAL LIFE SAFETY</h3>
            <li>Always verify with family.</li>
            <li>Scammers create urgency & fear.</li>

            {/* 15. RED FLAGS */}
            <h3 className="sub-title">🚨 RED FLAGS IN ALL SCAMS</h3>
            <li>Urgency pressure</li>
            <li>Asking for fees first</li>
            <li>Unexpected reward</li>
            <li>OTP request</li>
            <li>Unknown links</li>
            <li>Fake ID cards</li>
            <li>Foreign numbers</li>

          </ul>

          <p className="footer">
            Stay alert. Stay safe.<br />
            Cyber Crime Helpline: 1930<br />
            Report Online: cybercrime.gov.in
          </p>

        </div>
      </div>
    </div>
  );
}
