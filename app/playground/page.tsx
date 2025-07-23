"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Sparkles,
  Wand2,
  FileText,
  Database,
  Table,
  ArrowRight,
  Upload,
} from "lucide-react";
import { setData } from "@/lib/features/tableSlice";
import { DataImport } from "./data-import";

export default function PlaygroundPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data } = useAppSelector(state => state.table);

  const handleImport = (importedData: any[]) => {
    dispatch(setData(importedData));
    // Add a small delay to ensure the data is set before redirecting
    setTimeout(() => {
      router.push("/playground/data-table");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Citrus Surf Playground
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Import, transform, and export your data with ease
          </p>
        </div>

        <div className="space-y-6 max-w-none">
          {/* Main Data Import Section */}
          <DataImport onImport={handleImport} dataCount={data.length} />

          {/* Additional Tools Section */}
          <div className="mt-8">
            <Separator className="my-6" />
            <h2 className="text-lg font-semibold mb-4">Other Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Data Table Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Table className="w-4 h-4" />
                    Data Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-3">
                    View and edit your imported data in an interactive table
                    with sorting and filtering.
                  </p>
                  <Button
                    onClick={() => router.push("/playground/data-table")}
                    size="sm"
                    className="w-full"
                    disabled={data.length === 0}
                  >
                    Open Data Table
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Template Builder Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="w-4 h-4" />
                    Template Builder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-3">
                    Create target shapes and templates to define data structure
                    and validation rules.
                  </p>
                  <Button
                    onClick={() =>
                      router.push("/playground/template-builder?source=scratch")
                    }
                    size="sm"
                    className="w-full"
                  >
                    Create Template
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Coming Soon Card */}
              <Card className="hover:shadow-lg transition-shadow opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="w-4 h-4" />
                    Data Transformations
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-3">
                    Apply transformations, filters, and data cleaning
                    operations.
                  </p>
                  <Button disabled size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
