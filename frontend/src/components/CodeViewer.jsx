import React from "react";

export default function CodeViewer({ code = "", className = "", style = {} }) {
  const escaped = String(code).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return (
    <div className={className} style={{ fontFamily: "Consolas, monospace", fontSize: 14, ...style }}>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f8fa", padding: 16, borderRadius: 6, overflowX: "auto" }}>
        <code dangerouslySetInnerHTML={{ __html: escaped }} />
      </pre>
    </div>
  );
}
