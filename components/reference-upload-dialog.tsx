"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import type { ReferenceDataInfo, ValidationResult } from "@/lib/types/reference-data-types";

interface ReferenceUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (referenceInfo: ReferenceDataInfo) => void;
  onError?: (error: string) => void;
  mode?: 'upload' | 'replace';
  existingReferenceId?: string;
  existingReferenceInfo?: ReferenceDataInfo;
}

interface FileValidation {
  file: File;
  validation: ValidationResult;
  preview: Record<string, unknown>[];
  error?: string;
}

export function ReferenceUploadDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
  mode = 'upload',
  existingReferenceId,
  existingReferenceInfo,
}: ReferenceUploadDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customId, setCustomId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setFileValidation(null);
    setIsUploading(false);
    setUploadProgress(0);
    setCustomId("");
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const validateFile = useCallback(async (file: File): Promise<FileValidation> => {
    try {
      // Validate file type
      const validTypes = ['text/csv', 'application/json', 'text/plain'];
      const validExtensions = ['.csv', '.json', '.txt'];
      const hasValidType = validTypes.includes(file.type) || 
        validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidType) {
        throw new Error('Invalid file type. Please upload a CSV or JSON file.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      // Validate file content
      const validation = await referenceDataManager.validateReferenceData(file);
      
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate preview data
      const text = await file.text();
      let preview: Record<string, unknown>[] = [];

      if (file.name.toLowerCase().endsWith('.json')) {
        const jsonData = JSON.parse(text);
        preview = Array.isArray(jsonData) ? jsonData.slice(0, 5) : [jsonData];
      } else {
        // CSV parsing
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row.');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      }

      return {
        file,
        validation,
        preview,
      };
    } catch (error) {
      return {
        file,
        validation: {
          valid: false,
          errors: [error instanceof Error ? error.message : 'Unknown validation error'],
          warnings: [],
        },
        preview: [],
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setFileValidation(null);

    const validation = await validateFile(file);
    setFileValidation(validation);

    // Auto-generate ID from filename
    if (!customId) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      setCustomId(baseName);
    }
  }, [validateFile, customId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !fileValidation?.validation.valid) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      let referenceId: string;
      let referenceInfo: ReferenceDataInfo;

      if (mode === 'replace' && existingReferenceId) {
        // Replace existing reference data
        referenceId = existingReferenceId;
        await referenceDataManager.updateReferenceData(referenceId, []);
        referenceInfo = await referenceDataManager.uploadReferenceFile(
          selectedFile,
          referenceId,
          { overwrite: true }
        );
      } else {
        // Upload new reference data
        const finalId = customId || `ref_${Date.now()}`;
        referenceInfo = await referenceDataManager.uploadReferenceFile(
          selectedFile,
          finalId
        );
        referenceId = referenceInfo.id;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onSuccess?.(referenceInfo);
        handleClose();
      }, 500);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
    }
  }, [selectedFile, fileValidation, mode, existingReferenceId, customId, onSuccess, onError, handleClose]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUpload = selectedFile && fileValidation?.validation.valid && !isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {mode === 'replace' ? 'Replace Reference Data' : 'Upload Reference Data'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'replace' && existingReferenceInfo ? (
              <>Replacing: {existingReferenceInfo.filename}</>
            ) : (
              <>Upload a CSV or JSON file to use as reference data for lookups.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              selectedFile && "border-green-300 bg-green-50"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-600" />
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <div className="font-medium">Drop your file here or click to browse</div>
                  <div className="text-sm text-muted-foreground">
                    Supports CSV and JSON files up to 10MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom ID Input */}
          {mode === 'upload' && (
            <div className="space-y-2">
              <Label htmlFor="custom-id">Reference ID (optional)</Label>
              <Input
                id="custom-id"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="Auto-generated if empty"
              />
              <div className="text-xs text-muted-foreground">
                Must be unique. Use letters, numbers, and underscores only.
              </div>
            </div>
          )}

          {/* File Validation Results */}
          {fileValidation && (
            <div className="space-y-3">
              <Separator />
              
              <div className="flex items-center gap-2">
                {fileValidation.validation.valid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File validation passed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">File validation failed</span>
                  </>
                )}
              </div>

              {/* Validation Errors */}
              {fileValidation.validation.errors.length > 0 && (
                <div className="text-sm text-red-800 space-y-1">
                  {fileValidation.validation.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Warnings */}
              {fileValidation.validation.warnings.length > 0 && (
                <div className="text-sm text-yellow-800 space-y-1">
                  {fileValidation.validation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Preview */}
              {fileValidation.validation.valid && fileValidation.preview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Data Preview</div>
                  <div className="border rounded-md overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          {Object.keys(fileValidation.preview[0]).map((header) => (
                            <th key={header} className="px-2 py-1 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileValidation.preview.map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-2 py-1">
                                {value != null ? String(value) : (
                                  <span className="text-muted-foreground italic">empty</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Showing first {fileValidation.preview.length} rows
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
                <Badge variant="outline">{uploadProgress.toFixed(0)}%</Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {mode === 'replace' ? 'Replace' : 'Upload'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}