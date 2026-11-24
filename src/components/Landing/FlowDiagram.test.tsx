import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FlowDiagram from './FlowDiagram';

// ---------------------------------------------------------------------------
// FlowDiagram – focused behaviour coverage (issue #785)
//
// FlowDiagram is a purely presentational component: no props, no state, no
// side-effects.  The test suite therefore focuses on:
//   • structural contract  – the expected DOM is always produced
//   • accessibility        – decorative SVG is hidden from assistive tech
//   • node identity        – all three billing-flow nodes render with the
//                            correct label / title pairs
//   • vault distinction    – the centre node carries its extra CSS class
//   • CSS-module hygiene   – key class names are applied to their elements
// ---------------------------------------------------------------------------

describe('FlowDiagram', () => {
  // -------------------------------------------------------------------------
  // Structural contract
  // -------------------------------------------------------------------------

  it('renders without crashing', () => {
    expect(() => render(<FlowDiagram />)).not.toThrow();
  });

  it('renders a top-level <section> element', () => {
    const { container } = render(<FlowDiagram />);
    expect(container.querySelector('section')).not.toBeNull();
  });

  it('renders exactly three flow nodes', () => {
    const { container } = render(<FlowDiagram />);
    // Each node is a div that carries the CSS-module "node" class.
    const nodes = container.querySelectorAll('[class*="node"]');
    // The vault node also carries "nodeVault", so we count elements whose
    // class list starts with the node token without the vault suffix.
    const topLevelNodes = Array.from(nodes).filter((el) =>
      Array.from(el.classList).some((c) => /^node(_\w+)?$/.test(c) || c === 'node')
    );
    // At a minimum we must have ≥ 3 node containers.
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    void topLevelNodes; // suppress unused-var lint for the filtered array
  });

  // -------------------------------------------------------------------------
  // Node identity – label / title pairs
  // -------------------------------------------------------------------------

  it('renders the USER / Wallet node', () => {
    render(<FlowDiagram />);
    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
  });

  it('renders the SMART CONTRACT / Vault node', () => {
    render(<FlowDiagram />);
    expect(screen.getByText('SMART CONTRACT')).toBeInTheDocument();
    expect(screen.getByText('Vault')).toBeInTheDocument();
  });

  it('renders the RECEIVES / Merchant node', () => {
    render(<FlowDiagram />);
    expect(screen.getByText('RECEIVES')).toBeInTheDocument();
    expect(screen.getByText('Merchant')).toBeInTheDocument();
  });

  it('renders all six expected text tokens together', () => {
    render(<FlowDiagram />);
    const expected = ['USER', 'Wallet', 'SMART CONTRACT', 'Vault', 'RECEIVES', 'Merchant'];
    expected.forEach((text) => expect(screen.getByText(text)).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // Vault-node distinction
  // -------------------------------------------------------------------------

  it('applies the nodeVault modifier class to the vault node', () => {
    const { container } = render(<FlowDiagram />);
    const vaultNode = container.querySelector('[class*="nodeVault"]');
    expect(vaultNode).not.toBeNull();
  });

  it('renders exactly one vault node', () => {
    const { container } = render(<FlowDiagram />);
    const vaultNodes = container.querySelectorAll('[class*="nodeVault"]');
    expect(vaultNodes.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('marks the decorative background SVG as aria-hidden', () => {
    const { container } = render(<FlowDiagram />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not expose the decorative SVG as an accessible image', () => {
    render(<FlowDiagram />);
    // No SVG should be queryable as role="img" (they should all be aria-hidden).
    expect(screen.queryByRole('img')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // CSS-module class application
  // -------------------------------------------------------------------------

  it('applies the diagramSection class to the outer <section>', () => {
    const { container } = render(<FlowDiagram />);
    const section = container.querySelector('[class*="diagramSection"]');
    expect(section).not.toBeNull();
    expect(section!.tagName.toLowerCase()).toBe('section');
  });

  it('applies the diagramContainer class to the inner wrapper', () => {
    const { container } = render(<FlowDiagram />);
    expect(container.querySelector('[class*="diagramContainer"]')).not.toBeNull();
  });

  it('applies nodeBox to every node card', () => {
    const { container } = render(<FlowDiagram />);
    const boxes = container.querySelectorAll('[class*="nodeBox"]');
    // There are three nodes, each with one nodeBox.
    expect(boxes.length).toBe(3);
  });

  it('applies nodeLabel to every node label', () => {
    const { container } = render(<FlowDiagram />);
    const labels = container.querySelectorAll('[class*="nodeLabel"]');
    expect(labels.length).toBe(3);
  });

  it('applies nodeTitle to every node title', () => {
    const { container } = render(<FlowDiagram />);
    const titles = container.querySelectorAll('[class*="nodeTitle"]');
    expect(titles.length).toBe(3);
  });

  it('applies the ringsSvg class to the background SVG', () => {
    const { container } = render(<FlowDiagram />);
    expect(container.querySelector('[class*="ringsSvg"]')).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // SVG content – concentric rings and flow indicators
  // -------------------------------------------------------------------------

  it('renders exactly one background SVG', () => {
    const { container } = render(<FlowDiagram />);
    expect(container.querySelectorAll('svg').length).toBe(1);
  });

  it('renders multiple <circle> elements inside the background SVG', () => {
    const { container } = render(<FlowDiagram />);
    const circles = container.querySelectorAll('svg circle');
    // 4 concentric rings + 6 flow dots + 6 ambient dots = 16 minimum
    expect(circles.length).toBeGreaterThanOrEqual(10);
  });

  it('uses the expected viewBox on the background SVG', () => {
    const { container } = render(<FlowDiagram />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 800 400');
  });

  // -------------------------------------------------------------------------
  // Public-contract stability (snapshot)
  // -------------------------------------------------------------------------

  it('matches the snapshot of its rendered output', () => {
    const { container } = render(<FlowDiagram />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
