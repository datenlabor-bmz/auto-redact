import * as React from "react";

export function RedactionHints() {
  return (
    <div
      style={{
        padding: "1.25rem",
        backgroundColor: "#fff",
        borderRadius: "8px",
        fontSize: "0.85rem",
        color: "#1e293b",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ marginBottom: "0.75rem", fontWeight: "600" }}>
        💡 How to create redactions:
      </div>
      <ul
        style={{
          margin: "0",
          paddingLeft: "1.2rem",
          lineHeight: "1.4",
        }}
      >
        <li>Select text with your mouse to redact specific content</li>
        <li>Hold Alt and drag to redact rectangular areas</li>
        <li>All highlights will be converted to redactions when saving</li>
      </ul>
    </div>
  );
}
