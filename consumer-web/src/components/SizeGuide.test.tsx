import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import {
  SizeGuideButton,
  SizeGuideContent,
  SizeChartTable,
  FitFinder,
  FitFinderResultCard,
  MeasuringGuide,
  InlineSizeSelector,
  useSizeGuide,
  defaultClothingSizeChart,
  defaultShoesSizeChart,
  type SizeChart,
  type FitFinderResult,
} from './SizeGuide';

const mockClothingSizeChart: SizeChart = {
  category: 'clothing',
  gender: 'unisex',
  measurementUnit: 'cm',
  sizes: [
    { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', chest: 86, waist: 66, hips: 91 },
    { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', chest: 91, waist: 71, hips: 97 },
    { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', chest: 97, waist: 76, hips: 102 },
  ],
};

const mockShoesSizeChart: SizeChart = {
  category: 'shoes',
  gender: 'unisex',
  measurementUnit: 'cm',
  sizes: [
    { size: '40', us: '8', uk: '7', eu: '40', footLength: 25.1, width: 'Regular' },
    { size: '41', us: '9', uk: '8', eu: '41', footLength: 25.8, width: 'Regular' },
    { size: '42', us: '10', uk: '9', eu: '42', footLength: 26.5, width: 'Regular' },
  ],
};

describe('SizeGuideButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render size guide button', () => {
    render(<SizeGuideButton />);
    expect(screen.getByTestId('size-guide-button')).toBeInTheDocument();
    expect(screen.getByText('Size Guide')).toBeInTheDocument();
  });

  it('should open dialog when clicked', async () => {
    render(<SizeGuideButton />);

    await userEvent.click(screen.getByTestId('size-guide-button'));

    await waitFor(() => {
      expect(screen.getByTestId('size-guide-dialog')).toBeInTheDocument();
    });
  });

  it('should display product name in dialog', async () => {
    render(<SizeGuideButton productName="Blue T-Shirt" />);

    await userEvent.click(screen.getByTestId('size-guide-button'));

    await waitFor(() => {
      expect(screen.getByText(/Blue T-Shirt/)).toBeInTheDocument();
    });
  });

  it('should call onSizeSelect when size is selected', async () => {
    const mockOnSizeSelect = vi.fn();
    render(
      <SizeGuideButton
        sizeChart={mockClothingSizeChart}
        onSizeSelect={mockOnSizeSelect}
      />
    );

    await userEvent.click(screen.getByTestId('size-guide-button'));

    await waitFor(() => {
      expect(screen.getByTestId('select-size-M')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('select-size-M'));
    expect(mockOnSizeSelect).toHaveBeenCalledWith('M');
  });

  it('should accept custom className', () => {
    render(<SizeGuideButton className="custom-class" />);
    expect(screen.getByTestId('size-guide-button')).toHaveClass('custom-class');
  });
});

describe('SizeGuideContent', () => {
  it('should render size guide content', () => {
    render(<SizeGuideContent />);
    expect(screen.getByTestId('size-guide-content')).toBeInTheDocument();
  });

  it('should render size chart tab', () => {
    render(<SizeGuideContent />);
    expect(screen.getByTestId('tab-size-chart')).toBeInTheDocument();
  });

  it('should render fit finder tab', () => {
    render(<SizeGuideContent />);
    expect(screen.getByTestId('tab-fit-finder')).toBeInTheDocument();
  });

  it('should switch to fit finder tab', async () => {
    render(<SizeGuideContent />);

    await userEvent.click(screen.getByTestId('tab-fit-finder'));

    expect(screen.getByTestId('fit-finder')).toBeInTheDocument();
  });

  it('should use clothing chart by default', () => {
    render(<SizeGuideContent />);
    expect(screen.getByText('Chest (cm)')).toBeInTheDocument();
    expect(screen.getByText('Waist (cm)')).toBeInTheDocument();
  });

  it('should use shoes chart when category is shoes', () => {
    render(<SizeGuideContent category="shoes" />);
    expect(screen.getByText('Foot Length (cm)')).toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
  });

  it('should use custom size chart when provided', () => {
    render(<SizeGuideContent sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('size-row-S')).toBeInTheDocument();
    expect(screen.getByTestId('size-row-M')).toBeInTheDocument();
    expect(screen.getByTestId('size-row-L')).toBeInTheDocument();
  });
});

describe('SizeChartTable', () => {
  it('should render size chart table', () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('size-chart-table')).toBeInTheDocument();
    expect(screen.getByTestId('size-table')).toBeInTheDocument();
  });

  it('should render all sizes', () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('size-row-S')).toBeInTheDocument();
    expect(screen.getByTestId('size-row-M')).toBeInTheDocument();
    expect(screen.getByTestId('size-row-L')).toBeInTheDocument();
  });

  it('should display US sizes by default', () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);
    expect(screen.getByText('4-6')).toBeInTheDocument(); // S US size
  });

  it('should switch to UK sizes', async () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);

    await userEvent.click(screen.getByTestId('region-select'));
    await userEvent.click(screen.getByText('UK'));

    expect(screen.getByText('8-10')).toBeInTheDocument(); // S UK size
  });

  it('should switch to EU sizes', async () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);

    await userEvent.click(screen.getByTestId('region-select'));
    await userEvent.click(screen.getByText('EU'));

    expect(screen.getByText('36-38')).toBeInTheDocument(); // S EU size
  });

  it('should convert measurements to inches', async () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);

    await userEvent.click(screen.getByTestId('unit-select'));
    await userEvent.click(screen.getByText('in'));

    // 86cm chest = ~33.9 inches
    expect(screen.getByText('33.9')).toBeInTheDocument();
  });

  it('should display select buttons when onSizeSelect provided', () => {
    const mockOnSizeSelect = vi.fn();
    render(
      <SizeChartTable sizeChart={mockClothingSizeChart} onSizeSelect={mockOnSizeSelect} />
    );
    expect(screen.getByTestId('select-size-S')).toBeInTheDocument();
    expect(screen.getByTestId('select-size-M')).toBeInTheDocument();
    expect(screen.getByTestId('select-size-L')).toBeInTheDocument();
  });

  it('should call onSizeSelect when size button clicked', async () => {
    const mockOnSizeSelect = vi.fn();
    render(
      <SizeChartTable sizeChart={mockClothingSizeChart} onSizeSelect={mockOnSizeSelect} />
    );

    await userEvent.click(screen.getByTestId('select-size-M'));
    expect(mockOnSizeSelect).toHaveBeenCalledWith('M');
  });

  it('should highlight selected size', () => {
    render(
      <SizeChartTable
        sizeChart={mockClothingSizeChart}
        onSizeSelect={() => {}}
        selectedSize="M"
      />
    );
    expect(screen.getByTestId('size-row-M')).toHaveClass('bg-blue-50');
  });

  it('should display shoe measurements', () => {
    render(<SizeChartTable sizeChart={mockShoesSizeChart} />);
    expect(screen.getByText('Foot Length (cm)')).toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('25.1')).toBeInTheDocument(); // Size 40 foot length
  });
});

