import { runAudit, printAuditReport } from '../../utils/spacingTypographyAudit';

// ── Helpers

/**
 * Inject a mini DOM and override getComputedStyle for each element
 * so we can test specific CSS property combinations without jsdom limits.
 */
function setupDOM(html, styleMap = {}) {
  document.body.innerHTML = html;
  const original = window.getComputedStyle.bind(window);
  jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const tag = el.tagName?.toLowerCase() ?? '';
    const overrides = styleMap[tag] || styleMap[el.id] || styleMap[el.className?.split(' ')[0]] || {};
    return {
      paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px',
      marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px',
      gap: 'normal', rowGap: 'normal', columnGap: 'normal',
      fontSize: '16px',
      lineHeight: '1.5',
      ...overrides,
    };
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

// parsePx (internal) tested via public API

describe('runAudit — environment guard', () => {
  it('throws when document is undefined', () => {
    const doc = global.document;
    // @ts-ignore
    delete global.document;
    expect(() => runAudit()).toThrow('browser environment');
    global.document = doc;
  });
});

// Spacing violations 

describe('Spacing audit — 8-pt grid', () => {
  it('reports no violations for valid 8-pt padding', () => {
    setupDOM('<main><p>Hello</p></main>', {
      main: { paddingTop: '16px', paddingBottom: '32px' },
      p: { lineHeight: '1.5' },
    });
    const { violations } = runAudit('main, p');
    const spacingViolations = violations.filter(v =>
      ['paddingTop', 'paddingBottom'].includes(v.property)
    );
    expect(spacingViolations).toHaveLength(0);
  });

  it('flags off-grid padding (e.g. 13px)', () => {
    setupDOM('<main></main>', {
      main: { paddingTop: '13px' },
    });
    const { violations } = runAudit('main');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'paddingTop', violation: expect.stringContaining('8-pt') }),
      ])
    );
  });

  it('flags off-grid margin (e.g. 7px)', () => {
    setupDOM('<section></section>', {
      section: { marginBottom: '7px' },
    });
    const { violations } = runAudit('section');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'marginBottom' }),
      ])
    );
  });

  it('flags off-grid gap (e.g. 5px)', () => {
    setupDOM('<div></div>', {
      div: { gap: '5px' },
    });
    const { violations } = runAudit('div');
    expect(violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'gap' })])
    );
  });

  it('ignores "auto" and "normal" margin values', () => {
    setupDOM('<div></div>', {
      div: { marginLeft: 'auto', marginRight: 'auto', gap: 'normal' },
    });
    const { violations } = runAudit('div');
    const spacingViolations = violations.filter(v => v.property === 'marginLeft' || v.property === 'marginRight');
    expect(spacingViolations).toHaveLength(0);
  });

  it('accepts all valid spacing values', () => {
    const valid = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];
    for (const px of valid) {
      setupDOM('<div></div>', { div: { paddingTop: `${px}px` } });
      const { violations } = runAudit('div');
      const v = violations.filter(x => x.property === 'paddingTop');
      expect(v).toHaveLength(0);
    }
  });
});

//Font size violations 

describe('Font size audit', () => {
  it('reports no violation when h1 is in range', () => {
    setupDOM('<h1>Title</h1>', { h1: { fontSize: '48px' } });
    const { violations } = runAudit('h1');
    const fv = violations.filter(v => v.property === 'font-size');
    expect(fv).toHaveLength(0);
  });

  it('flags h1 below minimum (e.g. 20px)', () => {
    setupDOM('<h1>Title</h1>', { h1: { fontSize: '20px' } });
    const { violations } = runAudit('h1');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'font-size', element: 'h1' }),
      ])
    );
  });

  it('flags h2 above maximum', () => {
    setupDOM('<h2>Sub</h2>', { h2: { fontSize: '80px' } });
    const { violations } = runAudit('h2');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'font-size', element: 'h2' }),
      ])
    );
  });

  it('does not flag font size when value is unparseable', () => {
    setupDOM('<h3>Sub</h3>', { h3: { fontSize: 'inherit' } });
    const { violations } = runAudit('h3');
    const fv = violations.filter(v => v.property === 'font-size' && v.element === 'h3');
    expect(fv).toHaveLength(0);
  });
});

