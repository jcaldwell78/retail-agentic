import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Retail Platform Management Console
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Platform health and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tenants</span>
                  <span className="text-sm font-medium">12 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Orders Today</span>
                  <span className="text-sm font-medium">247</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Details</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Manage stores and whitelabel configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and configure multi-tenant stores with custom branding,
                domains, and settings.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button className="flex-1">New Tenant</Button>
              <Button variant="outline" className="flex-1">View All</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Manage products and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add products, manage inventory, configure flexible attributes,
                and sync across tenants.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button className="flex-1">Add Product</Button>
              <Button variant="outline" className="flex-1">Inventory</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Process and fulfill customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Order #12345</p>
                    <p className="text-xs text-muted-foreground">Pending • $124.99</p>
                  </div>
                  <Button size="sm" variant="outline">Process</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Order #12344</p>
                    <p className="text-xs text-muted-foreground">Shipped • $89.50</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Order #12343</p>
                    <p className="text-xs text-muted-foreground">Delivered • $210.00</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Orders</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                📊 View Analytics Dashboard
              </Button>
              <Button variant="outline" className="w-full justify-start">
                👥 Manage Users & Permissions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                ⚙️ System Configuration
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔔 Notifications & Alerts
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📈 Reports & Exports
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>
              Administrative capabilities and system controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-2xl font-bold text-primary">🏪</div>
                <h3 className="font-semibold">Multi-Tenant</h3>
                <p className="text-xs text-muted-foreground">
                  Manage multiple stores with isolated data
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-2xl font-bold text-primary">🎨</div>
                <h3 className="font-semibold">Whitelabel</h3>
                <p className="text-xs text-muted-foreground">
                  Custom branding and domain configuration
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-2xl font-bold text-primary">📦</div>
                <h3 className="font-semibold">Product Mgmt</h3>
                <p className="text-xs text-muted-foreground">
                  Flexible attributes and catalog control
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-2xl font-bold text-primary">📊</div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-xs text-muted-foreground">
                  Cross-tenant reports and insights
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-muted-foreground">
                ✅ All systems operational
              </p>
              <Button variant="ghost" size="sm">
                System Status
              </Button>
            </div>
          </CardFooter>
        </Card>

        <footer className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            Retail Platform Admin © 2024 • Modern Administrative Interface
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