describe('FitFinder', () => {
  it('should render fit finder', () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('fit-finder')).toBeInTheDocument();
  });

  it('should render clothing inputs', () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('input-chest')).toBeInTheDocument();
    expect(screen.getByTestId('input-waist')).toBeInTheDocument();
    expect(screen.getByTestId('input-hips')).toBeInTheDocument();
  });

  it('should render shoe inputs', () => {
    render(<FitFinder category="shoes" sizeChart={mockShoesSizeChart} />);
    expect(screen.getByTestId('input-foot-length')).toBeInTheDocument();
  });

  it('should disable find button when no measurements entered', () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);
    expect(screen.getByTestId('find-size-button')).toBeDisabled();
  });

  it('should enable find button when measurement entered', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-chest'), '90');

    expect(screen.getByTestId('find-size-button')).not.toBeDisabled();
  });

  it('should find size based on chest measurement', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-chest'), '90');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('fit-finder-result')).toBeInTheDocument();
    expect(screen.getByTestId('recommended-size')).toHaveTextContent('M');
  });

  it('should find size based on waist measurement', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-waist'), '65');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('recommended-size')).toHaveTextContent('S');
  });

  it('should find size based on hip measurement', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-hips'), '100');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('recommended-size')).toHaveTextContent('L');
  });

  it('should find shoe size based on foot length', async () => {
    render(<FitFinder category="shoes" sizeChart={mockShoesSizeChart} />);

    await userEvent.type(screen.getByTestId('input-foot-length'), '25.5');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('recommended-size')).toHaveTextContent('41');
  });

  it('should show alternative size when close', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-chest'), '88');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('alternative-size')).toBeInTheDocument();
  });

  it('should call onSizeSelect when select button clicked', async () => {
    const mockOnSizeSelect = vi.fn();
    render(
      <FitFinder
        category="clothing"
        sizeChart={mockClothingSizeChart}
        onSizeSelect={mockOnSizeSelect}
      />
    );

    await userEvent.type(screen.getByTestId('input-chest'), '90');
    await userEvent.click(screen.getByTestId('find-size-button'));
    await userEvent.click(screen.getByTestId('select-recommended'));

    expect(mockOnSizeSelect).toHaveBeenCalledWith('M');
  });

  it('should handle unit conversion', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    // Switch to inches
    await userEvent.click(screen.getByTestId('fit-finder-unit'));
    await userEvent.click(screen.getByText('in'));

    // 91cm = 35.8 inches (M chest)
    await userEvent.type(screen.getByTestId('input-chest'), '35');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('recommended-size')).toHaveTextContent('M');
  });

  it('should clear result when measurement changes', async () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);

    await userEvent.type(screen.getByTestId('input-chest'), '90');
    await userEvent.click(screen.getByTestId('find-size-button'));

    expect(screen.getByTestId('fit-finder-result')).toBeInTheDocument();

    await userEvent.type(screen.getByTestId('input-chest'), '5');

    expect(screen.queryByTestId('fit-finder-result')).not.toBeInTheDocument();
  });
});

