"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Database, ArrowRight, Download, FileText } from 'lucide-react';
import { getAllDemoTemplates, generateSampleInputData, type DemoTemplate } from '@/lib/utils/demo-reference-templates';

interface DemoTemplateSelectorProps {
  onTemplateSelect: (template: DemoTemplate) => void;
  trigger?: React.ReactNode;
}

export function DemoTemplateSelector({ 
  onTemplateSelect, 
  trigger 
}: DemoTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DemoTemplate | null>(null);
  
  const templates = getAllDemoTemplates();

  const handleTemplateSelect = (template: DemoTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Sparkles className="h-4 w-4" />
      Use Demo Data
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Demo Reference Data Templates
          </DialogTitle>
          <DialogDescription>
            Choose from pre-built reference data that's perfect for demos and testing.
            Each template includes realistic data and suggested lookup configurations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <TemplateCard 
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: DemoTemplate;
  onSelect: (template: DemoTemplate) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const sampleInput = generateSampleInputData(template.id);
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{template.name}</span>
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          {template.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Data preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Sample Data:</div>
          <div className="bg-muted/30 rounded p-2 text-xs">
            <div className="font-mono">
              {Object.keys(template.data[0]).slice(0, 4).join(' | ')}
              {Object.keys(template.data[0]).length > 4 && ' | ...'}
            </div>
            <div className="font-mono text-muted-foreground mt-1">
              {Object.values(template.data[0]).slice(0, 4).map(v => String(v).slice(0, 12)).join(' | ')}
              {Object.keys(template.data[0]).length > 4 && ' | ...'}
            </div>
          </div>
        </div>
        
        {/* Suggested lookup */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Popular Lookup:</div>
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded p-2">
            <div className="flex items-center gap-2 text-xs">
              <Database className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-foreground">{template.suggestedLookups[0].matchOn}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-foreground">{template.suggestedLookups[0].returnField}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              + {template.suggestedLookups[0].alsoGet.length} derived columns
            </div>
          </div>
        </div>
        
        {/* Sample input data */}
        {sampleInput.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Works Great With:</div>
            <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded p-2 text-xs text-foreground">
              Sample input data with {Object.keys(sampleInput[0]).join(', ')} columns
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="flex gap-2">
          <Button 
            onClick={() => onSelect(template)}
            size="sm" 
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-2" />
            Use This Template
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <FileText className="h-3 w-3 mr-2" />
            {showPreview ? 'Hide' : 'Preview'}
          </Button>
        </div>
        
        {showPreview && (
          <div className="mt-3 p-3 bg-muted/20 rounded border text-xs">
            <div className="font-medium mb-2">Full Data Preview:</div>
            <div className="max-h-32 overflow-y-auto">
              <pre className="text-xs">
                {JSON.stringify(template.data.slice(0, 3), null, 2)}
              </pre>
            </div>
            {template.data.length > 3 && (
              <div className="text-muted-foreground mt-2">
                ... and {template.data.length - 3} more rows
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}