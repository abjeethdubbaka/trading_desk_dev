import React, { useMemo, useState } from 'react';
import AnalysisCard from '@/components/screenshot-analysis/AnalysisCard';
import KeyTakeawaysCard from '@/components/screenshot-analysis/KeyTakeawaysCard';
import SavedSessionsCard from '@/components/screenshot-analysis/SavedSessionsCard';
import SessionSummaryCard from '@/components/screenshot-analysis/SessionSummaryCard';
import UploadControls from '@/components/screenshot-analysis/UploadControls';
import {
  ENTRY_TIMING_OPTIONS,
  EXIT_TIMING_OPTIONS,
  SETUP_OPTIONS,
  STATUS_OPTIONS,
  STORAGE_KEY
} from '@/components/screenshot-analysis/constants';
import {
  calculateMostCommonIssue,
  fileToDataUrl,
  generateAdvancedAnalysis,
  generateSuggestion,
  parseDollarish
} from '@/components/screenshot-analysis/utils';
import { AdvancedSummary } from '@/components/screenshot-analysis/AdvancedAnalysisPanels';

export default function ScreenshotAnalysis() {
  const [screenshots, setScreenshots] = useState([]);
  const [analysisMap, setAnalysisMap] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [sessionHistory, setSessionHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const summary = useMemo(() => {
    const entries = Object.values(analysisMap);
    if (entries.length === 0) {
      return { count: 0, avgScore: 0, reviewRequired: 0, totalPotential: 0 };
    }

    const avgScore = entries.reduce((sum, item) => sum + (Number(item.entry_quality_score) || 0), 0) / entries.length;
    const reviewRequired = entries.filter((item) => Number(item.confidence) < 0.6 || item.status === 'rejected' || item.status === 'needs_review').length;

    const totalPotential = entries.reduce((sum, item) => {
      const entrySave = parseDollarish(item.entry_savings_potential);
      const exitLeft = parseDollarish(item.exit_left_on_table);
      return sum + entrySave + exitLeft;
    }, 0);

    return { count: entries.length, avgScore, reviewRequired, totalPotential };
  }, [analysisMap]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const uploaded = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        url: await fileToDataUrl(file),
      })),
    );

    setScreenshots((prev) => [...prev, ...uploaded]);
    event.target.value = '';
  };

  const runAnalysis = async () => {
    if (screenshots.length === 0) return;

    setIsAnalyzing(true);
    try {
      const next = { ...analysisMap };
      screenshots.forEach((shot) => {
        next[shot.id] = {
          image_id: shot.id,
          source_name: shot.name,
          ...generateSuggestion(shot.name),
          advanced_analysis: generateAdvancedAnalysis(shot.name),
        };
      });
      setAnalysisMap(next);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateAnalysisField = (imageId, field, value) => {
    setAnalysisMap((prev) => ({
      ...prev,
      [imageId]: {
        ...(prev[imageId] || {}),
        [field]: value,
      },
    }));
  };

  const saveSession = () => {
    if (screenshots.length === 0) return;

    const analysisEntries = Object.values(analysisMap);
    const totalPotentialSavings = analysisEntries.reduce((sum, item) => {
      const entrySave = parseDollarish(item.entry_savings_potential);
      const exitLeft = parseDollarish(item.exit_left_on_table);
      return sum + entrySave + exitLeft;
    }, 0);

    const session = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      images: screenshots.map((s) => ({ id: s.id, name: s.name })),
      analysis: analysisEntries,
      summary: {
        image_count: summary.count,
        avg_quality_score: Number(summary.avgScore.toFixed(2)),
        review_required_count: summary.reviewRequired,
        total_potential_savings: Number(totalPotentialSavings.toFixed(2)),
        most_common_issue: calculateMostCommonIssue(analysisEntries),
      },
    };

    const next = [session, ...sessionHistory].slice(0, 50);
    setSessionHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearCurrent = () => {
    setScreenshots([]);
    setAnalysisMap({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Screenshot Analysis Lab</h1>
        <p className="text-white/60 mt-1">
          Separate workflow for uploading chart screenshots, reviewing AI suggestions, and saving analysis sessions.
        </p>
      </div>

      <UploadControls
        uploadedCount={screenshots.length}
        isAnalyzing={isAnalyzing}
        canSave={Object.keys(analysisMap).length > 0}
        onUpload={handleUpload}
        onRunAnalysis={runAnalysis}
        onSave={saveSession}
        onClear={clearCurrent}
      />

      {screenshots.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {screenshots.map((shot) => {
            const row = analysisMap[shot.id] || {};
            return (
              <AnalysisCard
                key={shot.id}
                shot={shot}
                row={row}
                setupOptions={SETUP_OPTIONS}
                statusOptions={STATUS_OPTIONS}
                entryTimingOptions={ENTRY_TIMING_OPTIONS}
                exitTimingOptions={EXIT_TIMING_OPTIONS}
                onFieldChange={updateAnalysisField}
              />
            );
          })}
        </div>
      )}

      <KeyTakeawaysCard analysisMap={analysisMap} />

      <AdvancedSummary
        analyses={Object.values(analysisMap)
          .map((entry) => entry.advanced_analysis)
          .filter(Boolean)}
      />

      <SessionSummaryCard summary={summary} />

      <SavedSessionsCard sessionHistory={sessionHistory} />
    </div>
  );
}
