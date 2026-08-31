# Visual Testing Guide - RevenueChart Polish

This guide helps reviewers verify the visual improvements systematically.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Start Storybook for interactive visual testing
npm run storybook

# Navigate to: Components > RevenueChart
```

## Key Stories to Review

### 1. InteractiveMultiSeries
**URL:** http://localhost:6006/?path=/story/components-revenuechart--interactive-multi-series

**What to verify:**
- ✓ Y-axis labels are larger and bolder than X-axis
- ✓ X-axis labels are compact and readable
- ✓ All labels use consistent font family

**Test actions:**
- Hover over data points → Check tooltip hierarchy
- Press Tab → Focus first data point → Verify 8px focus ring with glow
- Press Arrow Right → Move to next point → Smooth transitions
- Press Escape → Tooltip dismisses

### 2. ComplexMultiSeries
**URL:** http://localhost:6006/?path=/story/components-revenuechart--complex-multi-series

**What to verify:**
- ✓ Dense data with 4 series renders clearly
- ✓ Legend chips maintain readability
- ✓ Y-axis currency labels don't overlap

**Test actions:**
- Click legend chips → Toggle series visibility
- Tab through legend → Verify roving tabindex
- Space on focused chip → Toggle series

### 3. AccessibilityDemo
**URL:** http://localhost:6006/?path=/story/components-revenuechart--accessibility-demo

**What to verify:**
- ✓ Focus indicators clearly visible
- ✓ Drop line appears on active point
- ✓ Pulse ring animation smooth

**Test actions:**
- Navigate entire chart with keyboard only
- Use screen reader → Verify announcements

### 4. RTLPositioning
**URL:** http://localhost:6006/?path=/story/components-revenuechart--rtl-positioning

**What to verify:**
- ✓ Text direction properly reversed
- ✓ Arrow keys reverse (Right=left, Left=right)
- ✓ Tooltip positioning correct

## Visual Comparison Checklist

### Typography Improvements

#### Y-Axis Labels (Currency)
**Before:**
- Fixed 12px font size
- Generic muted color
- Same weight as X-axis

**After:**
- `--text-base` (~16px at base viewport)
- `--font-semibold` (600 weight)
- `--color-text-secondary` (darker, higher contrast)
- Clear hierarchy over X-axis

**How to verify:**
1. Open InteractiveMultiSeries story
2. Inspect Y-axis labels (left side)
3. Confirm they're noticeably larger than X-axis
4. Check contrast with background (should be strong)

#### X-Axis Labels (Dates)
**Before:**
- Same 12px as Y-axis
- No semantic distinction

**After:**
- `--text-xs` (~12px at base viewport)
- `--font-medium` (500 weight)
- `--color-text-muted` (appropriate for supporting detail)
- Compact but readable

**How to verify:**
1. Open DenseData90D story
2. Check X-axis labels don't collide
3. Verify readability at 768px and 480px breakpoints
4. Use browser DevTools responsive mode

### Focus Indicators

#### Data Points
**Before:**
- 7px circle on focus
- Basic drop-shadow (4px blur)
- 3px stroke width

**After:**
- 8px circle on focus
- Dual-layer drop-shadow (6px + 12px blur)
- 4px stroke width
- Uses `--focus-ring-halo` for consistent glow

**How to verify:**
1. Tab to first data point
2. Measure focus ring (should be ≥8px diameter)
3. Observe glow effect around stroke
4. Navigate with arrows → Smooth transitions
5. Compare hover (7px) vs focus (8px) sizes

### Tooltip Visual Hierarchy

**Before:**
- Flat text hierarchy
- 120×60px dimensions
- 6px border-radius
- 1.5px border

**After:**
- Clear 3-tier hierarchy:
  1. Series name: Small, uppercase, muted (TOP)
  2. Revenue value: Large, bold, primary (MIDDLE - EMPHASIS)
  3. Date: Small, medium weight, muted (BOTTOM)
- 140×70px dimensions (more breathing room)
- 8px border-radius (softer corners)
- 2px border (stronger definition)
- Enhanced shadow

**How to verify:**
1. Hover over any data point
2. Observe tooltip appears
3. Check series name is visually de-emphasized (top)
4. Confirm revenue value is most prominent (center)
5. Verify date is supporting detail (bottom)
6. Measure spacing feels balanced

### Active Point Indicators

#### Drop Line
**New Feature:**
- Vertical dashed line from point to X-axis
- Animated fade-in with dash-offset
- 2px stroke, 60% opacity
- Uses `--color-focus-ring`

**How to verify:**
1. Hover or focus any data point
2. Observe vertical line appears from point downward
3. Line should be subtle but visible
4. Animates smoothly (not instant)

#### Pulse Ring
**Before:**
- Simple expansion: 6px → 14px
- Linear opacity fade
- 1.8s duration

**After:**
- 3-stage expansion: 6px → 12px → 16px
- Multi-stage opacity: 50% → 20% → 0%
- 2s duration (slightly slower, more graceful)
- Smoother cubic-bezier easing

**How to verify:**
1. Focus or hover a data point
2. Watch pulse ring expand outward
3. Verify smooth, organic motion
4. Ring should feel less "mechanical"

### Responsive Behavior

#### Tablet (768px)
**Changes:**
- Y-axis: `--text-sm` (~14px)
- X-axis: 10px
- Y-axis max-width: 45px

**How to verify:**
1. Open browser DevTools
2. Set viewport: 768px × 1024px
3. Check Y-axis labels are readable
4. Verify no label overflow
5. X-axis labels don't collide

#### Mobile (480px)
**Changes:**
- X-axis: 9px (further reduced)
- Tooltip: Scaled to 90%
- All spacing adjusts proportionally

**How to verify:**
1. Set viewport: 480px × 812px (iPhone)
2. Verify tooltip doesn't overflow viewport
3. Check all text remains readable
4. Test with DenseData90D story
5. Rotate to landscape → Still functional

### Chart Line Polish

**Before:**
- 2.5px stroke width
- No explicit fill declaration
- Static styling

**After:**
- 3px stroke width (slightly bolder)
- Explicit `fill: none`
- Smooth opacity/stroke-width transitions
- Data point groups have subtle scale on hover

**How to verify:**
1. Open any multi-series story
2. Observe line thickness (should feel substantial)
3. Hover data point group → Subtle scale effect
4. Lines should feel professional, not thin/weak

### Grid Lines

**Before:**
- 0.7 opacity

**After:**
- 0.5 opacity (more subtle)
- Less visual noise

**How to verify:**
1. Open any story
2. Grid lines should be present but unobtrusive
3. Focus should be on data, not grid
4. Grid provides structure without dominating

## Accessibility Testing Protocol

### Keyboard Navigation Test

**Full sequence:**
1. Press Tab → Chart receives focus
2. First data point has focus ring (8px with glow)
3. Press Arrow Right → Next point gains focus
4. Press Arrow Down → Switch to next series (same date)
5. Press Home → Jump to first point
6. Press End → Jump to last point
7. Press Escape → Clear focus, tooltip dismissed
8. Tab out → Focus leaves chart

**Expected:**
- All transitions smooth (0.2s)
- Focus ring always visible
- No focus traps
- Screen reader announces each move

### Screen Reader Test

**Using NVDA or JAWS:**
1. Navigate to chart
2. Hear: "Revenue over time, region"
3. Enter chart → Hear: Summary description with series names
4. Focus point → Hear: "Series name, date, value, up/down from previous, point X of Y"
5. Toggle legend → Hear: "Series name shown/hidden"
6. All announcements clear and timely

### Reduced Motion Test

**How to verify:**
1. Enable reduced motion:
   - Windows: Settings → Ease of Access → Display → Animation
   - Mac: System Preferences → Accessibility → Display → Reduce motion
2. Reload page
3. Animations should be instant (no motion)
4. Functionality preserved
5. Focus indicators still visible

## Browser Testing Matrix

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✓ Test | ✓ Test | Primary target |
| Firefox | ✓ Test | N/A | Focus ring rendering |
| Safari | ✓ Test | ✓ Test | iOS specifics |
| Edge | ✓ Test | N/A | Chromium-based |

### Browser-Specific Checks

#### Safari (Desktop & iOS)
- Verify focus rings render (Safari sometimes clips)
- Check drop-shadow filter support
- Test touch interactions on iOS

#### Firefox
- Verify focus ring glow appears
- Check SVG filter performance
- Test keyboard navigation

## Edge Cases to Verify

### 1. Long Currency Labels
**Test:** Y-axis with values like $1,234,567,890

**Expected:**
- Desktop: Full value shown
- Tablet: Readable, may abbreviate
- Mobile: Ellipsis applied, no overflow

**How to test:**
1. Modify story data to include large values
2. Check at all breakpoints
3. Use browser text zoom (Ctrl +)

### 2. Dense Data Points
**Test:** 90D story with 90 data points

**Expected:**
- X-axis labels intelligently spaced
- No overlapping labels
- Focus navigation still smooth
- Tooltip positioning works at edges

**How to test:**
1. Open DenseData90D story
2. Navigate to edge points (first, last)
3. Verify tooltip doesn't clip viewport
4. Check X-axis label spacing

### 3. Single Data Point
**Test:** Series with only one data point

**Expected:**
- Point centered horizontally
- Tooltip positions correctly
- No division-by-zero errors
- X-axis label appears

**How to test:**
1. Create custom story with single point
2. Verify centering
3. Hover/focus → Tooltip works
4. No console errors

### 4. All Series Hidden
**Test:** Toggle all series to hidden via legend

**Expected:**
- Warning alert appears
- Last remaining series chip disables
- Chart gracefully handles empty state
- No crashes

**How to test:**
1. Open ComplexMultiSeries story
2. Toggle all series off except one
3. Try to toggle last series
4. Should be disabled with aria-describedby hint

## Contrast Verification

### Tool: WebAIM Contrast Checker
**URL:** https://webaim.org/resources/contrastchecker/

### Text to Verify

1. **Y-axis labels**
   - Foreground: `--color-text-secondary` (varies by theme)
   - Background: `--color-surface-elevated` or chart area
   - Required: ≥4.5:1
   - Test in light and dark themes

2. **X-axis labels**
   - Foreground: `--color-text-muted`
   - Background: Chart area
   - Required: ≥4.5:1

3. **Tooltip series name**
   - Foreground: `--color-text-muted`
   - Background: `--chart-tooltip-bg`
   - Required: ≥4.5:1

4. **Tooltip value**
   - Foreground: `--color-text-primary`
   - Background: `--chart-tooltip-bg`
   - Expected: ≥7:1 (AAA)

### How to Verify
1. Take screenshot of chart
2. Use color picker to get hex values
3. Input into contrast checker
4. Document ratios in PR

## Performance Verification

### Animation Performance
**Goal:** 60fps on animations

**How to test:**
1. Open Chrome DevTools
2. Performance tab → Record
3. Hover over multiple data points rapidly
4. Stop recording
5. Check frame rate stays ≥60fps
6. Look for dropped frames (should be minimal)

### CPU Usage
**Goal:** Minimal CPU on idle

**How to test:**
1. Open chart in browser
2. Don't interact
3. Check CPU usage (should be ~0%)
4. Pulse ring should be GPU-accelerated

## Regression Checklist

Ensure these existing features still work:

- [ ] Time range selector (7D, 30D, 90D)
- [ ] View mode toggle (Chart/Table)
- [ ] CSV export from table view
- [ ] Legend toggle with visibility tracking
- [ ] Multi-series line rendering
- [ ] Pattern fills for hidden series
- [ ] Roving tabindex in legend
- [ ] RTL arrow key reversal
- [ ] Live region announcements
- [ ] Tooltip boundary clamping
- [ ] SVG viewBox responsiveness
- [ ] Custom data prop support
- [ ] Custom series prop support
- [ ] Custom ariaLabel prop

## Sign-Off Criteria

Reviewer should confirm:

- [ ] Typography visually improved and uses tokens
- [ ] Focus indicators meet 3px minimum visibility
- [ ] Tooltip hierarchy is clear and readable
- [ ] Responsive breakpoints work smoothly
- [ ] All keyboard navigation preserved
- [ ] Screen reader testing passes
- [ ] No visual regressions in existing features
- [ ] Performance remains smooth (≥60fps)
- [ ] Contrast ratios verified (≥4.5:1)
- [ ] All edge cases handled gracefully

## Questions for Reviewer

If any visual aspect is unclear:

1. **Typography too bold?** → Design decision for hierarchy, can be adjusted
2. **Tooltip too large?** → Sized for readability on mobile, can be tweaked
3. **Focus ring too prominent?** → Required for WCAG AA, can't reduce much
4. **Animations too slow?** → Balanced for smoothness, open to feedback
5. **Grid lines too faint?** → Intentionally subtle, easy to adjust

---

**Testing Time Estimate:** 20-30 minutes for thorough review  
**Required Tools:** Modern browser, DevTools, screen reader (optional but recommended)
