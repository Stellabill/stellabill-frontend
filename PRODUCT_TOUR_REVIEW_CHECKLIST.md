# Product Tour - Code Review Checklist

## 📋 Pre-Review Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Run development server
npm run dev

# 3. Run tests
npm test

# 4. Run linter
npm run lint

# 5. Start Storybook
npm run storybook
```

## ✅ Code Review Checklist

### Architecture & Design

- [ ] **Component Structure**: Is the component hierarchy logical and maintainable?
- [ ] **File Organization**: Are files organized in the correct directories?
- [ ] **Separation of Concerns**: Is business logic separated from presentation?
- [ ] **Reusability**: Can components be easily reused in other contexts?
- [ ] **Dependencies**: Are all dependencies necessary and properly declared?

### Code Quality

- [ ] **TypeScript**: All types properly defined, no `any` usage?
- [ ] **Naming**: Are variables, functions, and components clearly named?
- [ ] **Comments**: Is complex logic explained with comments?
- [ ] **Dead Code**: No unused imports, variables, or functions?
- [ ] **Consistency**: Does code follow existing project patterns?
- [ ] **Error Handling**: Are edge cases and errors handled gracefully?

### Functionality

- [ ] **Tour Opens**: Does tour auto-open on first visit?
- [ ] **Navigation**: Can you navigate forward and backward?
- [ ] **Spotlight**: Does the spotlight highlight correct elements?
- [ ] **Positioning**: Does tooltip position correctly on all steps?
- [ ] **Dismissal**: Can you dismiss with "Show me later"?
- [ ] **Completion**: Does completion modal appear?
- [ ] **Restart**: Can you restart tour from sidebar?
- [ ] **Persistence**: Does state persist across page reloads?
- [ ] **Viewport Adjustment**: Does tooltip stay in viewport?

### Accessibility (WCAG 2.1 AA)

#### Keyboard Navigation
- [ ] **Tab**: Can you tab through all interactive elements?
- [ ] **Shift+Tab**: Does reverse tab navigation work?
- [ ] **Escape**: Does Escape key close the tour?
- [ ] **Enter**: Does Enter activate focused buttons?
- [ ] **Focus Trap**: Is focus trapped within tooltip?
- [ ] **Focus Visible**: Are focus indicators clearly visible?
- [ ] **Focus Restore**: Is focus restored when tour closes?

#### Screen Reader Support
- [ ] **ARIA Roles**: Are dialog roles properly set?
- [ ] **ARIA Labels**: Are all controls labeled?
- [ ] **Live Regions**: Do step changes announce?
- [ ] **Current Step**: Is current step communicated?
- [ ] **Progress**: Is progress (1 of 5) announced?

#### Visual Accessibility
- [ ] **Contrast**: Does spotlight have sufficient contrast?
- [ ] **Text Size**: Is text readable at all sizes?
- [ ] **Color**: Is information not conveyed by color alone?
- [ ] **Touch Targets**: Are all targets ≥44×44px?

#### Reduced Motion
- [ ] **Preference Respected**: Test with `prefers-reduced-motion: reduce`
- [ ] **No Jarring Motion**: Animations are subtle or disabled

### Responsive Design

#### Mobile (< 480px)
- [ ] **Layout**: Tooltip adapts to narrow screen
- [ ] **Touch**: Touch interactions work properly
- [ ] **Viewport**: No horizontal scroll
- [ ] **Readability**: Content is readable

#### Tablet (480-768px)
- [ ] **Layout**: Tooltip width appropriate
- [ ] **Placement**: All placements work
- [ ] **Touch**: Touch targets accessible

#### Desktop (> 768px)
- [ ] **Layout**: Full feature set available
- [ ] **Placement**: All placements work correctly
- [ ] **Interactions**: Mouse interactions smooth

### Testing

#### Unit Tests
- [ ] **Component Tests**: All tests pass
- [ ] **Hook Tests**: All tests pass
- [ ] **Coverage**: Coverage >95%
- [ ] **Edge Cases**: Edge cases tested
- [ ] **Mocks**: Mocks are appropriate

#### Manual Testing
- [ ] **Happy Path**: Complete tour end-to-end
- [ ] **Skip Path**: Dismiss and verify persistence
- [ ] **Restart Path**: Restart tour successfully
- [ ] **Error Scenarios**: Handle missing targets
- [ ] **Multiple Tours**: Test multiple tour instances

### Performance

- [ ] **Bundle Size**: Check impact on bundle size
- [ ] **First Paint**: Tour appears quickly (<100ms)
- [ ] **Interactions**: All interactions <50ms latency
- [ ] **Memory**: No memory leaks on unmount
- [ ] **Re-renders**: Minimal unnecessary re-renders

### Browser Compatibility

- [ ] **Chrome/Edge**: Works in latest version
- [ ] **Firefox**: Works in latest version
- [ ] **Safari**: Works in latest version
- [ ] **Mobile Safari**: Works on iOS
- [ ] **Chrome Android**: Works on Android

### Documentation

- [ ] **README**: Clear usage instructions
- [ ] **API Reference**: All props documented
- [ ] **Examples**: Working code examples provided
- [ ] **Troubleshooting**: Common issues addressed
- [ ] **Comments**: Code comments are helpful
- [ ] **TypeScript**: JSDoc comments for complex types

### Security

- [ ] **XSS**: Content properly escaped
- [ ] **localStorage**: Graceful fallback if unavailable
- [ ] **Dependencies**: No vulnerable dependencies
- [ ] **User Input**: No unsanitized user input

### Integration

- [ ] **Dashboard**: Properly integrated
- [ ] **Layout**: Restart button works
- [ ] **Command Palette**: Tour action present
- [ ] **Styling**: No style conflicts
- [ ] **Dependencies**: No circular dependencies

## 🔍 Detailed Testing Scenarios

### Scenario 1: First-Time User
1. Clear localStorage
2. Navigate to dashboard
3. Wait 800ms
4. **Expected**: Tour opens automatically
5. Navigate through all steps
6. Complete tour
7. **Expected**: Completion modal shows

### Scenario 2: Returning User
1. Complete tour once
2. Reload page
3. **Expected**: Tour does not open
4. Check localStorage
5. **Expected**: `sb:tour-completed` = true

### Scenario 3: Dismissed Tour
1. Open tour
2. Click "Show me later"
3. **Expected**: Tour closes
4. Reload page
5. **Expected**: Tour does not open
6. Check localStorage
7. **Expected**: `sb:tour-dismissed` = true

### Scenario 4: Manual Restart
1. Complete tour
2. Click "Product tour" in sidebar
3. **Expected**: Page reloads, tour restarts
4. Or search "Start product tour" in command palette
5. **Expected**: Same behavior

### Scenario 5: Keyboard Navigation
1. Open tour
2. Press Tab repeatedly
3. **Expected**: Focus cycles through buttons
4. Press Escape
5. **Expected**: Tour closes
6. **Expected**: Focus returns to previous element

### Scenario 6: Screen Reader
1. Enable screen reader (NVDA/VoiceOver)
2. Open tour
3. Navigate through all controls
4. **Expected**: All content announced
5. **Expected**: Current step announced
6. **Expected**: Progress announced

### Scenario 7: Mobile Touch
1. Open on mobile device
2. Tap outside tooltip
3. **Expected**: Tour closes (or stays, depending on design)
4. Restart tour
5. Tap all buttons
6. **Expected**: All touch targets work

### Scenario 8: Reduced Motion
1. Enable reduced motion in OS
2. Open tour
3. **Expected**: No animations (or minimal)
4. Navigate through steps
5. **Expected**: Instant transitions

### Scenario 9: Missing Target
1. Create step with invalid selector
2. Open tour
3. **Expected**: No crash, warning in console
4. Tour still functions

### Scenario 10: Very Long Content
1. Create step with very long content
2. Open tour
3. **Expected**: Tooltip scrolls or adjusts
4. **Expected**: No layout breaking

## 🐛 Known Issues & Limitations

- [ ] **Reviewed**: All known limitations documented
- [ ] **Acceptable**: Limitations are acceptable for MVP
- [ ] **Tracked**: Issues tracked in GitHub/Jira

## 📊 Performance Benchmarks

Run these benchmarks and record results:

```bash
# Bundle size
npm run build
# Check dist/assets/*.js file sizes

