// src/components/ErrorBoundary.jsx
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(error) {
    return { err: error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ color: "#b91c1c", marginBottom: 8 }}>
            Se produjo un error en la UI
          </h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#fee2e2",
              color: "#7f1d1d",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {String(this.state.err?.stack || this.state.err)}
          </pre>
          <p style={{ marginTop: 12, color: "#374151" }}>
            Revisa la consola del navegador para más detalles.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
