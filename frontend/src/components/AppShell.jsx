export default function AppShell({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(165deg, #EEF4F2 0%, #E4EEF6 55%, #F2ECF6 100%)",
        backgroundAttachment: "fixed",
        color: "#0F2733",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1360px]">{children}</div>
    </div>
  );
}
