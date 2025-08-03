import ConnectedHeader from "@/components/Header/ConnectedHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConnectedHeader />
      {children}
    </>
  );
}