// Line-height violations 

describe('Line-height audit', () => {
  it('flags <p> with lineHeight "normal"', () => {
    setupDOM('<p>text</p>', { p: { lineHeight: 'normal' } });
    const { violations } = runAudit('p');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'line-height', element: 'p' }),
      ])
    );
  });

  it('flags <label> with missing lineHeight', () => {
    setupDOM('<label>Field</label>', { label: { lineHeight: '' } });
    const { violations } = runAudit('label');
    expect(violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'line-height' })])
    );
  });

  it('does not flag <p> with explicit lineHeight', () => {
    setupDOM('<p>text</p>', { p: { lineHeight: '1.6' } });
    const { violations } = runAudit('p');
    const lh = violations.filter(v => v.property === 'line-height');
    expect(lh).toHaveLength(0);
  });

  it('skips non-text elements like <div>', () => {
    setupDOM('<div></div>', { div: { lineHeight: 'normal' } });
    const { violations } = runAudit('div');
    const lh = violations.filter(v => v.property === 'line-height');
    expect(lh).toHaveLength(0);
  });
});

// Heading hierarchy 

describe('Heading hierarchy audit', () => {
  it('passes a correct h1 → h2 → h3 sequence', () => {
    setupDOM('<h1>T</h1><h2>S</h2><h3>SS</h3>');
    const { violations } = runAudit('h1, h2, h3');
    const hv = violations.filter(v => v.property === 'heading-hierarchy');
    expect(hv).toHaveLength(0);
  });

  it('flags skipped level h1 → h3', () => {
    setupDOM('<h1>Title</h1><h3>Skip</h3>');
    const { violations } = runAudit('h1, h3');
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'heading-hierarchy',
          violation: expect.stringContaining('skipped'),
        }),
      ])
    );
  });

  it('handles page with no headings', () => {
    setupDOM('<p>No headings here</p>', { p: { lineHeight: '1.5' } });
    const { violations } = runAudit('p');
    const hv = violations.filter(v => v.property === 'heading-hierarchy');
    expect(hv).toHaveLength(0);
  });
});

// Summary object 

describe('runAudit — summary', () => {
  it('returns correct counts in summary', () => {
    setupDOM('<h1>T</h1><p>body</p>', {
      h1: { fontSize: '10px' },  // out-of-range → 1 typography violation
      p:  { lineHeight: 'normal' }, // → 1 line-height violation
    });
    const { summary } = runAudit('h1, p');
    expect(summary.typographyViolations).toBeGreaterThanOrEqual(1);
    expect(summary.lineHeightViolations).toBeGreaterThanOrEqual(1);
    expect(summary.totalViolations).toBe(
      summary.spacingViolations +
      summary.typographyViolations +
      summary.lineHeightViolations +
      summary.hierarchyViolations
    );
  });
});

//  printAuditReport

describe('printAuditReport', () => {
  it('calls console.group, console.table or console.log, and groupEnd', () => {
    setupDOM('<main><p>ok</p></main>', {
      main: {},
      p: { lineHeight: '1.5' },
    });
    const groupSpy   = jest.spyOn(console, 'group').mockImplementation(() => {});
    const groupEnd   = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const logSpy     = jest.spyOn(console, 'log').mockImplementation(() => {});
    const tableSpy   = jest.spyOn(console, 'table').mockImplementation(() => {});

    const result = printAuditReport();
    expect(groupSpy).toHaveBeenCalled();
    expect(groupEnd).toHaveBeenCalled();
    expect(result).toHaveProperty('violations');
    expect(result).toHaveProperty('summary');
  });
});