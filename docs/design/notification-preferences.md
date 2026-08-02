# Notification Preferences Page — Design Specification

## Overview
A notification preferences page allowing users to configure granular notification categories with toggle controls for each channel (email, push, in-app).

## Layout
- Page title: 'Notification Preferences' (h1, 24px)
- Save button: sticky bottom bar
- Sections grouped by category with collapsible headers
- Category matrix: rows=categories, columns=channels
- Toggle switches per cell (36x20px)

## Categories
- Account (security, billing, profile changes)
- Activity (mentions, comments, reactions)
- Marketing (product updates, tips, promotions)
- Projects (status changes, deadlines, team activity)
- Digest (daily/weekly summary)

## Channel Columns
- Email (envelope icon)
- Push (bell icon)
- In-App (dot icon)

## Visual Design
- Toggle: on=primary green, off=grey
- Row hover: light bg highlight
- Section header: chevron toggle expand/collapse
- Unsaved changes indicator: dot on Save button
- Success toast on save: green, auto-dismiss 3s

## Accessibility
- Toggles: , 
- Table:  with column headers
- Keyboard: Tab through toggles, Space to toggle
- Save:  during API call

## States
- Loading: skeleton rows
- Empty: no categories configured
- Error: inline error message with retry
- Saved: success feedback

## Responsive
- Mobile: stacked card layout (not table)
- Desktop: full matrix table
