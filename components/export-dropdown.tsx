"use client";

import { useState } from "react";
import { Download, FileText, FileJson, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  convertToCsv,
  generateFilename,
  downloadFile,
} from "@/lib/utils/csv-export";

interface ExportDropdownProps {
  data: Record<string, any>[];
  currentVersion?: number;
  disabled?: boolean;
}

export function ExportDropdown({
  data,
  currentVersion,
  disabled = false,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportJson = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some data to the table before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const filename = generateFilename("table-data", "json", currentVersion);
      downloadFile(jsonString, filename, "application/json");

      toast({
        title: "Export successful",
        description: `JSON file "${filename}" has been downloaded`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("JSON export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export JSON file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some data to the table before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvContent = convertToCsv(data, {
        delimiter: ",",
        includeHeaders: true,
        escapeQuotes: true,
      });
      const filename = generateFilename("table-data", "csv", currentVersion);
      downloadFile(csvContent, filename, "text/csv");

      toast({
        title: "Export successful",
        description: `CSV file "${filename}" has been downloaded`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("CSV export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
          <FileJson className="mr-2 h-4 w-4" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
