"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analyzeDataForTargetShape } from "@/lib/utils/data-analysis";

export function DataAnalysisTest() {
  const [testData, setTestData] = useState(`[
  {
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "email": "john.doe@example.com",
    "department": "Engineering",
    "salary": 75000,
    "status": "Active"
  },
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "age": 28,
    "email": "jane.smith@example.com",
    "department": "Marketing",
    "salary": 65000,
    "status": "Active"
  },
  {
    "firstName": "Bob",
    "lastName": "Johnson",
    "age": 35,
    "email": "bob.johnson@example.com",
    "department": "Sales",
    "salary": 70000,
    "status": "Inactive"
  }
]`);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = () => {
    try {
      const data = JSON.parse(testData);
      const result = analyzeDataForTargetShape(data);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Test Data (JSON)</label>
            <Textarea
              value={testData}
              onChange={e => setTestData(e.target.value)}
              className="mt-1 font-mono text-sm"
              rows={10}
            />
          </div>
          <Button onClick={handleAnalyze}>Analyze Data</Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Data Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Row Count:</span>
                  <span className="ml-2 font-medium">
                    {analysis.dataSummary.rowCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fields:</span>
                  <span className="ml-2 font-medium">
                    {analysis.suggestedFields.length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Suggested Fields</h3>
              <div className="space-y-2">
                {analysis.suggestedFields.map((field: any) => (
                  <div key={field.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{field.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{field.type}</Badge>
                        {field.required && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {field.description}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Unique values:{" "}
                      {analysis.dataSummary.uniqueValues[field.name] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Sample Values</h3>
              <div className="space-y-2">
                {Object.entries(analysis.dataSummary.sampleValues).map(
                  ([key, values]: [string, any]) => (
                    <div key={key} className="p-2 border rounded text-sm">
                      <span className="font-medium">{key}:</span>
                      <span className="ml-2 text-muted-foreground">
                        {Array.isArray(values)
                          ? values.slice(0, 3).join(", ")
                          : values}
                        {Array.isArray(values) && values.length > 3 && "..."}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
