import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Sparkles, Trash2 } from 'lucide-react';

export default function UploadControls({
  uploadedCount,
  isAnalyzing,
  canSave,
  onUpload,
  onRunAnalysis,
  onSave,
  onClear
}) {
  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="text-base">1) Upload Screenshots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label
            htmlFor="screenshot-analysis-upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
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
          <Button onClick={onRunAnalysis} disabled={uploadedCount === 0 || isAnalyzing}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button variant="outline" onClick={onSave} disabled={!canSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </Button>
          <Button variant="ghost" onClick={onClear}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className="text-sm text-white/70">
          Uploaded: <span className="text-white">{uploadedCount}</span> images
        </div>
      </CardContent>
    </Card>
  );
}
