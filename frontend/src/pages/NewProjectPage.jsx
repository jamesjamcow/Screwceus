import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";

import HomeTopNav from "../components/home/HomeTopNav";
import { getCreateProjectErrorMessage, useCreateProject } from "../hooks/useDrive";
import { buildHomeFolderPath, getFolderSearchParam } from "../lib/folderRouting";

const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(255, "Project name must be 255 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .or(z.literal("")),
  modelFile: z
    .any()
    .optional()
    .refine((files) => !files?.length || isSupportedModelFile(files[0]), "Upload a GLB, GLTF, or GIB file."),
});

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentFolderId = getFolderSearchParam(searchParams);
  const createProjectMutation = useCreateProject();
  const cancelPath = buildHomeFolderPath(currentFolderId);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      modelFile: undefined,
    },
  });

  async function onSubmit(values) {
    try {
      const project = await createProjectMutation.mutateAsync({
        name: values.name.trim(),
        description: (values.description ?? "").trim(),
        folderId: currentFolderId,
        modelFile: values.modelFile?.[0] ?? null,
      });
      navigate(`/project/${project.id}`);
    } catch {
      // The mutation error is rendered from TanStack Query state.
    }
  }

  const apiError = createProjectMutation.error ? getCreateProjectErrorMessage(createProjectMutation.error) : "";
  const isSubmitting = createProjectMutation.isPending;

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="px-4 py-7 md:px-7">
        <div className="w-full max-w-[720px]">
          <nav className="flex flex-wrap items-center gap-2 text-[0.95rem] text-[#5f584d]" aria-label="Folder location">
            <Link to={cancelPath} className="transition-colors hover:text-[#141414]">
              Folders
            </Link>
            <span aria-hidden="true">/</span>
            <span>{currentFolderId ? "Current folder" : "Root"}</span>
          </nav>

          <div className="mt-3 border-b border-[#b8b0a5] pb-4">
            <h1 className="text-[2rem] font-medium leading-none text-[#141414] md:text-[2.65rem]">New Project</h1>
          </div>

          {apiError && (
            <div className="mt-5 rounded-[7px] border border-[#b16858] bg-[#f4dfd9] px-3 py-2 text-sm text-[#5f2118]">
              {apiError}
            </div>
          )}

          <form
            className="mt-7 rounded-[7px] border border-[#c6bdb1] bg-[#f7f4ee] p-4 shadow-sm md:p-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="grid gap-5">
              <div>
                <label htmlFor="project-name" className="block text-sm font-semibold text-[#171717]">
                  Project name
                </label>
                <input
                  id="project-name"
                  type="text"
                  className="mt-2 h-11 w-full rounded-[6px] border border-[#b8b0a5] bg-[#efefef] px-3 text-base text-[#141414] outline-none transition-colors placeholder:text-[#80786e] focus:border-[#6f6d6a]"
                  placeholder="Assembly drawing set"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "project-name-error" : undefined}
                  disabled={isSubmitting}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="project-name-error" className="mt-2 text-sm text-[#8a2e20]">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="project-description" className="block text-sm font-semibold text-[#171717]">
                  Description
                </label>
                <textarea
                  id="project-description"
                  className="mt-2 min-h-[132px] w-full resize-y rounded-[6px] border border-[#b8b0a5] bg-[#efefef] px-3 py-2 text-base text-[#141414] outline-none transition-colors placeholder:text-[#80786e] focus:border-[#6f6d6a]"
                  placeholder="Notes, context, or project scope"
                  aria-invalid={errors.description ? "true" : "false"}
                  aria-describedby={errors.description ? "project-description-error" : undefined}
                  disabled={isSubmitting}
                  {...register("description")}
                />
                {errors.description && (
                  <p id="project-description-error" className="mt-2 text-sm text-[#8a2e20]">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="project-model" className="block text-sm font-semibold text-[#171717]">
                  3D model
                </label>
                <input
                  id="project-model"
                  type="file"
                  accept=".glb,.gltf,.gib,model/gltf-binary,model/gltf+json"
                  className="mt-2 block w-full rounded-[6px] border border-[#b8b0a5] bg-[#efefef] px-3 py-2 text-sm text-[#141414] file:mr-3 file:rounded-[5px] file:border-0 file:bg-[#141414] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#efefef] hover:file:opacity-90 focus:outline-none"
                  aria-invalid={errors.modelFile ? "true" : "false"}
                  aria-describedby={errors.modelFile ? "project-model-error" : undefined}
                  disabled={isSubmitting}
                  {...register("modelFile")}
                />
                {errors.modelFile && (
                  <p id="project-model-error" className="mt-2 text-sm text-[#8a2e20]">
                    {errors.modelFile.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#d2cbc2] pt-4">
              <Link
                to={cancelPath}
                className="inline-flex h-10 items-center rounded-[6px] border border-[#6f6d6a] px-4 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-[6px] bg-[#141414] px-4 text-sm font-semibold text-[#efefef] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function isSupportedModelFile(file) {
  if (!file) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["glb", "gltf", "gib"].includes(extension);
}
