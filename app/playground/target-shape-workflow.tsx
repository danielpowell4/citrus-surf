"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowRight, ArrowLeft, Save, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  saveTargetShapeAsync,
  updateTargetShape,
} from "@/lib/features/targetShapesSlice";
import { generateShapeId, generateFieldId } from "@/lib/utils/id-generator";
import { analyzeDataForTargetShape } from "@/lib/utils/data-analysis";
import type {
  TargetShape,
  TargetField,
  FieldType,
  LookupField,
  LookupMatch,
  SmartMatching,
  DerivedField,
} from "@/lib/types/target-shapes";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectReferenceFilesList, uploadFileStart, uploadFileSuccess, uploadFileError } from "@/lib/features/referenceDataSlice";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import { generateReferenceId } from "@/lib/types/reference-data-types";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WorkflowStepProps>;
}

interface WorkflowStepProps {
  data: TargetShape;
  onUpdate: (updates: Partial<TargetShape>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  onShapeCreated?: (shape: TargetShape) => void;
  isEditMode?: boolean;
}

// Step 1: Basic Information
const BasicInfoStep: React.FC<WorkflowStepProps> = ({
  data,
  onUpdate,
  onNext,
  _isFirst,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Shape Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="e.g., Customer Database, Product Catalog"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Describe what this target shape is for..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-1 w-full justify-start">
                  {data.metadata?.category || "Select category"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "customer" },
                    })
                  }
                >
                  Customer Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "product" },
                    })
                  }
                >
                  Product Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "financial" },
                    })
                  }
                >
                  Financial Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "inventory" },
                    })
                  }
                >
                  Inventory Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "analytics" },
                    })
                  }
                >
                  Analytics Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate({
                      metadata: { ...data.metadata, category: "custom" },
                    })
                  }
                >
                  Custom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={data.version}
              onChange={e => onUpdate({ version: e.target.value })}
              placeholder="1.0.0"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={data.metadata?.tags?.join(", ") || ""}
            onChange={e =>
              onUpdate({
                metadata: {
                  ...data.metadata,
                  tags: e.target.value.split(",").map(tag => tag.trim()),
                },
              })
            }
            placeholder="Enter tags separated by commas"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!data.name.trim()}>
          Next: Define Fields
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Step 2: Field Definition
const FieldsStep: React.FC<WorkflowStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [editingField, setEditingField] = useState<TargetField | null>(null);
  const [showAddField, setShowAddField] = useState(false);

  const addField = () => {
    const newField: TargetField = {
      id: generateFieldId(),
      name: "",
      type: "string",
      required: false,
      description: "",
      validation: [],
      transformation: [],
    };
    onUpdate({
      fields: [...data.fields, newField],
    });
    setEditingField(newField);
    setShowAddField(false);
  };

  const updateField = (fieldId: string, updates: Partial<TargetField>) => {
    const updatedFields = data.fields.map(field => {
      if (field.id === fieldId) {
        const updatedField = { ...field, ...updates };
        
        // If changing to lookup type, initialize lookup-specific properties
        if (updates.type === 'lookup' && field.type !== 'lookup') {
          const lookupField: LookupField = {
            ...updatedField,
            type: 'lookup',
            referenceFile: '',
            match: { on: '', get: '' },
            smartMatching: { enabled: false, confidence: 0.8 },
            onMismatch: 'error',
            alsoGet: [],
            showReferenceInfo: true,
            allowReferenceEdit: false,
          };
          return lookupField;
        }
        
        return updatedField;
      }
      return field;
    });
    onUpdate({ fields: updatedFields });
  };

  const removeField = (fieldId: string) => {
    const updatedFields = data.fields.filter(field => field.id !== fieldId);
    onUpdate({ fields: updatedFields });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Define Fields</h3>
          <p className="text-sm text-muted-foreground">
            Add the fields that should be in your clean data output
          </p>
        </div>
        <Button onClick={() => setShowAddField(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      {showAddField && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Add Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  addField();
                  updateField(data.fields[data.fields.length - 1]?.id || "", {
                    name: "id",
                    type: "string",
                    required: true,
                    description: "Unique identifier",
                  });
                }}
              >
                ID Field
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  addField();
                  updateField(data.fields[data.fields.length - 1]?.id || "", {
                    name: "email",
                    type: "email",
                    required: true,
                    description: "Email address",
                  });
                }}
              >
                Email Field
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  addField();
                  updateField(data.fields[data.fields.length - 1]?.id || "", {
                    name: "name",
                    type: "string",
                    required: true,
                    description: "Name",
                  });
                }}
              >
                Name Field
              </Button>
            </div>
            <Button variant="outline" onClick={() => setShowAddField(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {data.fields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            onUpdate={updates => updateField(field.id, updates)}
            onRemove={() => removeField(field.id)}
            isEditing={editingField?.id === field.id}
            onEdit={() => setEditingField(field)}
            onCancel={() => setEditingField(null)}
          />
        ))}
      </div>

      {data.fields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No fields defined yet. Add your first field to get started.
            </p>
            <Button onClick={() => setShowAddField(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Field
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={data.fields.length === 0}>
          Next: Review & Save
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Step 3: Review and Save
const ReviewStep: React.FC<WorkflowStepProps> = ({
  data,
  onBack,
  _isLast,
  onShapeCreated,
  isEditMode,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const referenceFiles = useAppSelector(selectReferenceFilesList);

  const handleSave = async () => {
    try {
      if (isEditMode) {
        // Update existing shape
        dispatch(
          updateTargetShape({
            id: data.id,
            updates: {
              ...data,
              updatedAt: new Date().toISOString(),
            },
          })
        );
        toast({
          title: "Target Shape Updated",
          description: `"${data.name}" has been updated successfully.`,
        });
        
        // Call the callback if provided  
        if (onShapeCreated) {
          onShapeCreated(data);
        }
      } else {
        // Create new shape using async thunk to get the saved shape with correct ID
        const result = await dispatch(saveTargetShapeAsync(data));
        
        if (saveTargetShapeAsync.fulfilled.match(result)) {
          const savedShape = result.payload;
          
          toast({
            title: "Target Shape Saved",  
            description: `"${savedShape.name}" has been saved successfully.`,
          });
          
          // Call the callback with the saved shape (which has the correct ID)
          if (onShapeCreated) {
            onShapeCreated(savedShape);
          }
        } else {
          throw new Error("Failed to save shape");
        }
      }
    } catch {
      toast({
        title: isEditMode ? "Update Failed" : "Save Failed",
        description: `Failed to ${isEditMode ? "update" : "save"} target shape. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review Your Target Shape</h3>
        <p className="text-sm text-muted-foreground">
          Review the details before saving your target shape
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="font-medium">{data.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <p className="text-sm">{data.description || "No description"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Category
                </Label>
                <Badge variant="secondary">
                  {data.metadata?.category || "custom"}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Version</Label>
                <p className="text-sm">{data.version}</p>
              </div>
            </div>
            {data.metadata?.tags && data.metadata.tags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.metadata.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fields Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Fields ({data.fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.fields.map(field => {
                const isLookupField = field.type === 'lookup';
                const lookupField = isLookupField ? field as LookupField : null;
                const referenceFile = lookupField ? referenceFiles.find(ref => ref.id === lookupField.referenceFile) : null;
                
                return (
                  <div
                    key={field.id}
                    className="p-3 border rounded space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{field.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {field.type} {field.required && "• Required"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {field.validation && field.validation.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {field.validation.length} rules
                          </Badge>
                        )}
                        {field.transformation &&
                          field.transformation.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {field.transformation.length} transforms
                            </Badge>
                          )}
                      </div>
                    </div>
                    
                    {/* Lookup Field Details */}
                    {isLookupField && lookupField && (
                      <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Reference:</span>
                          <span className="font-medium">
                            {referenceFile ? referenceFile.filename : 'Not configured'}
                          </span>
                        </div>
                        {lookupField.match && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Match:</span>
                            <span className="font-mono">
                              {lookupField.match.on} → {lookupField.match.get}
                            </span>
                          </div>
                        )}
                        {lookupField.smartMatching?.enabled && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Fuzzy matching:</span>
                            <span>
                              {((lookupField.smartMatching.confidence || 0.8) * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                        )}
                        {lookupField.alsoGet && lookupField.alsoGet.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Derived columns:</span>
                            <span>
                              {lookupField.alsoGet.map(d => d.name).filter(n => n).join(', ') || 'None'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Update Target Shape" : "Save Target Shape"}
        </Button>
      </div>
    </div>
  );
};

// Lookup Configuration Component
interface LookupConfigurationProps {
  field: LookupField;
  onUpdate: (updates: Partial<LookupField>) => void;
}

const LookupConfiguration: React.FC<LookupConfigurationProps> = ({
  field,
  onUpdate,
}) => {
  const dispatch = useAppDispatch();
  const referenceFiles = useAppSelector(selectReferenceFilesList);
  const selectedReference = referenceFiles.find(ref => ref.id === field.referenceFile);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleReferenceSelect = (referenceId: string) => {
    const reference = referenceFiles.find(ref => ref.id === referenceId);
    if (reference) {
      onUpdate({
        referenceFile: referenceId,
        match: {
          on: reference.columns[0] || '',
          get: reference.columns[0] || '',
        },
      });
    }
  };

  const handleMatchConfigUpdate = (updates: Partial<LookupMatch>) => {
    onUpdate({
      match: { ...field.match, ...updates },
    });
  };

  const handleSmartMatchingUpdate = (updates: Partial<SmartMatching>) => {
    onUpdate({
      smartMatching: { ...field.smartMatching, ...updates },
    });
  };

  const handleAddDerivedField = () => {
    const newDerivedField: DerivedField = {
      name: '',
      source: selectedReference?.columns[0] || '',
    };
    onUpdate({
      alsoGet: [...(field.alsoGet || []), newDerivedField],
    });
  };

  const handleUpdateDerivedField = (index: number, updates: Partial<DerivedField>) => {
    const updatedDerived = (field.alsoGet || []).map((derived, i) =>
      i === index ? { ...derived, ...updates } : derived
    );
    onUpdate({ alsoGet: updatedDerived });
  };

  const handleRemoveDerivedField = (index: number) => {
    const updatedDerived = (field.alsoGet || []).filter((_, i) => i !== index);
    onUpdate({ alsoGet: updatedDerived });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const referenceId = generateReferenceId(file.name.split('.')[0]);
    
    try {
      dispatch(uploadFileStart({ filename: file.name }));
      
      const info = await referenceDataManager.uploadReferenceFile(file, referenceId);
      
      dispatch(uploadFileSuccess({ info }));
      
      // Auto-select the newly uploaded file
      handleReferenceSelect(referenceId);
      
    } catch (error) {
      dispatch(uploadFileError({ 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <Label className="text-sm font-medium">Lookup Configuration</Label>
        <p className="text-xs text-muted-foreground">
          Configure how this field matches against reference data
        </p>
      </div>

      {/* Reference File Selection */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="reference-file">Reference Data File</Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Plus className="mr-2 h-3 w-3" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mt-1 w-full justify-start">
              {selectedReference ? selectedReference.filename : "Select reference file"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {referenceFiles.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No reference files available. Upload reference data first.
              </div>
            ) : (
              referenceFiles.map(ref => (
                <DropdownMenuItem
                  key={ref.id}
                  onClick={() => handleReferenceSelect(ref.id)}
                >
                  <div>
                    <p className="font-medium">{ref.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {ref.rowCount} rows, {ref.columns.length} columns
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedReference && (
        <>
          {/* Match Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="match-on">Match On Column</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="mt-1 w-full justify-start">
                    {field.match?.on || "Select column"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {selectedReference.columns.map(column => (
                    <DropdownMenuItem
                      key={column}
                      onClick={() => handleMatchConfigUpdate({ on: column })}
                    >
                      {column}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Label htmlFor="match-get">Return Column</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="mt-1 w-full justify-start">
                    {field.match?.get || "Select column"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {selectedReference.columns.map(column => (
                    <DropdownMenuItem
                      key={column}
                      onClick={() => handleMatchConfigUpdate({ get: column })}
                    >
                      {column}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Smart Matching Settings */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="smart-matching"
                checked={field.smartMatching?.enabled || false}
                onCheckedChange={enabled => handleSmartMatchingUpdate({ enabled })}
              />
              <Label htmlFor="smart-matching">Enable fuzzy matching</Label>
            </div>

            {field.smartMatching?.enabled && (
              <div>
                <Label htmlFor="confidence-threshold">
                  Confidence Threshold: {((field.smartMatching?.confidence || 0.8) * 100).toFixed(0)}%
                </Label>
                <input
                  type="range"
                  id="confidence-threshold"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={field.smartMatching?.confidence || 0.8}
                  onChange={e => handleSmartMatchingUpdate({ confidence: parseFloat(e.target.value) })}
                  className="mt-1 w-full"
                />
              </div>
            )}
          </div>

          {/* Mismatch Behavior */}
          <div>
            <Label htmlFor="mismatch-behavior">On Mismatch</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-1 w-full justify-start">
                  {field.onMismatch === 'error' ? 'Show Error' : 
                   field.onMismatch === 'warning' ? 'Show Warning' : 'Set to Null'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onUpdate({ onMismatch: 'error' })}>
                  Show Error
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ onMismatch: 'warning' })}>
                  Show Warning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ onMismatch: 'null' })}>
                  Set to Null
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Derived Fields */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Additional Columns to Include</Label>
              <Button variant="outline" size="sm" onClick={handleAddDerivedField}>
                <Plus className="mr-2 h-3 w-3" />
                Add Column
              </Button>
            </div>
            
            {field.alsoGet && field.alsoGet.length > 0 && (
              <div className="space-y-2 mt-2">
                {field.alsoGet.map((derived, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Column name"
                      value={derived.name}
                      onChange={e => handleUpdateDerivedField(index, { name: e.target.value })}
                      className="flex-1"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {derived.source || "Select source"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {selectedReference.columns.map(column => (
                          <DropdownMenuItem
                            key={column}
                            onClick={() => handleUpdateDerivedField(index, { source: column })}
                          >
                            {column}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemoveDerivedField(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Field Editor Component
interface FieldEditorProps {
  field: TargetField;
  onUpdate: (updates: Partial<TargetField>) => void;
  onRemove: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: "string", label: "Text" },
    { value: "number", label: "Number" },
    { value: "integer", label: "Integer" },
    { value: "decimal", label: "Decimal" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "Date & Time" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "currency", label: "Currency" },
    { value: "percentage", label: "Percentage" },
    { value: "enum", label: "Enum" },
    { value: "lookup", label: "Lookup" },
  ];

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Edit Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
              <Input
                id={`field-name-${field.id}`}
                value={field.name}
                onChange={e => onUpdate({ name: e.target.value })}
                placeholder="e.g., customer_id, email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`field-type-${field.id}`}>Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="mt-1 w-full justify-start"
                  >
                    {fieldTypes.find(t => t.value === field.type)?.label ||
                      "Select type"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {fieldTypes.map(type => (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() => onUpdate({ type: type.value })}
                    >
                      {type.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <Label htmlFor={`field-description-${field.id}`}>Description</Label>
            <Textarea
              id={`field-description-${field.id}`}
              value={field.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Describe what this field contains..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={`field-required-${field.id}`}
              checked={field.required}
              onCheckedChange={checked => onUpdate({ required: checked })}
            />
            <Label htmlFor={`field-required-${field.id}`}>Required field</Label>
          </div>

          {/* Lookup Configuration */}
          {field.type === 'lookup' && (
            <LookupConfiguration
              field={field as LookupField}
              onUpdate={onUpdate}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onCancel}>Done</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium">{field.name}</p>
              <p className="text-sm text-muted-foreground">
                {field.type} {field.required && "• Required"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Workflow Component
interface TargetShapeWorkflowProps {
  importedData?: any[]; // Optional imported data for analysis
  initialShape?: TargetShape; // Optional initial shape for editing
  onShapeCreated?: (shape: TargetShape) => void; // Callback when shape is created
  onCancel?: () => void; // Callback when user cancels the workflow
}

export const TargetShapeWorkflow: React.FC<TargetShapeWorkflowProps> = ({
  importedData = [],
  initialShape,
  onShapeCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [shapeData, setShapeData] = useState<TargetShape>(() => {
    // If editing an existing shape, use it as initial data
    if (initialShape) {
      return initialShape;
    }

    // Initialize with data analysis if imported data is provided
    if (importedData.length > 0) {
      const analysis = analyzeDataForTargetShape(importedData);
      return {
        id: generateShapeId(),
        name: `Shape from ${importedData.length} records`,
        description: `Auto-generated shape from imported data with ${analysis.suggestedFields.length} fields`,
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: analysis.suggestedFields,
        metadata: {
          category: "custom",
          tags: ["auto-generated"],
          usage: "data-import",
        },
      };
    }

    // Default empty shape
    return {
      id: generateShapeId(),
      name: "",
      description: "",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [],
      metadata: {
        category: "custom",
        tags: [],
        usage: "data-import",
      },
    };
  });

  // Always warn user before leaving the form
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
      return ''; // Required for other browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const steps: WorkflowStep[] = [
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Define the name and basic details of your target shape",
      component: BasicInfoStep,
    },
    {
      id: "fields",
      title: "Define Fields",
      description: "Add the fields that should be in your clean data output",
      component: FieldsStep,
    },
    {
      id: "review",
      title: "Review & Save",
      description: "Review your target shape and save it",
      component: ReviewStep,
    },
  ];

  const handleUpdate = (updates: Partial<TargetShape>) => {
    setShapeData(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleShapeSaved = (shape: TargetShape) => {
    // Call the original callback
    if (onShapeCreated) {
      onShapeCreated(shape);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Progress and Cancel */}
      <div className="flex items-center justify-between">
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <Separator />

      {/* Current Step Content */}
      <CurrentStepComponent
        data={shapeData}
        onUpdate={handleUpdate}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={currentStep === 0}
        isLast={currentStep === steps.length - 1}
        onShapeCreated={handleShapeSaved}
        isEditMode={!!initialShape}
      />
    </div>
  );
};
