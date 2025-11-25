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
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Consumer Web - Retail Platform
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Modern UI with Tailwind CSS + shadcn/ui ✨
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Platform</CardTitle>
              <CardDescription>
                A modern, multi-tenant retail e-commerce platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This application showcases our clean, accessible UI built with
                Tailwind CSS and shadcn/ui components. The design system supports
                whitelabel branding and multi-tenancy out of the box.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Get Started</Button>
              <Button variant="outline">Learn More</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UI Components</CardTitle>
              <CardDescription>
                Accessible components built on Radix UI primitives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Button Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Button Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
              <CardDescription>
                Modern tools for building fast, accessible web applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-2xl font-bold text-primary">⚛️</div>
                  <h3 className="font-semibold">React 18</h3>
                  <p className="text-xs text-muted-foreground">
                    Modern React with hooks and concurrent features
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-2xl font-bold text-primary">📘</div>
                  <h3 className="font-semibold">TypeScript</h3>
                  <p className="text-xs text-muted-foreground">
                    Type-safe development with zero `any` types
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-2xl font-bold text-primary">🎨</div>
                  <h3 className="font-semibold">Tailwind CSS</h3>
                  <p className="text-xs text-muted-foreground">
                    Utility-first CSS framework for rapid UI development
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-2xl font-bold text-primary">🧩</div>
                  <h3 className="font-semibold">shadcn/ui</h3>
                  <p className="text-xs text-muted-foreground">
                    Accessible components built on Radix UI
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
                  View Docs
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <footer className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            Retail Platform © 2024 • Built with modern frontend technologies
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
