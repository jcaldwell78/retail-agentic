// Test setup file for Vitest
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { toHaveNoViolations } from 'jest-axe'

// Extend Vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfills for Radix UI components

// hasPointerCapture (needed by Radix UI Select)
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = function() {
    return false;
  };
}

// setPointerCapture and releasePointerCapture
if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = function() {
    // Mock implementation
  };
}

if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = function() {
    // Mock implementation
  };
}

// scrollIntoView (needed by Radix UI Select)
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = function() {
    // Mock implementation
  };
}

// File.text() polyfill for JSDOM (needed for file upload tests)
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function() {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(this);
    });
  };
}

// Extend Vitest matchers if needed
