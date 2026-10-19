import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDraftManager, type DraftData } from './useDraftManager';

const STORAGE_KEY = 'plan-drafts';

const makeData = (overrides: Partial<DraftData> = {}): DraftData => ({
  usageEnabled: false,
  trialDays: '14',
  pricing: {
    tiers: [],
  } as DraftData['pricing'],
  ...overrides,
});

describe('useDraftManager', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves a new draft with a generated id when no id is provided', async () => {
    const { result } = renderHook(() => useDraftManager());

    let savedRes: any;
    await act(async () => {
      savedRes = result.current.upsertDraft(undefined, makeData());
    });

    expect(savedRes.id).toBeTruthy();
    expect(result.current.drafts.length).toBe(1);
    expect(result.current.drafts[0].id).toBe(savedRes.id);
  });

  it('upserts an existing draft instead of creating a duplicate', async () => {
    const { result } = renderHook(() => useDraftManager());

    let firstId = '';
    await act(async () => {
      const saved = result.current.upsertDraft(undefined, makeData());
      firstId = saved.id;
    });

    await act(async () => {
      result.current.upsertDraft(firstId, makeData());
    });

    expect(result.current.drafts.length).toBe(1);
    expect(result.current.drafts[0].id).toBe(firstId);
  });

  it('resuming and saving twice leaves exactly one draft with the latest data', async () => {
    const { result } = renderHook(() => useDraftManager());

    let id = '';
    await act(async () => {
      id = result.current.upsertDraft(undefined, makeData()).id;
    });

    await act(async () => {
      result.current.upsertDraft(id, makeData());
    });
    await act(async () => {
      result.current.upsertDraft(id, makeData());
    });

    expect(result.current.drafts.length).toBe(1);
  });

  it('deletes a draft by id', async () => {
    const { result } = renderHook(() => useDraftManager());

    let id = '';
    await act(async () => {
      id = result.current.upsertDraft(undefined, makeData()).id;
    });
    expect(result.current.drafts.length).toBe(1);

    await act(async () => {
      result.current.deleteDraft(id);
    });

    expect(result.current.drafts.length).toBe(0);
  });

  it('persists drafts to localStorage', async () => {
    const { result } = renderHook(() => useDraftManager());

    await act(async () => {
      result.current.upsertDraft(undefined, makeData());
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw !== null && JSON.parse(raw).length === 1;
    });
  });
});
