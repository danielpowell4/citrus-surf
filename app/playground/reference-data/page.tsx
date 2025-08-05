"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Database,
  Upload,
  FileText,
  Edit,
  Trash2,
  Download,
  Plus,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import { createLookupNavigator, parseReferenceDataParams, generateLookupBreadcrumbs } from "@/lib/utils/lookup-navigation";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";
import { ReferenceDataViewer } from "@/components/reference-data-viewer";
import { ReferenceUploadDialog } from "@/components/reference-upload-dialog";

function ReferenceDataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigator = createLookupNavigator(router, "/playground/reference-data", searchParams);
  
  const [referenceFiles, setReferenceFiles] = useState<ReferenceDataInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<'view' | 'edit'>('view');
  const [showViewer, setShowViewer] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse URL parameters
  const urlParams = parseReferenceDataParams(searchParams);
  
  // Load reference files
  useEffect(() => {
    const loadReferenceFiles = () => {
      try {
        const files = referenceDataManager.listReferenceFiles();
        setReferenceFiles(files);
        
        // Handle URL parameters
        if (urlParams.file) {
          const fileExists = files.some(f => f.id === urlParams.file);
          if (fileExists) {
            setSelectedFileId(urlParams.file);
            setViewerMode(urlParams.mode || 'view');
            setShowViewer(true);
          } else {
            // Invalid file ID, redirect to main page
            navigator.toReferenceDataManagement({ replace: true });
          }
        }
      } catch (error) {
        console.error("Failed to load reference files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferenceFiles();
  }, [urlParams.file, urlParams.mode, navigator]);

  const breadcrumbs = generateLookupBreadcrumbs("/playground/reference-data", searchParams);

  const handleViewFile = (fileId: string) => {
    navigator.toReferenceDataViewer(fileId);
  };

  const handleEditFile = (fileId: string) => {
    navigator.toReferenceDataEditor(fileId);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this reference file? This action cannot be undone.")) {
      try {
        referenceDataManager.deleteReferenceData(fileId);
        setReferenceFiles(prev => prev.filter(f => f.id !== fileId));
        
        // If we're currently viewing this file, close the viewer
        if (selectedFileId === fileId) {
          setShowViewer(false);
          setSelectedFileId(null);
          navigator.toReferenceDataManagement({ replace: true });
        }
      } catch (error) {
        console.error("Failed to delete reference file:", error);
        alert("Failed to delete reference file. Please try again.");
      }
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const data = referenceDataManager.getReferenceDataRows(fileId);
      const info = referenceDataManager.getReferenceData(fileId);
      
      if (!data || !info) {
        throw new Error("Reference data not found");
      }

      // Convert to CSV
      const headers = info.info.columns.join(',');
      const rows = data.map(row => 
        info.info.columns.map(col => {
          const value = row[col];
          if (value != null && String(value).includes(',')) {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return value != null ? String(value) : '';
        }).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', info.info.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to download reference file:", error);
      alert("Failed to download reference file. Please try again.");
    }
  };

  const handleUploadSuccess = (referenceInfo: ReferenceDataInfo) => {
    setReferenceFiles(prev => [...prev, referenceInfo]);
    setShowUploadDialog(false);
    
    // Navigate to view the uploaded file
    navigator.toReferenceDataViewer(referenceInfo.id);
  };

  const handleViewerClose = () => {
    setShowViewer(false);
    setSelectedFileId(null);
    navigator.toReferenceDataManagement({ replace: true });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {breadcrumb.current ? (
              <span className="font-medium text-foreground">{breadcrumb.label}</span>
            ) : (
              <button
                onClick={() => router.push(breadcrumb.href)}
                className="hover:text-foreground transition-colors"
              >
                {breadcrumb.label}
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Reference Data Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage reference files used by lookup fields. Upload, view, edit, and organize your lookup data.
          </p>
        </div>
        
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Reference Data
        </Button>
      </div>

      {/* Stats */}
      {referenceFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referenceFiles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referenceFiles.reduce((sum, file) => sum + file.rowCount, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(referenceFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {referenceFiles.length > 0 
                  ? formatDate(Math.max(...referenceFiles.map(f => new Date(f.lastModified).getTime())).toString())
                  : 'Never'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reference Files List */}
      {referenceFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reference Data Files</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Upload your first reference data file to start using lookup fields. CSV and JSON files are supported.
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Reference Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Reference Files ({referenceFiles.length})</h2>
          
          <div className="grid gap-4">
            {referenceFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{file.filename}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">{file.format.toUpperCase()}</Badge>
                        <span>{file.rowCount.toLocaleString()} rows</span>
                        <span>{file.columns.length} columns</span>
                        {file.fileSize && <span>{formatFileSize(file.fileSize)}</span>}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(file.id)}
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFile(file.id)}
                        title="Edit file"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file.id)}
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        title="Delete file"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Columns:</strong> {file.columns.join(', ')}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                      {file.lastModified !== file.uploadedAt && (
                        <span>Modified: {formatDate(file.lastModified)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reference Data Viewer */}
      {selectedFileId && (
        <ReferenceDataViewer
          referenceId={selectedFileId}
          isOpen={showViewer}
          onClose={handleViewerClose}
          allowEdit={viewerMode === 'view'}
          onReferenceEdit={(id) => navigator.toReferenceDataEditor(id)}
          onReferenceDownload={handleDownloadFile}
          onReferenceDelete={handleDeleteFile}
        />
      )}

      {/* Upload Dialog */}
      <ReferenceUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleUploadSuccess}
        onError={(error) => {
          console.error("Upload failed:", error);
          alert(`Upload failed: ${error}`);
        }}
      />
    </div>
  );
}

export default function ReferenceDataPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ReferenceDataPageContent />
    </Suspense>
  );
}