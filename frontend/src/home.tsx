import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

interface Project {
  id: string;
  name: string;
  description: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Project[]>("/projects/get_all");
      setProjects(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("Failed to load projects");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.post("/projects", { name, description });
      setName("");
      setDescription("");
      loadProjects();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.message || err.message);
      } else {
        setFormError("Failed to create project");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your ongoing projects
          </p>
        </header>

        {/* Projects Grid Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Projects</h2>

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
              <button
                onClick={loadProjects}
                className="mt-2 text-sm text-primary underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No projects yet. Add one below!
            </p>
          )}

          {!isLoading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="h-full transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{project.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Add Project Form Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-center">
            Add a Project
          </h2>
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter project description"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Project"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}