describe('FitFinderResultCard', () => {
  const highConfidenceResult: FitFinderResult = {
    recommendedSize: 'M',
    confidence: 'high',
    alternativeSize: 'L',
  };

  const lowConfidenceResult: FitFinderResult = {
    recommendedSize: 'L',
    confidence: 'low',
    alternativeSize: 'XL',
    notes: 'Your measurements fall between sizes.',
  };

  it('should render result card', () => {
    render(<FitFinderResultCard result={highConfidenceResult} />);
    expect(screen.getByTestId('fit-finder-result')).toBeInTheDocument();
  });

  it('should display recommended size', () => {
    render(<FitFinderResultCard result={highConfidenceResult} />);
    expect(screen.getByTestId('recommended-size')).toHaveTextContent('M');
  });

  it('should display high confidence badge', () => {
    render(<FitFinderResultCard result={highConfidenceResult} />);
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('Great fit');
  });

  it('should display medium confidence badge', () => {
    const result: FitFinderResult = { ...highConfidenceResult, confidence: 'medium' };
    render(<FitFinderResultCard result={result} />);
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('Good fit');
  });

  it('should display low confidence badge', () => {
    render(<FitFinderResultCard result={lowConfidenceResult} />);
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('Approximate');
  });

  it('should display alternative size', () => {
    render(<FitFinderResultCard result={highConfidenceResult} />);
    expect(screen.getByTestId('alternative-size')).toHaveTextContent('L');
  });

  it('should display notes when present', () => {
    render(<FitFinderResultCard result={lowConfidenceResult} />);
    expect(screen.getByTestId('result-notes')).toHaveTextContent(
      'Your measurements fall between sizes.'
    );
  });

  it('should call onSizeSelect when select button clicked', async () => {
    const mockOnSizeSelect = vi.fn();
    render(
      <FitFinderResultCard result={highConfidenceResult} onSizeSelect={mockOnSizeSelect} />
    );

    await userEvent.click(screen.getByTestId('select-recommended'));
    expect(mockOnSizeSelect).toHaveBeenCalledWith('M');
  });
});

describe('MeasuringGuide', () => {
  it('should render measuring guide', () => {
    render(<MeasuringGuide category="clothing" />);
    expect(screen.getByTestId('measuring-guide')).toBeInTheDocument();
  });

  it('should render toggle button', () => {
    render(<MeasuringGuide category="clothing" />);
    expect(screen.getByTestId('measuring-guide-toggle')).toBeInTheDocument();
    expect(screen.getByText('How to Measure')).toBeInTheDocument();
  });

  it('should expand when clicked', async () => {
    render(<MeasuringGuide category="clothing" />);

    await userEvent.click(screen.getByTestId('measuring-guide-toggle'));

    expect(screen.getByTestId('measuring-instructions')).toBeInTheDocument();
  });

  it('should show clothing instructions for clothing category', async () => {
    render(<MeasuringGuide category="clothing" />);

    await userEvent.click(screen.getByTestId('measuring-guide-toggle'));

    expect(screen.getByText('Chest')).toBeInTheDocument();
    expect(screen.getByText('Waist')).toBeInTheDocument();
    expect(screen.getByText('Hips')).toBeInTheDocument();
  });

  it('should show shoe instructions for shoes category', async () => {
    render(<MeasuringGuide category="shoes" />);

    await userEvent.click(screen.getByTestId('measuring-guide-toggle'));

    expect(screen.getByText('Foot Length')).toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
  });

  it('should collapse when clicked again', async () => {
    render(<MeasuringGuide category="clothing" />);

    await userEvent.click(screen.getByTestId('measuring-guide-toggle'));
    expect(screen.getByTestId('measuring-instructions')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('measuring-guide-toggle'));
    expect(screen.queryByTestId('measuring-instructions')).not.toBeInTheDocument();
  });
});

