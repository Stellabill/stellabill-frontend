import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FocusableElement {
  element: HTMLElement;
  rect: DOMRect;
  index: number;
  isTrap: boolean;
  isHidden: boolean;
  isSkipped: boolean;
  isOutOfOrder: boolean;
}

export default function FocusOrderVisualizer({ onClose }: { onClose: () => void }) {
  const [elements, setElements] = useState<FocusableElement[]>([]);
  
  useEffect(() => {
    const updateFocusOrder = () => {
      // Find elements that are normally focusable
      const selector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';
      const nodes = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      
      const parsedElements: FocusableElement[] = [];
      let index = 1;
      
      nodes.forEach((el) => {
        // Skip elements within the visualizer itself
        if (el.closest('.focus-order-visualizer')) return;

        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isHidden = rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none' || el.hasAttribute('hidden');
        
        const tabindexAttr = el.getAttribute('tabindex');
        const tabindex = tabindexAttr ? parseInt(tabindexAttr, 10) : 0;
        
        const isSkipped = el.tabIndex === -1;
        const isOutOfOrder = tabindex > 0;
        // Simple trap detection: element is not hidden but its width/height are very small, or it's absolutely positioned way off screen
        const isTrap = !isHidden && (rect.width <= 1 && rect.height <= 1 || rect.left < -999 || rect.top < -999);
        
        parsedElements.push({
          element: el,
          rect,
          index: index++,
          isTrap,
          isHidden,
          isSkipped,
          isOutOfOrder
        });
      });
      
      setElements(parsedElements);
    };

    updateFocusOrder();
    
    window.addEventListener('resize', updateFocusOrder);
    window.addEventListener('scroll', updateFocusOrder, true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', updateFocusOrder);
      window.removeEventListener('scroll', updateFocusOrder, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const copyReport = () => {
    const reportLines = elements.map(e => {
      const tag = e.element.tagName.toLowerCase();
      const id = e.element.id ? `#${e.element.id}` : '';
      const classes = e.element.className ? `.${e.element.className.replace(/\s+/g, '.')}` : '';
      return `[${e.index}] ${tag}${id}${classes} - hidden: ${e.isHidden}, skipped: ${e.isSkipped}, outOfOrder: ${e.isOutOfOrder}, trap: ${e.isTrap}`;
    });
    navigator.clipboard.writeText(reportLines.join('\n')).catch(() => {});
  };

  return createPortal(
    <div className="focus-order-visualizer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }} role="dialog" aria-label="Focus Order Visualizer QA Overlay">
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff00ff" />
          </marker>
        </defs>
        {elements.map((el, i) => {
          if (i === 0) return null;
          const prev = elements[i - 1];
          if (el.isHidden || prev.isHidden) return null;
          
          const x1 = prev.rect.left + prev.rect.width / 2;
          const y1 = prev.rect.top + prev.rect.height / 2;
          const x2 = el.rect.left + el.rect.width / 2;
          const y2 = el.rect.top + el.rect.height / 2;
          
          return (
            <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff00ff" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead)" />
          );
        })}
      </svg>
      
      {elements.map((el, i) => {
        if (el.isHidden) return null;
        let borderColor = '#0066cc'; // Default: blue
        if (el.isSkipped) borderColor = '#888888'; // gray
        if (el.isOutOfOrder) borderColor = '#ff9900'; // orange
        if (el.isTrap) borderColor = '#e60000'; // red
        
        return (
          <div key={i} style={{
            position: 'absolute',
            top: el.rect.top,
            left: el.rect.left,
            width: el.rect.width,
            height: el.rect.height,
            border: `2px solid ${borderColor}`,
            boxSizing: 'border-box',
            pointerEvents: 'none'
          }} aria-hidden="true">
            <span style={{
              position: 'absolute',
              top: -12,
              left: -12,
              background: borderColor,
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 'bold',
              border: '2px solid white'
            }}>
              {el.index}
            </span>
          </div>
        );
      })}
      
      <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '16px', borderRadius: '8px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Focus Order QA</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#0066cc', borderRadius: '2px' }}></span> Normal</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#888888', borderRadius: '2px' }}></span> Skipped</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ff9900', borderRadius: '2px' }}></span> Out of Order</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e60000', borderRadius: '2px' }}></span> Trap</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={copyReport} style={{ flex: 1, background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Copy Report</button>
          <button onClick={onClose} style={{ flex: 1, background: '#475569', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Close (Esc)</button>
        </div>
      </div>
    </div>
  , document.body);
}
