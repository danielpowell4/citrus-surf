"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EnumOption } from "@/lib/types/target-shapes";

export interface EnumConfiguration {
  required: boolean;
  unique: boolean;
  options: EnumOption[];
}

interface EnumOptionsControlProps {
  configuration: EnumConfiguration;
  onUpdate: (config: EnumConfiguration) => void;
}

export const EnumOptionsControl: React.FC<EnumOptionsControlProps> = ({
  configuration,
  onUpdate,
}) => {
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Validation helpers
  const isDuplicateValue = (value: string) => {
    return configuration.options.some(option => option.value === value);
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    
    // Check for duplicate values
    const values = configuration.options.map(opt => opt.value);
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate values: ${[...new Set(duplicates)].join(", ")}`);
    }

    // Check for empty values
    const emptyValues = configuration.options.filter(opt => !opt.value.trim());
    if (emptyValues.length > 0) {
      errors.push(`${emptyValues.length} option(s) have empty values`);
    }

    return errors;
  };

  const addOption = () => {
    if (!newValue.trim()) return;

    if (isDuplicateValue(newValue.trim())) {
      // Don't add duplicate values
      return;
    }

    const newOption: EnumOption = {
      value: newValue.trim(),
      label: newLabel.trim() || newValue.trim(),
    };

    onUpdate({
      ...configuration,
      options: [...configuration.options, newOption],
    });

    setNewValue("");
    setNewLabel("");
  };

  const removeOption = (index: number) => {
    const updatedOptions = configuration.options.filter((_, i) => i !== index);
    onUpdate({
      ...configuration,
      options: updatedOptions,
    });
  };

  const updateOption = (index: number, field: keyof EnumOption, value: string) => {
    const updatedOptions = configuration.options.map((option, i) =>
      i === index ? { ...option, [field]: value } : option
    );
    onUpdate({
      ...configuration,
      options: updatedOptions,
    });
  };

  const updateToggle = (field: keyof Pick<EnumConfiguration, 'required' | 'unique'>, value: boolean) => {
    onUpdate({
      ...configuration,
      [field]: value,
    });
  };

  const validationErrors = getValidationErrors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Enum Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enum-required"
              checked={configuration.required}
              onCheckedChange={(checked) => updateToggle('required', checked)}
            />
            <Label htmlFor="enum-required">Required</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="enum-unique"
              checked={configuration.unique}
              onCheckedChange={(checked) => updateToggle('unique', checked)}
            />
            <Label htmlFor="enum-unique">Unique values only</Label>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Validation Issues
              </span>
            </div>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Existing Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Options</Label>
          {configuration.options.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-md text-center">
              No options defined. Add your first option below.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Headers */}
              <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center pb-2 border-b border-border">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Value *
                </Label>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Label
                </Label>
                <div className="w-8" /> {/* Spacer for remove button column */}
              </div>
              
              {/* Option Rows */}
              <div className="space-y-2">
                {configuration.options.map((option, index) => {
                  const isDuplicate = configuration.options.filter(opt => opt.value === option.value).length > 1;
                  return (
                    <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                      <div>
                        <Input
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          placeholder="Value*"
                          className={`text-sm ${isDuplicate ? 'border-destructive' : ''}`}
                        />
                        {isDuplicate && (
                          <span className="text-xs text-destructive">Duplicate value</span>
                        )}
                      </div>
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 p-0"
                        title="Remove option"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add New Option */}
        <div className="space-y-2">
          {/* Only show headers for add section if there are no existing options */}
          {configuration.options.length === 0 && (
            <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center pb-2 border-b border-border">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Value *
              </Label>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Label
              </Label>
              <div className="w-8" /> {/* Spacer for add button column */}
            </div>
          )}
          
          <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
            <div>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value*"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
            </div>
            <div>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={!newValue.trim() || isDuplicateValue(newValue.trim())}
              className="h-8 w-8 p-0"
              title="Add option"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {newValue.trim() && isDuplicateValue(newValue.trim()) && (
            <span className="text-xs text-destructive">Value already exists</span>
          )}
        </div>

        {/* Summary */}
        {configuration.options.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {configuration.options.length} options
              </Badge>
              {configuration.required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
              {configuration.unique && (
                <Badge variant="outline" className="text-xs">Unique</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};