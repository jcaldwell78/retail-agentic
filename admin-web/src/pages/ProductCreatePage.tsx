import { useNavigate } from 'react-router-dom';
import { ProductForm } from '../components/ProductForm';

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    console.log('Creating product:', data);
    // TODO: API call to create product
    // After successful creation, navigate to products list
    navigate('/products');
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-gray-600 mt-2">Add a new product to your catalog</p>
      </div>

      <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
