import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProjectPartsTable from "../components/project/ProjectPartsTable";
import { toPathSafeProjectId } from "../lib/projectRouting";
import { resolveApiAssetUrl } from "../lib/axios";
import { useAuthedApi } from "../hooks/useAuthedApi";
import { useProjectParts } from "../hooks/useDrive";
import { uploadPhoto } from "../services/driveService";

const IMAGE_COMPRESSION_OPTIONS = {
  fileType: "image/webp",
  initialQuality: 0.65,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const uploadInputRef = useRef(null);
  const { authedFetch } = useAuthedApi();
  const [documentError, setDocumentError] = useState("");
  const [isStoringDocument, setIsStoringDocument] = useState(false);

  const targetProjectId = useMemo(() => toPathSafeProjectId(projectId), [projectId]);
  const projectPartsQuery = useProjectParts(projectId);
  const projectPartLinks = projectPartsQuery.data ?? [];

  const handleStartEntry = () => {
    navigate(`/project/${targetProjectId}/new-entry`);
  };

  const handlePickDocument = () => {
    setDocumentError("");
    uploadInputRef.current?.click();
  };

  const storeProjectImage = useCallback(async (file, { sourceType, title, caption }) => {
    setDocumentError("");
    setIsStoringDocument(true);

    try {
      const compressedFile = await compressImageForUpload(file);
      const { photo, screenshot } = await authedFetch(async (token) => {
        return uploadPhoto(token, {
          file: compressedFile,
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
          documentMimeType: compressedFile.type,
          photoId: photo.id,
          screenshotId: screenshot.id,
        },
      });
    } catch {
      setDocumentError("Could not store the image. Try again.");
    } finally {
      setIsStoringDocument(false);
    }
  }, [authedFetch, navigate, projectId, targetProjectId]);

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

  const handlePagePaste = useCallback(
    async (event) => {
      if (isStoringDocument) {
        return;
      }

      const file = findFirstPastedImageFile(event.clipboardData);
      if (!file) {
        return;
      }

      event.preventDefault();
      await storeProjectImage(file, {
        sourceType: "clipboard",
        title: "Pasted image",
        caption: "Pasted image",
      });
    },
    [isStoringDocument, storeProjectImage],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePagePaste);

    return () => {
      window.removeEventListener("paste", handlePagePaste);
    };
  }, [handlePagePaste]);

  return (
    <div className="project-page min-h-full text-[#dddde0] project-design-page">
      <main className="project-page__inner my-0 mx-auto pt-[36px] pr-0 pb-[64px] pl-0 [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0">
        <section className="project-design-import pb-[36px] border-b border-b-[#202125]">
          <div className="project-page__section-heading flex items-end justify-between gap-[40px] mb-[24px] [&>div>span]:block [&>div>span]:mb-[7px] [&>div>span]:text-[#64666c] [&>div>span]:text-[10px] [&>div>span]:font-[680] [&>div>span]:tracking-[.1em] [&>div>span]:uppercase [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[22px] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_h1]:leading-[1.05] [&_h2]:m-0 [&_h2]:text-[#eeeeef] [&_h2]:text-[22px] [&_h2]:font-[560] [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.05] [&_h2]:text-[17px] [&>p]:max-w-[430px] [&>p]:m-0 [&>p]:text-[#77797e] [&>p]:text-[12px] [&>p]:leading-[1.55] [&>p]:text-right [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[10px] [@media_(max-width:720px)]:[&>p]:text-left">
            <div><span>Design intake</span><h1>Add a reference</h1></div>
            <p>Paste or upload a drawing, then identify the parts that make up this project.</p>
          </div>

          <div className="project-design-dropzone min-h-[300px] grid place-items-center content-center gap-[22px] border border-dashed border-[#34363c] rounded-[10px] [@media_(max-width:720px)]:min-h-[260px]">
            <button
              type="button"
              onClick={handlePasteImage}
              disabled={isStoringDocument}
              className="project-design-paste flex flex-col items-center p-[20px] border-0 text-[#d8d8da] bg-transparent cursor-pointer [&:hover_.project-design-paste__icon]:border-[#5b5f9e] [&:hover_.project-design-paste__icon]:text-[#d7d9ff] [&:hover_.project-design-paste__icon]:bg-[#24263b] [&_strong]:text-[15px] [&_strong]:font-[570] [&>span:last-child]:mt-[6px] [&>span:last-child]:text-[#6f7177] [&>span:last-child]:text-[11px]"
            >
              <span className="project-design-paste__icon w-[52px] h-[52px] grid place-items-center mb-[15px] border border-[#393b42] rounded-[12px] text-[#a6a9dc] bg-[#1b1c21] [&_svg]:w-[28px] [&_svg]:h-[28px]"><UploadIcon /></span>
              <strong>
                {isStoringDocument ? "Storing image..." : "Paste Image"}
              </strong>
              <span>Use an image from your clipboard</span>
            </button>
          <div className="project-design-actions flex gap-[8px] [@media_(max-width:720px)]:flex-col">
            <button
              type="button"
              onClick={handlePickDocument}
              disabled={isStoringDocument}
              className="project-page__button min-h-[32px] py-0 px-[13px] border border-[#35363b] rounded-[6px] text-[#c7c7ca] bg-[#1a1b1e] text-[12px] cursor-pointer [&:hover]:border-[#47494f] [&:hover]:text-[#fff] [&:hover]:bg-[#222327] [&:disabled]:opacity-[.5] [&:disabled]:cursor-not-allowed"
            >
              Upload document
            </button>
            <button
              type="button"
              onClick={handleStartEntry}
              disabled={isStoringDocument}
              className="project-page__button min-h-[32px] py-0 px-[13px] border border-[#35363b] rounded-[6px] text-[#c7c7ca] bg-[#1a1b1e] text-[12px] cursor-pointer [&:hover]:border-[#47494f] [&:hover]:text-[#fff] [&:hover]:bg-[#222327] [&:disabled]:opacity-[.5] [&:disabled]:cursor-not-allowed"
            >
              Start blank entry
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"
              className="hidden"
              onChange={handleDocumentSelected}
            />
          </div></div>
          {documentError ? (
            <p role="alert" className="project-page__error mt-[12px] mr-0 mb-0 ml-0 text-[#df8f96] text-[12px] text-center">
              {documentError}
            </p>
          ) : null}
        </section>

        <section className="project-design-parts pt-[30px]">
          <div className="project-page__section-heading flex items-end justify-between gap-[40px] mb-[24px] [&>div>span]:block [&>div>span]:mb-[7px] [&>div>span]:text-[#64666c] [&>div>span]:text-[10px] [&>div>span]:font-[680] [&>div>span]:tracking-[.1em] [&>div>span]:uppercase [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[22px] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_h1]:leading-[1.05] [&_h2]:m-0 [&_h2]:text-[#eeeeef] [&_h2]:text-[22px] [&_h2]:font-[560] [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.05] [&_h2]:text-[17px] [&>p]:max-w-[430px] [&>p]:m-0 [&>p]:text-[#77797e] [&>p]:text-[12px] [&>p]:leading-[1.55] [&>p]:text-right [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[10px] [@media_(max-width:720px)]:[&>p]:text-left project-page__section-heading--compact items-center mb-[14px]">
            <div><span>Project inventory</span><h2>Parts</h2></div>
            <span className="project-page__count min-w-[24px] h-[20px] grid place-items-center border border-[#303136] rounded-[10px] text-[#77797e] text-[10px] bg-[#17181a]">{projectPartLinks.length}</span>
          </div>
          <ProjectPartsTable
            links={projectPartLinks}
            isLoading={projectPartsQuery.isPending}
            isError={projectPartsQuery.isError}
            searchPlaceholder="Search project parts..."
            emptyTitle="No parts linked"
            emptyCopy="Create or link parts for this project to build its inventory."
          />
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

function findFirstPastedImageFile(clipboardData) {
  if (!clipboardData) {
    return null;
  }

  const pastedFile = Array.from(clipboardData.files).find((file) => file.type.startsWith("image/"));
  if (pastedFile) {
    return pastedFile;
  }

  const imageItem = Array.from(clipboardData.items).find((item) => item.type.startsWith("image/"));
  if (!imageItem) {
    return null;
  }

  const file = imageItem.getAsFile();
  if (!file) {
    return null;
  }

  return file.name
    ? file
    : new File([file], filenameForMimeType(file.type), {
        type: file.type,
        lastModified: file.lastModified,
      });
}

async function compressImageForUpload(file) {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressedBlob = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
  const filename = replaceFileExtension(file.name || "uploaded-image", "webp");

  return new File([compressedBlob], filename, {
    type: "image/webp",
    lastModified: file.lastModified,
  });
}

function replaceFileExtension(filename, extension) {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  return `${baseName || "uploaded-image"}.${extension}`;
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
