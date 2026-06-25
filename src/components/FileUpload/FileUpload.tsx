import React, { useCallback, useRef, useState } from "react";
import "./FileUpload.css";

export type FileUploadVariant = "logo" | "csv" | "avatar";
export type FileUploadState = "idle" | "dragover" | "uploading" | "success" | "error";

export interface CsvRow {
  [key: string]: string;
}

export interface FileUploadProps {
  variant?: FileUploadVariant;
  onFileSelect?: (file: File) => void | Promise<void>;
  maxSizeBytes?: number;
  className?: string;
}

const ACCEPT_MAP: Record<FileUploadVariant, string> = {
  logo: "image/png,image/jpeg,image/svg+xml,image/webp",
  csv: "text/csv,application/vnd.ms-excel,.csv",
  avatar: "image/png,image/jpeg,image/webp",
};

const LABEL_MAP: Record<FileUploadVariant, string> = {
  logo: "Upload logo (PNG, JPG, SVG, WebP)",
  csv: "Upload CSV file",
  avatar: "Upload avatar (PNG, JPG, WebP)",
};

const MAX_CSV_PREVIEW_ROWS = 5;
const MAX_CSV_PREVIEW_COLS = 6;

function parseCsvPreview(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim()).slice(0, MAX_CSV_PREVIEW_COLS);
  const rows = lines
    .slice(1, MAX_CSV_PREVIEW_ROWS + 1)
    .map((line) => line.split(",").map((c) => c.trim()).slice(0, MAX_CSV_PREVIEW_COLS));
  return { headers, rows };
}

export const FileUpload: React.FC<FileUploadProps> = ({
  variant = "csv",
  onFileSelect,
  maxSizeBytes = 10 * 1024 * 1024,
  className = "",
}) => {
  const [uploadState, setUploadState] = useState<FileUploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = ACCEPT_MAP[variant];

  const reset = useCallback(() => {
    setUploadState("idle");
    setProgress(0);
    setErrorMessage(null);
    setPreviewUrl(null);
    setCsvPreview(null);
    setSelectedFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      // Validate type
      const allowedTypes = accept.split(",");
      const typeOk = allowedTypes.some(
        (t) => file.type === t || file.name.endsWith(t.replace(/.*\./, "."))
      );
      if (!typeOk) {
        setUploadState("error");
        setErrorMessage(
          `File type not accepted. Please upload: ${LABEL_MAP[variant].match(/\(([^)]+)\)/)?.[1] ?? accept}`
        );
        return;
      }
      // Validate size
      if (file.size > maxSizeBytes) {
        setUploadState("error");
        setErrorMessage(
          `File too large. Maximum size is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB.`
        );
        return;
      }

      setSelectedFileName(file.name);
      setUploadState("uploading");
      setProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + 10;
        });
      }, 80);

      try {
        // CSV preview
        if (variant === "csv") {
          const text = await file.text();
          const preview = parseCsvPreview(text);
          setCsvPreview(preview);
        }
        // Image preview
        if (variant === "logo" || variant === "avatar") {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }

        if (onFileSelect) await onFileSelect(file);

        clearInterval(interval);
        setProgress(100);
        setUploadState("success");
      } catch {
        clearInterval(interval);
        setUploadState("error");
        setErrorMessage("Upload failed due to a network error. Please try again.");
      }
    },
    [accept, maxSizeBytes, onFileSelect, variant]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState("dragover");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setUploadState("idle");
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    []
  );

  const stateClass = `fu-dropzone fu-dropzone--${uploadState}`;

  return (
    <div className={`fu-root ${className}`} data-testid="file-upload-root">
      {/* Hidden real input — required for assistive tech */}
      <input
        ref={inputRef}
        id="fu-input"
        type="file"
        accept={accept}
        className="fu-input-hidden"
        aria-label={LABEL_MAP[variant]}
        onChange={handleChange}
        data-testid="file-upload-input"
      />

      {/* Drop zone */}
      <div
        className={stateClass}
        role="button"
        tabIndex={0}
        aria-label={`${LABEL_MAP[variant]}. Press Enter or Space to browse files.`}
        aria-describedby="fu-hint fu-status"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        data-testid="file-upload-dropzone"
      >
        <div className="fu-icon" aria-hidden="true">
          {uploadState === "success" ? "✓" : uploadState === "error" ? "✕" : "↑"}
        </div>

        <p className="fu-primary-text">
          {uploadState === "idle" && "Drag & drop your file here"}
          {uploadState === "dragover" && "Release to upload"}
          {uploadState === "uploading" && `Uploading ${selectedFileName ?? "file"}…`}
          {uploadState === "success" && `${selectedFileName ?? "File"} uploaded`}
          {uploadState === "error" && "Upload failed"}
        </p>

        {uploadState === "idle" && (
          <p className="fu-secondary-text" id="fu-hint">
            or <span className="fu-link">click to browse</span>
            &nbsp;· {LABEL_MAP[variant].match(/\(([^)]+)\)/)?.[1] ?? ""} · max{" "}
            {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
          </p>
        )}

        {uploadState === "uploading" && (
          <div
            className="fu-progress-bar-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <div className="fu-progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Status live region */}
      <div
        id="fu-status"
        className="fu-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {uploadState === "uploading" && `Upload progress: ${progress}%`}
        {uploadState === "success" && `${selectedFileName ?? "File"} uploaded successfully.`}
        {uploadState === "error" && `Error: ${errorMessage ?? "Upload failed."}`}
      </div>

      {/* Error message */}
      {uploadState === "error" && errorMessage && (
        <div className="fu-error-message" role="alert" data-testid="file-upload-error">
          <span aria-hidden="true">⚠ </span>
          {errorMessage}
          <button className="fu-retry-btn" onClick={reset} aria-label="Retry file upload">
            Try again
          </button>
        </div>
      )}

      {/* Image preview */}
      {uploadState === "success" && previewUrl && (
        <div className="fu-preview-image-wrap" data-testid="file-upload-image-preview">
          <img
            src={previewUrl}
            alt={`Preview of uploaded ${variant}`}
            className={`fu-preview-image fu-preview-image--${variant}`}
          />
          <button className="fu-remove-btn" onClick={reset} aria-label="Remove uploaded file">
            Remove
          </button>
        </div>
      )}

      {/* CSV column preview */}
      {uploadState === "success" && csvPreview && csvPreview.headers.length > 0 && (
        <div className="fu-csv-preview" data-testid="file-upload-csv-preview">
          <p className="fu-csv-preview-label">
            Column preview — first {Math.min(csvPreview.rows.length, MAX_CSV_PREVIEW_ROWS)} rows
          </p>
          <div className="fu-csv-table-wrap" role="region" aria-label="CSV column preview" tabIndex={0}>
            <table className="fu-csv-table">
              <thead>
                <tr>
                  {csvPreview.headers.map((h, i) => (
                    <th key={i} scope="col">{h || `Column ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.rows.map((row, ri) => (
                  <tr key={ri}>
                    {csvPreview.headers.map((_, ci) => (
                      <td key={ci}>{row[ci] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="fu-remove-btn" onClick={reset} aria-label="Remove uploaded CSV">
            Remove file
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
