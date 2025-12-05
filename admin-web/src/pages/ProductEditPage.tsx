import { useNavigate, useParams } from 'react-router-dom';
import { ProductForm } from '../components/ProductForm';
import { useState, useEffect } from 'react';

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch product data from API
    // Simulating API call
    setTimeout(() => {
      setProduct({
        name: 'Sample Product',
        sku: 'PROD-001',
        description: 'This is a sample product description',
        price: '99.99',
        currency: 'USD',
        stock: '50',
        category: ['Electronics', 'Gadgets'],
        status: 'ACTIVE',
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleSubmit = (data: Record<string, unknown>) => {
    console.log('Updating product:', id, data);
    // TODO: API call to update product
    navigate('/products');
  };

  const handleCancel = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-gray-600 mt-2">Update product information</p>
      </div>

      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing
      />
    </div>
  );
}
