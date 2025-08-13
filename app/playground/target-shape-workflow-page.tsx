"use client";

import { TargetShapeWorkflow } from "./target-shape-workflow";
import { DataAnalysisTest } from "./data-analysis-test";

import { Card, CardContent } from "@/components/ui/card";

export default function TargetShapeWorkflowPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Target Shape Workflow</h1>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Data Analysis Test</h2>
          <DataAnalysisTest />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Target Shape Workflow</h2>
          <Card>
            <CardContent>
              <TargetShapeWorkflow />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
