export function InlineCode({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
      {children}
    </code>
  );
}
