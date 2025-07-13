import { redirect } from "next/navigation";

export default function ToolsPage() {
  // Redirect to the SQL converter by default
  redirect("/tools/spreadsheet-to-sql-values");
}
