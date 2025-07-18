import { redirect } from "next/navigation";

export default function ToolsPage() {
  // Redirect to the SQL converter by default
  redirect("/"); // move original home page here when "actual" landing page viable
}
