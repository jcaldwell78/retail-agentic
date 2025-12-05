import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceMonitor, debounce, throttle, isLowEndDevice, getNetworkInfo, preloadImages } from './performance';

describe('Performance Utilities', () => {
  describe('performanceMonitor', () => {
    beforeEach(() => {
      performanceMonitor.clearMetrics();
    });

    it('records custom metrics', () => {
      performanceMonitor.recordMetric('test-metric', 123.45);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(123.45);
    });

    it('records metrics with metadata', () => {
      performanceMonitor.recordMetric('test-metric', 100, { page: 'home' });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual({ page: 'home' });
    });

    it('measures function execution time', () => {
      const result = performanceMonitor.measure('test-fn', () => {
        return 'result';
      });

      expect(result).toBe('result');

      const metrics = performanceMonitor.getMetricsByName('test-fn');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThanOrEqual(0);
    });

    it('measures async function execution time', async () => {
      const result = await performanceMonitor.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });

      expect(result).toBe('async-result');

      const metrics = performanceMonitor.getMetricsByName('async-test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThanOrEqual(10);
    });

    it('calculates average metric value', () => {
      performanceMonitor.recordMetric('avg-test', 10);
      performanceMonitor.recordMetric('avg-test', 20);
      performanceMonitor.recordMetric('avg-test', 30);

      const avg = performanceMonitor.getAverageMetric('avg-test');
      expect(avg).toBe(20);
    });

    it('returns 0 for average of non-existent metric', () => {
      const avg = performanceMonitor.getAverageMetric('non-existent');
      expect(avg).toBe(0);
    });

    it('clears all metrics', () => {
      performanceMonitor.recordMetric('test1', 100);
      performanceMonitor.recordMetric('test2', 200);

      expect(performanceMonitor.getMetrics()).toHaveLength(2);

      performanceMonitor.clearMetrics();

      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });

    it('gets metrics by name', () => {
      performanceMonitor.recordMetric('metric-a', 10);
      performanceMonitor.recordMetric('metric-b', 20);
      performanceMonitor.recordMetric('metric-a', 30);

      const metricsA = performanceMonitor.getMetricsByName('metric-a');
      expect(metricsA).toHaveLength(2);
      expect(metricsA[0].value).toBe(10);
      expect(metricsA[1].value).toBe(30);
    });

    it('creates performance marks', () => {
      const markSpy = vi.spyOn(performance, 'mark');

      performanceMonitor.mark('test-mark');

      expect(markSpy).toHaveBeenCalledWith('test-mark');

      markSpy.mockRestore();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('limits function execution rate', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('allows execution after limit period', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('passes arguments to throttled function', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('arg1');
      expect(fn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('isLowEndDevice', () => {
    it('returns boolean value', () => {
      const result = isLowEndDevice();
      expect(typeof result).toBe('boolean');
    });

    it('detects low-end device based on hardware concurrency', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        writable: true,
        configurable: true,
      });

      const result = isLowEndDevice();
      expect(result).toBe(true);
    });
  });

  describe('getNetworkInfo', () => {
    it('returns network information if available', () => {
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
        configurable: true,
      });

      const info = getNetworkInfo();
      expect(info).toEqual(mockConnection);
    });

    it('returns null if connection API not available', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const info = getNetworkInfo();
      expect(info).toBeNull();
    });
  });

  describe('preloadImages', () => {
    it('preloads images successfully', async () => {
      const urls = ['/image1.jpg', '/image2.jpg'];

      // Mock the Image constructor
      const mockImages: HTMLImageElement[] = [];
      const originalImage = global.Image;

      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          mockImages.push(this as any);
          // Simulate immediate load
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      };

      const promise = preloadImages(urls);
      await expect(promise).resolves.toBeDefined();

      // Restore original Image
      global.Image = originalImage;
    });

    it('rejects when image fails to load', async () => {
      const urls = ['/invalid.jpg'];

      // Mock the Image constructor to fail
      const originalImage = global.Image;

      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          // Simulate immediate error
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      };

      const promise = preloadImages(urls);
      await expect(promise).rejects.toThrow();

      // Restore original Image
      global.Image = originalImage;
    });

    it('returns empty array for empty input', async () => {
      const result = await preloadImages([]);
      expect(result).toEqual([]);
    });
  });
});
