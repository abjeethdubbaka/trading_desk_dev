import React, { useMemo, useState, useCallback } from 'react';
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
  parseDollarish
} from '@/components/screenshot-analysis/utils';
import { AdvancedSummary } from '@/components/screenshot-analysis/AdvancedAnalysisPanels';
import { useScreenshotAI } from '@/components/screenshot-analysis/useScreenshotAI';

export default function ScreenshotAnalysis() {
  const [screenshots, setScreenshots] = useState([]);
  const [analysisMap, setAnalysisMap] = useState({});

  const [sessionHistory, setSessionHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const { analyzeAll, getState, getError, isAnyLoading, imageStates } = useScreenshotAI();

  // Summary metrics
  const summary = useMemo(() => {
    const entries = Object.values(analysisMap);
    if (entries.length === 0) return { count: 0, avgScore: 0, reviewRequired: 0, totalPotential: 0 };
    const avgScore = entries.reduce((sum, item) => sum + (Number(item.entry_quality_score) || 0), 0) / entries.length;
    const reviewRequired = entries.filter(
      (item) => Number(item.confidence) < 0.6 || item.status === 'rejected' || item.status === 'needs_review'
    ).length;
    const totalPotential = entries.reduce((sum, item) => {
      return sum + parseDollarish(item.entry_savings_potential) + parseDollarish(item.exit_left_on_table);
    }, 0);
    return { count: entries.length, avgScore, reviewRequired, totalPotential };
  }, [analysisMap]);

  // Count how many images have finished (done or error)
  const doneCount = useMemo(
    () => Object.values(imageStates).filter((s) => s === 'done' || s === 'error').length,
    [imageStates]
  );

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const uploaded = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        url: await fileToDataUrl(file),
      }))
    );
    setScreenshots((prev) => [...prev, ...uploaded]);
    event.target.value = '';
  };

  const runAnalysis = useCallback(async () => {
    if (screenshots.length === 0) return;
    const onResult = (id, result) => {
      const shot = screenshots.find((s) => s.id === id);
      setAnalysisMap((prev) => ({
        ...prev,
        [id]: {
          image_id: id,
          source_name: shot?.name || id,
          status: 'suggested',
          ...result,
        },
      }));
    };
    await analyzeAll(screenshots, onResult);
  }, [screenshots, analyzeAll]);

  const updateAnalysisField = useCallback((imageId, field, value) => {
    setAnalysisMap((prev) => ({
      ...prev,
      [imageId]: { ...(prev[imageId] || {}), [field]: value },
    }));
  }, []);

  const saveSession = () => {
    if (screenshots.length === 0) return;
    const analysisEntries = Object.values(analysisMap);
    const totalPotentialSavings = analysisEntries.reduce(
      (sum, item) => sum + parseDollarish(item.entry_savings_potential) + parseDollarish(item.exit_left_on_table),
      0
    );
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

  const analysisProgress =
    screenshots.length > 0 && isAnyLoading
      ? { done: doneCount, total: screenshots.length }
      : null;

  return (
    <div className="space-y-6">

      <UploadControls
        uploadedCount={screenshots.length}
        isAnalyzing={isAnyLoading}
        analysisProgress={analysisProgress}
        canSave={Object.keys(analysisMap).length > 0 && !isAnyLoading}
        onUpload={handleUpload}
        onRunAnalysis={runAnalysis}
        onSave={saveSession}
        onClear={clearCurrent}
      />

      {screenshots.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {screenshots.map((shot) => (
            <AnalysisCard
              key={shot.id}
              shot={shot}
              row={analysisMap[shot.id] || {}}
              aiState={getState(shot.id)}
              aiError={getError(shot.id)}
              setupOptions={SETUP_OPTIONS}
              statusOptions={STATUS_OPTIONS}
              entryTimingOptions={ENTRY_TIMING_OPTIONS}
              exitTimingOptions={EXIT_TIMING_OPTIONS}
              onFieldChange={updateAnalysisField}
            />
          ))}
        </div>
      )}

      {Object.keys(analysisMap).length > 0 && (
        <>
          <KeyTakeawaysCard analysisMap={analysisMap} />
          <AdvancedSummary
            analyses={Object.values(analysisMap).map((e) => e.advanced_analysis).filter(Boolean)}
          />
          <SessionSummaryCard summary={summary} />
        </>
      )}

      <SavedSessionsCard sessionHistory={sessionHistory} />
    </div>
  );
}
