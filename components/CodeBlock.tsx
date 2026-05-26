export function CodeBlock({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
      <code>{children}</code>
    </pre>
  );
}
