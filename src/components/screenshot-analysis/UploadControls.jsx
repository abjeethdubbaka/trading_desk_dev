import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Sparkles, Trash2 } from 'lucide-react';

export default function UploadControls({
  uploadedCount,
  isAnalyzing,
  analysisProgress,
  canSave,
  onUpload,
  onRunAnalysis,
  onSave,
  onClear,
}) {
  const progressPct =
    analysisProgress && analysisProgress.total > 0
      ? Math.round((analysisProgress.done / analysisProgress.total) * 100)
      : 0;

  return (
    <Card className="bg-[#13131c] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Upload &amp; Analyze</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label
            htmlFor="screenshot-analysis-upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload images
          </Label>
          <Input
            id="screenshot-analysis-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            className="hidden"
          />

          <Button
            onClick={onRunAnalysis}
            disabled={uploadedCount === 0 || isAnalyzing}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing…' : 'Run AI Analysis'}
          </Button>

          <Button variant="outline" onClick={onSave} disabled={!canSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Session
          </Button>

          <Button variant="ghost" onClick={onClear} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>
            Uploaded: <span className="text-white font-medium">{uploadedCount}</span>
            {uploadedCount === 1 ? ' image' : ' images'}
          </span>

          {analysisProgress && (
            <span className="text-blue-400">
              Analyzing {analysisProgress.done}/{analysisProgress.total}…
            </span>
          )}
        </div>

        {/* Live progress bar — only visible during analysis */}
        {analysisProgress && (
          <div className="space-y-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-white/30">
              Claude Vision is reading each chart — results appear card by card
            </p>
          </div>
        )}

        {/* Tip when no images yet */}
        {uploadedCount === 0 && (
          <p className="text-xs text-white/30">
            Upload one or more chart screenshots, then click "Run AI Analysis" — Claude will read each image and pre-fill all fields.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
