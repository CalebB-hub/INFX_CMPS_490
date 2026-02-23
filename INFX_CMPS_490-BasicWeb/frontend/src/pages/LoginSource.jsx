import React from "react";
import CodeViewer from "../components/CodeViewer";
import loginSource from "./Login.jsx?raw";

export default function LoginSource() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Login.jsx source</h1>
      <CodeViewer code={loginSource} />
    </div>
  );
}
