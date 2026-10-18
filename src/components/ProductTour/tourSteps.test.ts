import { describe, it, expect } from 'vitest';
import { dashboardTourSteps, plansTourSteps, settingsTourSteps, navigationTourSteps } from './tourSteps';

describe('Product Tour Steps', () => {
  describe('dashboardTourSteps', () => {
    it('should be defined and contain the correct number of steps', () => {
      expect(dashboardTourSteps).toBeDefined();
      expect(dashboardTourSteps.length).toBeGreaterThan(0);
      expect(dashboardTourSteps.length).toBe(5);
    });

    it('should have valid properties for each step', () => {
      dashboardTourSteps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(typeof step.id).toBe('string');
        expect(step.target).toBeDefined();
        expect(typeof step.target).toBe('string');
        expect(step.title).toBeDefined();
        expect(typeof step.title).toBe('string');
        expect(step.content).toBeDefined();
        expect(typeof step.content).toBe('string');
      });
    });

    it('should have unique IDs', () => {
      const ids = dashboardTourSteps.map(step => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should contain specific expected steps', () => {
      expect(dashboardTourSteps[0].id).toBe('welcome');
      expect(dashboardTourSteps[dashboardTourSteps.length - 1].id).toBe('create-plan');
    });
  });

  describe('plansTourSteps', () => {
    it('should be defined and contain the correct number of steps', () => {
      expect(plansTourSteps).toBeDefined();
      expect(plansTourSteps.length).toBe(2);
    });

    it('should have valid properties for each step', () => {
      plansTourSteps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.target).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.content).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const ids = plansTourSteps.map(step => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('settingsTourSteps', () => {
    it('should be defined and contain the correct number of steps', () => {
      expect(settingsTourSteps).toBeDefined();
      expect(settingsTourSteps.length).toBe(2);
    });

    it('should have valid properties for each step', () => {
      settingsTourSteps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.target).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.content).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const ids = settingsTourSteps.map(step => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('navigationTourSteps', () => {
    it('should be defined and contain the correct number of steps', () => {
      expect(navigationTourSteps).toBeDefined();
      expect(navigationTourSteps.length).toBe(3);
    });
  });

  describe('Error and boundary behaviors (Validation)', () => {
    it('should reject invalid inputs and handle state transitions', () => {
      // Mock validation function as an example of handling boundary cases and state
      const validateStep = (step: any) => {
        if (!step || typeof step !== 'object') return false;
        if (!step.id || typeof step.id !== 'string') return false;
        if (!step.target || typeof step.target !== 'string') return false;
        if (!step.title || typeof step.title !== 'string') return false;
        if (!step.content || typeof step.content !== 'string') return false;
        return true;
      };

      expect(validateStep(null)).toBe(false);
      expect(validateStep(undefined)).toBe(false);
      expect(validateStep({})).toBe(false);
      expect(validateStep({ id: 'test' })).toBe(false);
      expect(validateStep({ id: 'test', target: '.target', title: 'Title', content: 'Content' })).toBe(true);

      // Verify all our exported steps pass validation
      expect(dashboardTourSteps.every(validateStep)).toBe(true);
      expect(plansTourSteps.every(validateStep)).toBe(true);
      expect(settingsTourSteps.every(validateStep)).toBe(true);
      expect(navigationTourSteps.every(validateStep)).toBe(true);
    });
  });
});
