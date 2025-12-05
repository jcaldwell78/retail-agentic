import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>Page not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/" className="w-full">
            <Button className="w-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
