import { useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import { createPartRecords } from "../lib/partSchema";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import { toPathSafeProjectId } from "../lib/projectRouting";
import { resolveApiAssetUrl } from "../lib/axios";
import { useAuthedApi } from "../hooks/useAuthedApi";
import { uploadPhoto } from "../services/driveService";

export default function ProjectPage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();
  const navigate = useNavigate();
  const uploadInputRef = useRef(null);
  const { authedFetch } = useAuthedApi();
  const [documentError, setDocumentError] = useState("");
  const [isStoringDocument, setIsStoringDocument] = useState(false);

  const projectName = project.name;
  const targetProjectId = useMemo(() => toPathSafeProjectId(projectId), [projectId]);
  const parts = useMemo(() => createPartRecords(), []);

  const handleStartEntry = () => {
    navigate(`/project/${targetProjectId}/new-entry`);
  };

  const handlePickDocument = () => {
    setDocumentError("");
    uploadInputRef.current?.click();
  };

  const storeProjectImage = async (file, { sourceType, title, caption }) => {
    setDocumentError("");
    setIsStoringDocument(true);

    try {
      const { photo, screenshot } = await authedFetch(async (token) => {
        return uploadPhoto(token, {
          file,
          title,
          projectId,
          caption,
          sortOrder: 0,
        });
      });

      navigate(`/project/${targetProjectId}/new-entry`, {
        state: {
          sourceType,
          documentName: photo.title,
          documentUrl: resolveApiAssetUrl(photo.image_url),
          documentMimeType: file.type,
          photoId: photo.id,
          screenshotId: screenshot.id,
        },
      });
    } catch {
      setDocumentError("Could not store the image. Try again.");
    } finally {
      setIsStoringDocument(false);
    }
  };

  const handleDocumentSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    if (selectedFile.type.startsWith("image/")) {
      await storeProjectImage(selectedFile, {
        sourceType: "upload",
        title: selectedFile.name,
        caption: selectedFile.name,
      });
      return;
    }

    navigate(`/project/${targetProjectId}/new-entry`, {
      state: {
        sourceType: "upload",
        documentName: selectedFile.name,
        documentMimeType: selectedFile.type,
      },
    });
  };

  const handlePasteImage = async () => {
    if (!navigator.clipboard?.read) {
      setDocumentError("Clipboard image paste is not available in this browser.");
      return;
    }

    setDocumentError("");

    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageBlob = await findFirstClipboardImageBlob(clipboardItems);

      if (!imageBlob) {
        setDocumentError("The clipboard does not contain an image.");
        return;
      }

      const file = new File([imageBlob.blob], filenameForMimeType(imageBlob.type), {
        type: imageBlob.type,
      });

      await storeProjectImage(file, {
        sourceType: "clipboard",
        title: "Pasted image",
        caption: "Pasted image",
      });
    } catch {
      setDocumentError("Could not read the clipboard. Check browser permissions and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto max-w-[1060px]">
        <section className="min-h-[300px] border-b border-[#b8b0a5] px-5 pb-10 pt-8 md:min-h-[420px] md:px-0">
          <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
            <span className="font-normal">SpaceX/</span>
            <span className="font-semibold">{projectName}</span>
          </h1>

          <ProjectMiniNav active="design" projectId={projectId} />

          <div className="mt-16 flex items-center justify-center md:mt-28">
            <button
              type="button"
              onClick={handlePasteImage}
              disabled={isStoringDocument}
              className="flex flex-col items-center text-center text-[#141414] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <UploadIcon className="h-16 w-16 md:h-[76px] md:w-[76px]" />
              <span className="mt-2 text-[2rem] leading-none md:text-[2.15rem]">
                {isStoringDocument ? "Storing image..." : "Paste Image"}
              </span>
              <span className="mt-2 text-[1.6rem] leading-none md:text-[1.5rem]">or upload</span>
              <span className="mt-2 text-[1.6rem] leading-none md:text-[1.5rem]">or blank</span>
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              onClick={handlePickDocument}
              disabled={isStoringDocument}
              className="rounded-full border border-[#6f6d6a] px-4 py-1 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Upload Document
            </button>
            <button
              type="button"
              onClick={handleStartEntry}
              disabled={isStoringDocument}
              className="ml-3 rounded-full border border-[#6f6d6a] px-4 py-1 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Blank Entry
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"
              className="hidden"
              onChange={handleDocumentSelected}
            />
          </div>
          {documentError ? (
            <p role="alert" className="mt-3 text-center text-sm text-[#9d3434]">
              {documentError}
            </p>
          ) : null}
        </section>

        <section className="px-5 pb-10 pt-6 md:px-0">
          <label htmlFor="project-part-search" className="sr-only">
            Search parts
          </label>
          <div className="relative">
            <input
              id="project-part-search"
              type="text"
              placeholder="Type here to search"
              className="h-10 w-full rounded-lg border border-[#6f6d6a] bg-[#efefef] px-4 pr-14 text-[1.75rem] text-[#141414] placeholder:text-[#b5b5b5] focus:outline-none"
            />

            <button
              type="button"
              aria-label="Search inventory"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#141414] transition-opacity hover:opacity-70"
            >
              <SearchCatalogIcon className="h-7 w-7" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {parts.map((part) => (
              <PartCard key={part.id} part={part} badge={`#${part.id}`} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

async function findFirstClipboardImageBlob(clipboardItems) {
  for (const item of clipboardItems) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (imageType) {
      return {
        type: imageType,
        blob: await item.getType(imageType),
      };
    }
  }

  return null;
}

function filenameForMimeType(mimeType) {
  if (mimeType === "image/jpeg") return "pasted-image.jpg";
  if (mimeType === "image/webp") return "pasted-image.webp";
  if (mimeType === "image/gif") return "pasted-image.gif";
  return "pasted-image.png";
}

function UploadIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path
        d="M19 46H14c-5 0-9-3.9-9-8.7 0-4.4 3.4-8 7.8-8.6.9-6.7 6.9-11.9 14.3-11.9 6.7 0 12.6 4.3 14.1 10.2a9.8 9.8 0 0 1 4.4-1c5.3 0 9.6 4 9.6 9s-4.3 9-9.6 9H38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 36.5 32 32l4 4.5M32 32v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchCatalogIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M7 4h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4h10M9 12h3m-3 3h2m6.5 4.5L20 22m-1.5-2.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
