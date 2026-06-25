# File Upload Component - Design System Documentation

Issue #292 - Branch: uiux/file-upload-component

## Overview

 FileUpload is a unified file/CSV upload component used for:
- Logo upload (variant=logo) - PNG, JPG, SVG, WebP, max 10 MB
- CSV import (variant=csv) - CSV files with column preview
- Avatar change (variant=avatar) - PNG, JPG, WebP, circular preview

## States

- idle: Dashed border, upload icon, hint text
- dragover: Indigo border and background, Release text
- uploading: Progress bar with role=progressbar
- success: Green border, image or CSV preview
- error: Red border, error banner with Retry button

## Props

- variant: logo or csv or avatar (default csv)
- onFileSelect: callback receiving the File object
- maxSizeBytes: number, default 10485760 (10 MB)
- className: extra class on root div

## Accessibility (WCAG 2.1 AA)

- Real input type=file exposed to assistive tech
- Drop zone has role=button and tabIndex=0
- Enter and Space open the native file picker
- aria-label describes accepted types
- Progress bar uses role=progressbar with aria-valuenow/min/max
- Error uses role=alert for immediate announcement
- Live region aria-live=polite announces all state changes
- All controls have focus-visible styles

## CSV Column Preview

- First 5 rows and 6 columns maximum
- Horizontally scrollable on small screens
- Empty cells render blank
- Headers fallback to Column N if blank

## Edge Cases

- Rejected file type: immediate error with accepted types listed
- File too large: immediate error with limit in MB
- Network error mid-upload: error state with Try again button
- Large CSV: truncated to 5 rows x 6 cols
- Mobile picker: input onChange handles selection identically
- Multiple rapid drops: each resets and restarts cleanly

## File Structure

src/components/FileUpload/
- FileUpload.tsx
- FileUpload.css
- FileUpload.test.tsx
- index.ts
