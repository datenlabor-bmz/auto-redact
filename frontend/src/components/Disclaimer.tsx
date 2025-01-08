import * as React from "react";

interface DisclaimerProps {
  onClose: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onClose }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff3cd",
        color: "#856404",
        padding: "12px",
        textAlign: "center",
        borderBottom: "1px solid #ffeeba",
        fontSize: "14px",
        position: "relative",
      }}
    >
      <span role="img" aria-label="warning">
        ⚠️
      </span>
      <strong>DISCLAIMER</strong>: This software is currently in development
      and not yet ready for production use. Use at your own risk and always
      verify redactions manually.
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#856404",
          padding: "5px",
        }}
        aria-label="Close disclaimer"
      >
        ×
      </button>
    </div>
  );
}; 