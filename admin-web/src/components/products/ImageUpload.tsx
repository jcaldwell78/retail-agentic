import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  existingImages?: UploadedImage[];
  maxImages?: number;
  maxSizeMB?: number;
  onImagesChange?: (images: UploadedImage[]) => void;
}

export default function ImageUpload({
  existingImages = [],
  maxImages = 5,
  maxSizeMB = 5,
  onImagesChange,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image file`);
        return;
      }

      // Validate file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        errors.push(`${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Check total image count
      if (images.length + newImages.length >= maxImages) {
        errors.push(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newImages.push({
        id: `new-${Date.now()}-${Math.random()}`,
        url: preview,
        file,
        preview,
        isPrimary: images.length === 0 && newImages.length === 0,
      });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(null), 5000);
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((img) => img.id !== id);

    // If removed primary image, make first image primary
    if (imageToRemove?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const setPrimaryImage = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [moved] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, moved);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="space-y-4" data-testid="image-upload">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          data-testid="file-input"
        />

        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Product Images</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop images here, or click to browse
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          data-testid="upload-button"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </Button>
        <p className="text-xs text-gray-500 mt-4">
          Maximum {maxImages} images, up to {maxSizeMB}MB each
        </p>
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, WebP, GIF
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="relative group overflow-hidden"
              data-testid={`image-${index}`}
            >
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={image.preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    Primary
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!image.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(image.id)}
                      data-testid={`set-primary-${index}`}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image.id)}
                    data-testid={`remove-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Reorder Buttons */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="w-6 h-6 bg-white rounded shadow hover:bg-gray-100"
                      title="Move left"
                      data-testid={`move-left-${index}`}
                    >
                      ←
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      className="w-6 h-6 bg-white rounded shadow hover:bg-gray-100"
                      title="Move right"
                      data-testid={`move-right-${index}`}
                    >
                      →
                    </button>
                  )}
                </div>
              </div>

              {/* Image Info */}
              <div className="p-2 text-xs text-gray-600">
                <div className="truncate">Image {index + 1}</div>
                {image.file && (
                  <div className="text-gray-500">
                    {(image.file.size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-1">
            <li>The first image is set as primary by default</li>
            <li>Click "Set Primary" to make any image the main product image</li>
            <li>Use arrow buttons to reorder images</li>
            <li>Remove images by clicking the X button</li>
          </ul>
        </div>
      )}
    </div>
  );
}
