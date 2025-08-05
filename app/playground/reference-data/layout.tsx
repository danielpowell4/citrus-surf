import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reference Data Management - Citrus Surf Importer",
  description: "Manage reference files used by lookup fields. Upload, view, edit, and organize your lookup data.",
};

export default function ReferenceDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}