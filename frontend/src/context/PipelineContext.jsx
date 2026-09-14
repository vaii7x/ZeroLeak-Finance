import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  analyzeDataset,
  recommendFields,
  evaluatePolicy,
  createExposurePlan,
  approveExposurePlan,
  sanitizeDataset,
  validateDataset,
} from '../services/api';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
  // Raw file retained in memory
  const [rawFile, setRawFile] = useState(null);

  // Metadata & Step Responses
  const [datasetMeta, setDatasetMeta] = useState(() => {
    try {
      const saved = localStorage.getItem('zeroleak_dataset');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [policyResult, setPolicyResult] = useState(null);

  const [exposurePlan, setExposurePlan] = useState(() => {
    try {
      const saved = localStorage.getItem('zeroleak_plan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sanitizedResult, setSanitizedResult] = useState(() => {
    try {
      const saved = localStorage.getItem('zeroleak_sanitized');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [validationResult, setValidationResult] = useState(() => {
    try {
      const saved = localStorage.getItem('zeroleak_validation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Sync to localStorage for resilient page reloads
  useEffect(() => {
    if (exposurePlan) {
      localStorage.setItem('zeroleak_plan', JSON.stringify(exposurePlan));
    }
  }, [exposurePlan]);

  useEffect(() => {
    if (sanitizedResult) {
      localStorage.setItem('zeroleak_sanitized', JSON.stringify(sanitizedResult));
    }
  }, [sanitizedResult]);

  useEffect(() => {
    if (validationResult) {
      localStorage.setItem('zeroleak_validation', JSON.stringify(validationResult));
    }
  }, [validationResult]);

  /**
   * Run full backend analysis & exposure plan creation pipeline (M1 -> M2 -> M3 -> M4)
   * onStepUpdate is called with { step: 1|2|3|4, label: string }
   */
  const runFullAnalysis = async (file, purpose, recipient, onStepUpdate) => {
    setIsProcessing(true);
    setError(null);
    try {
      setRawFile(file);

      // Step 1: Analyze
      if (onStepUpdate) onStepUpdate(1, 'Analyzing column structures & classifying PII...');
      const analysis = await analyzeDataset(file, purpose, recipient);
      setAnalysisResult(analysis);

      // Step 2: Recommend
      if (onStepUpdate) onStepUpdate(2, 'Generating advisory recommendations with AI provider...');
      const recs = await recommendFields(purpose, recipient, analysis.fields);
      setRecommendations(recs);

      // Step 3: Policy Engine
      if (onStepUpdate) onStepUpdate(3, 'Enforcing deterministic privacy governance rules...');
      const policy = await evaluatePolicy(purpose, recipient, analysis.fields, recs.recommendations);
      setPolicyResult(policy);

      // Step 4: Create Exposure Plan
      if (onStepUpdate) onStepUpdate(4, 'Synthesizing reviewable Exposure Plan...');
      const plan = await createExposurePlan(
        purpose,
        recipient,
        analysis.fields,
        recs.recommendations,
        policy.decisions
      );
      setExposurePlan(plan);

      // Retrieve existing sampleRows or parse directly from file
      let sampleRows = [];
      let columns = analysis.fields.map(f => f.name);
      try {
        const saved = localStorage.getItem('zeroleak_dataset');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.sampleRows && parsed.sampleRows.length > 0) {
            sampleRows = parsed.sampleRows;
          }
          if (parsed.columns && parsed.columns.length > 0) {
            columns = parsed.columns;
          }
        }
      } catch {
        // ignore
      }

      if (sampleRows.length === 0 && typeof file.slice === 'function') {
        try {
          const sliceText = await file.slice(0, 32768).text();
          const lines = sliceText.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
            columns = rawHeaders;
            sampleRows = lines.slice(1, 6).map(line => {
              const vals = line.split(',');
              const obj = {};
              rawHeaders.forEach((h, i) => {
                obj[h] = vals[i] ? vals[i].trim().replace(/^["']|["']$/g, '') : '';
              });
              return obj;
            });
          }
        } catch (e) {
          console.warn('Could not extract sample rows from file:', e);
        }
      }

      // Store dataset metadata for UI convenience
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const meta = {
        fileName: file.name,
        fileSize: formattedSize,
        rowCount: analysis.row_count,
        columnCount: analysis.field_count,
        columns,
        sampleRows,
        purpose,
        recipient,
        fields: analysis.fields,
      };
      setDatasetMeta(meta);
      localStorage.setItem('zeroleak_dataset', JSON.stringify(meta));

      return plan;
    } catch (err) {
      console.error('Pipeline analysis error:', err);
      setError(err.message || 'Analysis pipeline failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Approve current Exposure Plan (M4.2)
   */
  const approveCurrentPlan = async () => {
    if (!exposurePlan?.exposure_plan_id) {
      throw new Error('No active exposure plan to approve');
    }
    setIsProcessing(true);
    setError(null);
    try {
      const approvedPlan = await approveExposurePlan(exposurePlan.exposure_plan_id);
      setExposurePlan(approvedPlan);
      return approvedPlan;
    } catch (err) {
      console.error('Plan approval error:', err);
      setError(err.message || 'Plan approval failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Execute Sanitization and Independent Validation (M5 + M6)
   * onStepUpdate is called with { step: number, label: string }
   */
  const executeSanitizationAndValidation = async (onStepUpdate) => {
    if (!rawFile) {
      throw new Error('Original CSV file is not present in memory. Please re-upload the dataset.');
    }
    if (!exposurePlan?.exposure_plan_id) {
      throw new Error('No exposure plan found.');
    }

    setIsProcessing(true);
    setError(null);
    try {
      // Step 1: Enclave Sanitization
      if (onStepUpdate) onStepUpdate(2, 'Applying cryptographic transformations in enclave...');
      const sanitizeRes = await sanitizeDataset(
        rawFile,
        exposurePlan.exposure_plan_id,
        true,
        exposurePlan
      );
      setSanitizedResult(sanitizeRes);

      // Step 2: Convert sanitized CSV content to Blob for independent validation
      if (onStepUpdate) onStepUpdate(3, 'Executing independent validation proof checks...');
      const sanitizedBlob = new Blob([sanitizeRes.content], { type: 'text/csv' });
      const sanitizedFile = new File([sanitizedBlob], sanitizeRes.filename, { type: 'text/csv' });

      // Step 3: Validate
      const validationRes = await validateDataset(
        sanitizedFile,
        exposurePlan.exposure_plan_id,
        true,
        exposurePlan
      );
      setValidationResult(validationRes);

      if (onStepUpdate) onStepUpdate(4, 'Validation attested. Safe dataset generated.');
      return { sanitizeRes, validationRes };
    } catch (err) {
      console.error('Sanitization/Validation error:', err);
      setError(err.message || 'Sanitization process failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset entire pipeline session
   */
  const resetPipeline = () => {
    setRawFile(null);
    setDatasetMeta(null);
    setAnalysisResult(null);
    setRecommendations(null);
    setPolicyResult(null);
    setExposurePlan(null);
    setSanitizedResult(null);
    setValidationResult(null);
    setError(null);
    localStorage.removeItem('zeroleak_dataset');
    localStorage.removeItem('zeroleak_plan');
    localStorage.removeItem('zeroleak_sanitized');
    localStorage.removeItem('zeroleak_validation');
  };

  const value = {
    rawFile,
    setRawFile,
    datasetMeta,
    setDatasetMeta,
    analysisResult,
    recommendations,
    policyResult,
    exposurePlan,
    setExposurePlan,
    sanitizedResult,
    setSanitizedResult,
    validationResult,
    setValidationResult,
    isProcessing,
    error,
    setError,
    runFullAnalysis,
    approveCurrentPlan,
    executeSanitizationAndValidation,
    resetPipeline,
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}
