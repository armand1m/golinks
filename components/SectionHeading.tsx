export function SectionHeading({
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className="text-xl font-semibold border-b pb-2" {...props}>
      {children}
    </h2>
  );
}