describe('InlineSizeSelector', () => {
  const sizes = ['S', 'M', 'L', 'XL'];

  it('should render inline size selector', () => {
    render(<InlineSizeSelector sizes={sizes} onSizeChange={() => {}} />);
    expect(screen.getByTestId('inline-size-selector')).toBeInTheDocument();
  });

  it('should render size options', () => {
    render(<InlineSizeSelector sizes={sizes} onSizeChange={() => {}} />);
    expect(screen.getByTestId('size-options')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-S')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-M')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-L')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-XL')).toBeInTheDocument();
  });

  it('should highlight selected size', () => {
    render(<InlineSizeSelector sizes={sizes} selectedSize="M" onSizeChange={() => {}} />);
    expect(screen.getByTestId('size-option-M')).toHaveClass('border-blue-600');
  });

  it('should call onSizeChange when size clicked', async () => {
    const mockOnSizeChange = vi.fn();
    render(<InlineSizeSelector sizes={sizes} onSizeChange={mockOnSizeChange} />);

    await userEvent.click(screen.getByTestId('size-option-L'));
    expect(mockOnSizeChange).toHaveBeenCalledWith('L');
  });

  it('should render size guide button', () => {
    render(<InlineSizeSelector sizes={sizes} onSizeChange={() => {}} />);
    expect(screen.getByTestId('size-guide-button')).toBeInTheDocument();
  });

  it('should update size when selected from size guide', async () => {
    const mockOnSizeChange = vi.fn();
    render(
      <InlineSizeSelector
        sizes={sizes}
        onSizeChange={mockOnSizeChange}
        sizeChart={mockClothingSizeChart}
      />
    );

    await userEvent.click(screen.getByTestId('size-guide-button'));

    await waitFor(() => {
      expect(screen.getByTestId('select-size-M')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('select-size-M'));
    expect(mockOnSizeChange).toHaveBeenCalledWith('M');
  });
});

describe('useSizeGuide hook', () => {
  it('should start with no selected size', () => {
    const { result } = renderHook(() => useSizeGuide());
    expect(result.current.selectedSize).toBeNull();
  });

  it('should update selected size', () => {
    const { result } = renderHook(() => useSizeGuide());

    act(() => {
      result.current.setSelectedSize('M');
    });

    expect(result.current.selectedSize).toBe('M');
  });

  it('should return clothing size chart by default', () => {
    const { result } = renderHook(() => useSizeGuide());
    expect(result.current.sizeChart.category).toBe('clothing');
  });

  it('should return shoes size chart for shoes category', () => {
    const { result } = renderHook(() => useSizeGuide('shoes'));
    expect(result.current.sizeChart.category).toBe('shoes');
  });

  it('should save measurements', () => {
    const { result } = renderHook(() => useSizeGuide());

    act(() => {
      result.current.saveMeasurements({ chest: 90, waist: 70 });
    });

    expect(result.current.savedMeasurements).toEqual({ chest: 90, waist: 70 });
  });

  it('should clear measurements', () => {
    const { result } = renderHook(() => useSizeGuide());

    act(() => {
      result.current.saveMeasurements({ chest: 90 });
      result.current.setSelectedSize('M');
    });

    act(() => {
      result.current.clearMeasurements();
    });

    expect(result.current.savedMeasurements).toBeNull();
    expect(result.current.selectedSize).toBeNull();
  });
});

describe('Default size charts', () => {
  it('should have default clothing size chart', () => {
    expect(defaultClothingSizeChart).toBeDefined();
    expect(defaultClothingSizeChart.category).toBe('clothing');
    expect(defaultClothingSizeChart.sizes.length).toBeGreaterThan(0);
  });

  it('should have default shoes size chart', () => {
    expect(defaultShoesSizeChart).toBeDefined();
    expect(defaultShoesSizeChart.category).toBe('shoes');
    expect(defaultShoesSizeChart.sizes.length).toBeGreaterThan(0);
  });

  it('should have all required fields in clothing chart', () => {
    for (const size of defaultClothingSizeChart.sizes) {
      expect(size.size).toBeDefined();
      expect(size.us).toBeDefined();
      expect(size.uk).toBeDefined();
      expect(size.eu).toBeDefined();
      expect(size.chest).toBeDefined();
      expect(size.waist).toBeDefined();
      expect(size.hips).toBeDefined();
    }
  });

  it('should have all required fields in shoes chart', () => {
    for (const size of defaultShoesSizeChart.sizes) {
      expect(size.size).toBeDefined();
      expect(size.us).toBeDefined();
      expect(size.uk).toBeDefined();
      expect(size.eu).toBeDefined();
      expect(size.footLength).toBeDefined();
      expect(size.width).toBeDefined();
    }
  });
});

describe('Accessibility', () => {
  it('should have accessible labels for inputs', () => {
    render(<FitFinder category="clothing" sizeChart={mockClothingSizeChart} />);
    expect(screen.getByLabelText(/Chest/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Waist/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hips/)).toBeInTheDocument();
  });

  it('should have accessible select elements', () => {
    render(<SizeChartTable sizeChart={mockClothingSizeChart} />);
    expect(screen.getByLabelText('Unit:')).toBeInTheDocument();
    expect(screen.getByLabelText('Region:')).toBeInTheDocument();
  });
});
