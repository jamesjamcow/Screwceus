import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";

import HomeTopNav from "../components/home/HomeTopNav";
import { getCreateFolderErrorMessage, useCreateFolder } from "../hooks/useDrive";
import { buildHomeFolderPath, getFolderSearchParam } from "../lib/folderRouting";

const folderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required.")
    .max(255, "Folder name must be 255 characters or fewer."),
});

export default function NewFolderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentFolderId = getFolderSearchParam(searchParams);
  const createFolderMutation = useCreateFolder();
  const cancelPath = buildHomeFolderPath(currentFolderId);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values) {
    try {
      await createFolderMutation.mutateAsync({
        name: values.name.trim(),
        parentId: currentFolderId,
      });
      navigate(cancelPath);
    } catch {
      // The mutation error is rendered from TanStack Query state.
    }
  }

  const apiError = createFolderMutation.error ? getCreateFolderErrorMessage(createFolderMutation.error) : "";
  const isSubmitting = createFolderMutation.isPending;

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
            <h1 className="text-[2rem] font-medium leading-none text-[#141414] md:text-[2.65rem]">New Folder</h1>
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
            <div>
              <label htmlFor="folder-name" className="block text-sm font-semibold text-[#171717]">
                Folder name
              </label>
              <input
                id="folder-name"
                type="text"
                className="mt-2 h-11 w-full rounded-[6px] border border-[#b8b0a5] bg-[#efefef] px-3 text-base text-[#141414] outline-none transition-colors placeholder:text-[#80786e] focus:border-[#6f6d6a]"
                placeholder="Machining references"
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "folder-name-error" : undefined}
                disabled={isSubmitting}
                {...register("name")}
              />
              {errors.name && (
                <p id="folder-name-error" className="mt-2 text-sm text-[#8a2e20]">
                  {errors.name.message}
                </p>
              )}
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
                {isSubmitting ? "Creating..." : "Create folder"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
