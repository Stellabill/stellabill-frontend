import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { runAudit, printAuditReport } from './spacingTypographyAudit';

type StyleOverrides = Partial<Record<keyof CSSStyleDeclaration, string>>;

function mockComputedStyles(styleBySelector: Record<string, StyleOverrides> = {}) {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const tag = el.tagName?.toLowerCase() ?? '';
    const firstClass = typeof el.className === 'string' ? el.className.split(' ')[0] : '';
    const overrides =
      styleBySelector[el.id ? '#' + el.id : ''] ||
      styleBySelector[firstClass ? '.' + firstClass : ''] ||
      styleBySelector[tag] ||
      {};

    return {
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      paddingLeft: '0px',
      marginTop: '0px',
      marginRight: '0px',
      marginBottom: '0px',
      marginLeft: '0px',
      gap: 'normal',
      rowGap: 'normal',
      columnGap: 'normal',
      fontSize: '16px',
      lineHeight: '1.5',
      ...overrides,
    } as unknown as CSSStyleDeclaration;
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('spacingTypographyAudit', () => {
  describe('runAudit — environment guard', () => {
    it('throws when document is undefined', () => {
      const originalDocument = globalThis.document;
      // @ts-expect-error testing non-browser environment guard
      delete globalThis.document;
      try {
        expect(() => runAudit()).toThrow('browser environment');
      } finally {
        globalThis.document = originalDocument;
      }
    });
  });

  describe('runAudit — spacing and typography violations', () => {
    it('returns violations for an element with off-scale margin and padding', () => {
      render(
        <main className="off-scale">
          <section className="bad-margin">Content</section>
        </main>
      );

      mockComputedStyles({
        main: { paddingTop: '13px', paddingLeft: '16px' },
        section: { marginBottom: '7px', gap: '5px' },
      });

      const { violations, summary } = runAudit('main, section');

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            element: 'main.off-scale',
            property: 'paddingTop',
            value: '13px',
            violation: expect.stringContaining('8-pt'),
          }),
          expect.objectContaining({
            element: 'section.bad-margin',
            property: 'marginBottom',
            value: '7px',
            violation: expect.stringContaining('8-pt'),
          }),
          expect.objectContaining({
            element: 'section.bad-margin',
            property: 'gap',
            value: '5px',
          }),
        ])
      );
      expect(summary.spacingViolations).toBe(3);
      expect(summary.totalViolations).toBe(3);
    });

    it('returns no violations for a compliant fixture', () => {
      render(
        <main>
          <h1>Title</h1>
          <h2>Subtitle</h2>
          <p>Compliant body text</p>
        </main>
      );

      mockComputedStyles({
        main: { paddingTop: '16px', paddingBottom: '32px', marginLeft: 'auto', marginRight: 'auto' },
        h1: { fontSize: '40px', marginBottom: '16px' },
        h2: { fontSize: '32px', marginBottom: '12px' },
        p: { fontSize: '16px', lineHeight: '1.5', marginTop: '0px' },
      });

      const { violations, summary } = runAudit('main, h1, h2, p');

      expect(violations).toHaveLength(0);
      expect(summary.totalViolations).toBe(0);
    });

    it('flags out-of-range font sizes, missing line-height, and skipped heading levels', () => {
      render(
        <main>
          <h1>Heading</h1>
          <h3>Skipped heading</h3>
          <p>Body</p>
          <div>Container</div>
        </main>
      );

      mockComputedStyles({
        h1: { fontSize: '20px' },
        h3: { fontSize: 'inherit' },
        p: { fontSize: '16px', lineHeight: 'normal' },
        div: { lineHeight: 'normal' },
      });

      const { violations, summary } = runAudit('main, h1, h3, p, div');

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'font-size', element: 'h1' }),
          expect.objectContaining({ property: 'line-height', element: 'p' }),
          expect.objectContaining({
            property: 'heading-hierarchy',
            violation: expect.stringContaining('skipped'),
          }),
        ])
      );
      expect(violations.some((v) => v.property === 'line-height' && v.element === 'div')).toBe(false);
      expect(summary.typographyViolations).toBe(1);
      expect(summary.lineHeightViolations).toBe(1);
      expect(summary.hierarchyViolations).toBe(1);
      expect(summary.totalViolations).toBe(3);
    });
  });

  describe('printAuditReport', () => {
    it('logs Summary: and the success message when clean', () => {
      render(
        <main>
          <p>Clean content</p>
        </main>
      );

      mockComputedStyles({
        main: { paddingTop: '16px' },
        p: { fontSize: '16px', lineHeight: '1.5' },
      });

      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

      const result = printAuditReport();

      expect(result.violations).toHaveLength(0);
      expect(groupSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Summary:', result.summary);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('No violations found!'),
        expect.any(String)
      );
      expect(tableSpy).not.toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalledTimes(1);
    });

    it('logs Summary: and calls console.table when violations exist', () => {
      render(<main>Off-scale</main>);

      mockComputedStyles({
        main: { paddingTop: '13px' },
      });

      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

      const result = printAuditReport();

      expect(result.violations.length).toBeGreaterThan(0);
      expect(groupSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Summary:', result.summary);
      expect(tableSpy).toHaveBeenCalledWith(result.violations);
      expect(groupEndSpy).toHaveBeenCalledTimes(1);
    });
  });
});
