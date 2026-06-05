import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "0.02em",
            }}
          >
            中国股市编年史
          </span>
          <span
            style={{
              marginLeft: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            History of China Market
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