# Lighthouse score
npm run dev
# Run Lighthouse audit on dashboard

# Test coverage
npm run test:coverage
# Verify >95% coverage
```

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Bundle Size | <20KB gzipped | ___ KB | [ ] |
| First Paint | <100ms | ___ ms | [ ] |
| Test Coverage | >95% | ___% | [ ] |
| Lighthouse Score | >90 | ___ | [ ] |

## ✨ Final Approval Checklist

### Functional Requirements
- [ ] All acceptance criteria met
- [ ] No blocking bugs
- [ ] Edge cases handled
- [ ] Error messages clear

### Code Quality
- [ ] ESLint passing
- [ ] TypeScript strict mode
- [ ] No console warnings
- [ ] Code is maintainable

### Testing
- [ ] All tests passing
- [ ] Coverage >95%
- [ ] Manual testing complete
- [ ] Accessibility tested

### Documentation
- [ ] README complete
- [ ] API documented
- [ ] Examples provided
- [ ] Troubleshooting guide

### Security & Performance
- [ ] No vulnerabilities
- [ ] Performance acceptable
- [ ] Memory leaks checked
- [ ] Browser compatibility verified

## 👍 Approval

**Reviewer**: ___________________

**Date**: ___________________

**Status**: 
- [ ] ✅ Approved - Ready to merge
- [ ] ⚠️ Approved with minor comments
- [ ] ❌ Changes requested

**Comments**:
```
[Add any additional comments or feedback here]
```

---

## 📝 Reviewer Notes Template

```markdown
## Positive Findings
- [What worked well]
- [Good patterns observed]
- [Exceptional quality areas]

## Areas for Improvement
- [Code quality suggestions]
- [Performance optimizations]
- [Architectural recommendations]

## Questions
- [Clarifications needed]
- [Design decisions to discuss]
- [Future considerations]

## Blocking Issues
- [Critical bugs]
- [Must-fix before merge]

## Non-Blocking Issues
- [Nice-to-haves]
- [Future enhancements]
- [Technical debt to track]
```

## 🎯 Summary

After completing this checklist:

1. All functionality tested ✅
2. Accessibility verified ✅
3. Performance benchmarked ✅
4. Documentation reviewed ✅
5. Security checked ✅
6. Ready for deployment ✅

**Sign-off**: This implementation meets all quality standards and is ready for production deployment.
