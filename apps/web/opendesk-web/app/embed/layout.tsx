export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ background: "transparent" }}>
      {children}
    </div>
  )
}