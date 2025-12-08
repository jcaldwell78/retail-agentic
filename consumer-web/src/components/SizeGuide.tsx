import { useState, useMemo, useCallback } from 'react';
import { Ruler, Info, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Size data types
export type SizeCategory = 'clothing' | 'shoes' | 'accessories';
export type MeasurementUnit = 'cm' | 'in';
export type Region = 'US' | 'UK' | 'EU';

export interface SizeChartRow {
  size: string;
  us?: string;
  uk?: string;
  eu?: string;
  chest?: number;
  waist?: number;
  hips?: number;
  length?: number;
  footLength?: number;
  width?: string;
}

export interface SizeChart {
  category: SizeCategory;
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  sizes: SizeChartRow[];
  measurementUnit: MeasurementUnit;
}

export interface FitFinderResult {
  recommendedSize: string;
  confidence: 'high' | 'medium' | 'low';
  alternativeSize?: string;
  notes?: string;
}

export interface UserMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  footLength?: number;
  height?: number;
  weight?: number;
}

// Default size charts
const defaultClothingSizeChart: SizeChart = {
  category: 'clothing',
  gender: 'unisex',
  measurementUnit: 'cm',
  sizes: [
    { size: 'XS', us: '0-2', uk: '4-6', eu: '32-34', chest: 81, waist: 61, hips: 86 },
    { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', chest: 86, waist: 66, hips: 91 },
    { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', chest: 91, waist: 71, hips: 97 },
    { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', chest: 97, waist: 76, hips: 102 },
    { size: 'XL', us: '16-18', uk: '20-22', eu: '48-50', chest: 104, waist: 84, hips: 109 },
    { size: 'XXL', us: '20-22', uk: '24-26', eu: '52-54', chest: 112, waist: 91, hips: 117 },
  ],
};

const defaultShoesSizeChart: SizeChart = {
  category: 'shoes',
  gender: 'unisex',
  measurementUnit: 'cm',
  sizes: [
    { size: '36', us: '4', uk: '3.5', eu: '36', footLength: 22.5, width: 'Regular' },
    { size: '37', us: '5', uk: '4.5', eu: '37', footLength: 23.1, width: 'Regular' },
    { size: '38', us: '6', uk: '5.5', eu: '38', footLength: 23.8, width: 'Regular' },
    { size: '39', us: '7', uk: '6.5', eu: '39', footLength: 24.5, width: 'Regular' },
    { size: '40', us: '8', uk: '7', eu: '40', footLength: 25.1, width: 'Regular' },
    { size: '41', us: '9', uk: '8', eu: '41', footLength: 25.8, width: 'Regular' },
    { size: '42', us: '10', uk: '9', eu: '42', footLength: 26.5, width: 'Regular' },
    { size: '43', us: '11', uk: '10', eu: '43', footLength: 27.1, width: 'Regular' },
    { size: '44', us: '12', uk: '11', eu: '44', footLength: 27.8, width: 'Regular' },
    { size: '45', us: '13', uk: '12', eu: '45', footLength: 28.5, width: 'Regular' },
  ],
};

interface SizeGuideProps {
  category?: SizeCategory;
  sizeChart?: SizeChart;
  productName?: string;
  className?: string;
  onSizeSelect?: (size: string) => void;
}

/**
 * Size Guide Button - Opens the size guide dialog
 */
export function SizeGuideButton({
  category = 'clothing',
  sizeChart,
  productName,
  className,
  onSizeSelect,
}: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className={cn('p-0 h-auto text-sm', className)}
          data-testid="size-guide-button"
        >
          <Ruler className="w-4 h-4 mr-1" />
          Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="size-guide-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Size Guide
            {productName && <span className="text-gray-500 font-normal">- {productName}</span>}
          </DialogTitle>
          <DialogDescription>
            Find your perfect fit with our size chart and fit finder
          </DialogDescription>
        </DialogHeader>
        <SizeGuideContent
          category={category}
          sizeChart={sizeChart}
          onSizeSelect={(size) => {
            onSizeSelect?.(size);
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SizeGuideContentProps {
  category?: SizeCategory;
  sizeChart?: SizeChart;
  onSizeSelect?: (size: string) => void;
  className?: string;
}

/**
 * Size Guide Content - The main content of the size guide
 */
export function SizeGuideContent({
  category = 'clothing',
  sizeChart,
  onSizeSelect,
  className,
}: SizeGuideContentProps) {
  const chart = sizeChart || (category === 'shoes' ? defaultShoesSizeChart : defaultClothingSizeChart);

  return (
    <div className={cn('space-y-6', className)} data-testid="size-guide-content">
      <Tabs defaultValue="chart">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart" data-testid="tab-size-chart">Size Chart</TabsTrigger>
          <TabsTrigger value="finder" data-testid="tab-fit-finder">Fit Finder</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-4">
          <SizeChartTable sizeChart={chart} onSizeSelect={onSizeSelect} />
        </TabsContent>
        <TabsContent value="finder" className="mt-4">
          <FitFinder category={category} sizeChart={chart} onSizeSelect={onSizeSelect} />
        </TabsContent>
      </Tabs>
      <MeasuringGuide category={category} />
    </div>
  );
}

interface SizeChartTableProps {
  sizeChart: SizeChart;
  onSizeSelect?: (size: string) => void;
  selectedSize?: string;
}

/**
 * Size Chart Table - Displays the size chart in a table format
 */
export function SizeChartTable({ sizeChart, onSizeSelect, selectedSize }: SizeChartTableProps) {
  const [unit, setUnit] = useState<MeasurementUnit>(sizeChart.measurementUnit);
  const [region, setRegion] = useState<Region>('US');

  const convertMeasurement = useCallback((value: number): number => {
    if (sizeChart.measurementUnit === unit) return value;
    if (unit === 'in') return Math.round(value / 2.54 * 10) / 10;
    return Math.round(value * 2.54 * 10) / 10;
  }, [sizeChart.measurementUnit, unit]);

  const isClothing = sizeChart.category === 'clothing';
  const isShoes = sizeChart.category === 'shoes';

  return (
    <div className="space-y-4" data-testid="size-chart-table">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="unit-select" className="text-sm">Unit:</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as MeasurementUnit)}>
            <SelectTrigger id="unit-select" className="w-20" data-testid="unit-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="in">in</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="region-select" className="text-sm">Region:</Label>
          <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
            <SelectTrigger id="region-select" className="w-20" data-testid="region-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="EU">EU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" data-testid="size-table">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Size</th>
              <th className="text-left p-3 font-medium">{region}</th>
              {isClothing && (
                <>
                  <th className="text-left p-3 font-medium">Chest ({unit})</th>
                  <th className="text-left p-3 font-medium">Waist ({unit})</th>
                  <th className="text-left p-3 font-medium">Hips ({unit})</th>
                </>
              )}
              {isShoes && (
                <>
                  <th className="text-left p-3 font-medium">Foot Length ({unit})</th>
                  <th className="text-left p-3 font-medium">Width</th>
                </>
              )}
              {onSizeSelect && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {sizeChart.sizes.map((row) => {
              const regionSize = region === 'US' ? row.us : region === 'UK' ? row.uk : row.eu;
              const isSelected = selectedSize === row.size;

              return (
                <tr
                  key={row.size}
                  className={cn(
                    'border-b hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                  data-testid={`size-row-${row.size}`}
                >
                  <td className="p-3 font-medium">{row.size}</td>
                  <td className="p-3">{regionSize}</td>
                  {isClothing && (
                    <>
                      <td className="p-3">{row.chest ? convertMeasurement(row.chest) : '-'}</td>
                      <td className="p-3">{row.waist ? convertMeasurement(row.waist) : '-'}</td>
                      <td className="p-3">{row.hips ? convertMeasurement(row.hips) : '-'}</td>
                    </>
                  )}
                  {isShoes && (
                    <>
                      <td className="p-3">{row.footLength ? convertMeasurement(row.footLength) : '-'}</td>
                      <td className="p-3">{row.width || '-'}</td>
                    </>
                  )}
                  {onSizeSelect && (
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => onSizeSelect(row.size)}
                        data-testid={`select-size-${row.size}`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : 'Select'}
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FitFinderProps {
  category: SizeCategory;
  sizeChart: SizeChart;
  onSizeSelect?: (size: string) => void;
}

/**
 * Fit Finder - Interactive tool to find the right size based on measurements
 */
export function FitFinder({ category, sizeChart, onSizeSelect }: FitFinderProps) {
  const [measurements, setMeasurements] = useState<UserMeasurements>({});
  const [unit, setUnit] = useState<MeasurementUnit>('cm');
  const [result, setResult] = useState<FitFinderResult | null>(null);

  const isClothing = category === 'clothing';
  const isShoes = category === 'shoes';

  const convertToChartUnit = useCallback((value: number): number => {
    if (unit === sizeChart.measurementUnit) return value;
    if (sizeChart.measurementUnit === 'cm') return value * 2.54;
    return value / 2.54;
  }, [unit, sizeChart.measurementUnit]);

  const findSize = useCallback(() => {
    const sizes = sizeChart.sizes;
    let bestMatch: SizeChartRow | null = null;
    let bestScore = Infinity;
    let secondBest: SizeChartRow | null = null;
    let secondBestScore = Infinity;

    for (const size of sizes) {
      let score = 0;
      let factors = 0;

      if (isClothing) {
        if (measurements.chest && size.chest) {
          const diff = Math.abs(convertToChartUnit(measurements.chest) - size.chest);
          score += diff;
          factors++;
        }
        if (measurements.waist && size.waist) {
          const diff = Math.abs(convertToChartUnit(measurements.waist) - size.waist);
          score += diff;
          factors++;
        }
        if (measurements.hips && size.hips) {
          const diff = Math.abs(convertToChartUnit(measurements.hips) - size.hips);
          score += diff;
          factors++;
        }
      }

      if (isShoes && measurements.footLength && size.footLength) {
        const diff = Math.abs(convertToChartUnit(measurements.footLength) - size.footLength);
        score += diff;
        factors++;
      }

      if (factors > 0) {
        const avgScore = score / factors;
        if (avgScore < bestScore) {
          secondBest = bestMatch;
          secondBestScore = bestScore;
          bestMatch = size;
          bestScore = avgScore;
        } else if (avgScore < secondBestScore) {
          secondBest = size;
          secondBestScore = avgScore;
        }
      }
    }

    if (bestMatch) {
      const confidence: FitFinderResult['confidence'] =
        bestScore < 2 ? 'high' : bestScore < 5 ? 'medium' : 'low';

      setResult({
        recommendedSize: bestMatch.size,
        confidence,
        alternativeSize: secondBest?.size,
        notes: confidence === 'low'
          ? 'Your measurements fall between sizes. We recommend trying both sizes.'
          : undefined,
      });
    }
  }, [measurements, sizeChart.sizes, isClothing, isShoes, convertToChartUnit]);

  const handleInputChange = (field: keyof UserMeasurements, value: string) => {
    const numValue = parseFloat(value);
    setMeasurements(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? undefined : numValue,
    }));
    setResult(null);
  };

  const canCalculate = useMemo(() => {
    if (isClothing) {
      return measurements.chest || measurements.waist || measurements.hips;
    }
    if (isShoes) {
      return measurements.footLength;
    }
    return false;
  }, [measurements, isClothing, isShoes]);

  return (
    <div className="space-y-6" data-testid="fit-finder">
      <div className="flex items-center gap-4 mb-4">
        <Label className="text-sm">Measurement Unit:</Label>
        <Select value={unit} onValueChange={(v) => setUnit(v as MeasurementUnit)}>
          <SelectTrigger className="w-20" data-testid="fit-finder-unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cm">cm</SelectItem>
            <SelectItem value="in">in</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isClothing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="chest">Chest ({unit})</Label>
              <Input
                id="chest"
                type="number"
                placeholder={`e.g., ${unit === 'cm' ? '90' : '35'}`}
                value={measurements.chest || ''}
                onChange={(e) => handleInputChange('chest', e.target.value)}
                data-testid="input-chest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">Waist ({unit})</Label>
              <Input
                id="waist"
                type="number"
                placeholder={`e.g., ${unit === 'cm' ? '75' : '30'}`}
                value={measurements.waist || ''}
                onChange={(e) => handleInputChange('waist', e.target.value)}
                data-testid="input-waist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hips">Hips ({unit})</Label>
              <Input
                id="hips"
                type="number"
                placeholder={`e.g., ${unit === 'cm' ? '95' : '37'}`}
                value={measurements.hips || ''}
                onChange={(e) => handleInputChange('hips', e.target.value)}
                data-testid="input-hips"
              />
            </div>
          </>
        )}
        {isShoes && (
          <div className="space-y-2">
            <Label htmlFor="footLength">Foot Length ({unit})</Label>
            <Input
              id="footLength"
              type="number"
              placeholder={`e.g., ${unit === 'cm' ? '25' : '10'}`}
              value={measurements.footLength || ''}
              onChange={(e) => handleInputChange('footLength', e.target.value)}
              data-testid="input-foot-length"
            />
          </div>
        )}
      </div>

      <Button
        onClick={findSize}
        disabled={!canCalculate}
        className="w-full"
        data-testid="find-size-button"
      >
        Find My Size
      </Button>

      {result && (
        <FitFinderResultCard result={result} onSizeSelect={onSizeSelect} />
      )}
    </div>
  );
}

interface FitFinderResultCardProps {
  result: FitFinderResult;
  onSizeSelect?: (size: string) => void;
}

/**
 * Fit Finder Result Card - Displays the size recommendation
 */
export function FitFinderResultCard({ result, onSizeSelect }: FitFinderResultCardProps) {
  const confidenceColor = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-orange-600 bg-orange-50',
  };

  return (
    <Card className="border-2 border-blue-200" data-testid="fit-finder-result">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Recommended Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold" data-testid="recommended-size">
              {result.recommendedSize}
            </span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                confidenceColor[result.confidence]
              )}
              data-testid="confidence-badge"
            >
              {result.confidence === 'high' && 'Great fit'}
              {result.confidence === 'medium' && 'Good fit'}
              {result.confidence === 'low' && 'Approximate'}
            </span>
          </div>
          {onSizeSelect && (
            <Button
              onClick={() => onSizeSelect(result.recommendedSize)}
              data-testid="select-recommended"
            >
              Select Size
            </Button>
          )}
        </div>

        {result.alternativeSize && (
          <p className="text-sm text-gray-600" data-testid="alternative-size">
            You might also fit size <strong>{result.alternativeSize}</strong>
          </p>
        )}

        {result.notes && (
          <p className="text-sm text-gray-500 flex items-start gap-2" data-testid="result-notes">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {result.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MeasuringGuideProps {
  category: SizeCategory;
}

/**
 * Measuring Guide - How to measure yourself
 */
export function MeasuringGuide({ category }: MeasuringGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const clothingInstructions = [
    {
      title: 'Chest',
      description: 'Measure around the fullest part of your chest, keeping the tape level.',
    },
    {
      title: 'Waist',
      description: 'Measure around your natural waistline, keeping the tape comfortably loose.',
    },
    {
      title: 'Hips',
      description: 'Measure around the fullest part of your hips and buttocks.',
    },
  ];

  const shoeInstructions = [
    {
      title: 'Foot Length',
      description: 'Stand on a piece of paper and trace your foot. Measure from heel to longest toe.',
    },
    {
      title: 'Width',
      description: 'Measure the widest part of your foot across the ball.',
    },
  ];

  const instructions = category === 'shoes' ? shoeInstructions : clothingInstructions;

  return (
    <div className="border-t pt-4" data-testid="measuring-guide">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left py-2"
        data-testid="measuring-guide-toggle"
      >
        <span className="font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          How to Measure
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4" data-testid="measuring-instructions">
          {instructions.map((item, index) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {index + 1}
              </div>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Inline Size Selector - Compact size selection with size guide link
 */
export function InlineSizeSelector({
  sizes,
  selectedSize,
  onSizeChange,
  category = 'clothing',
  sizeChart,
  className,
}: {
  sizes: string[];
  selectedSize?: string;
  onSizeChange: (size: string) => void;
  category?: SizeCategory;
  sizeChart?: SizeChart;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} data-testid="inline-size-selector">
      <div className="flex items-center justify-between">
        <Label>Select Size</Label>
        <SizeGuideButton
          category={category}
          sizeChart={sizeChart}
          onSizeSelect={onSizeChange}
        />
      </div>
      <div className="flex flex-wrap gap-2" data-testid="size-options">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={cn(
              'min-w-[48px] h-10 px-3 border rounded-md font-medium transition-colors',
              selectedSize === size
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-300 hover:border-gray-400'
            )}
            data-testid={`size-option-${size}`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to use size guide functionality
 */
export function useSizeGuide(category: SizeCategory = 'clothing') {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<UserMeasurements | null>(null);

  const sizeChart = category === 'shoes' ? defaultShoesSizeChart : defaultClothingSizeChart;

  const saveMeasurements = useCallback((measurements: UserMeasurements) => {
    setSavedMeasurements(measurements);
    // In a real app, this would persist to localStorage or backend
  }, []);

  const clearMeasurements = useCallback(() => {
    setSavedMeasurements(null);
    setSelectedSize(null);
  }, []);

  return {
    selectedSize,
    setSelectedSize,
    savedMeasurements,
    saveMeasurements,
    clearMeasurements,
    sizeChart,
  };
}

export { defaultClothingSizeChart, defaultShoesSizeChart };
export default SizeGuideButton;
