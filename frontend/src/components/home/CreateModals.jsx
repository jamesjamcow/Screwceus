import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import {
  getCreateFolderErrorMessage,
  getCreatePartErrorMessage,
  getCreateProjectErrorMessage,
  useCreateFolder,
  useCreatePart,
  useCreateProject,
} from "../../hooks/useDrive";
import { PART_FORM_DEFAULT_VALUES, PART_TYPE_OPTIONS, partFormSchema } from "../../lib/partSchema";
import { FolderIcon, NavIcon } from "./HomeIcons";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned", tone: "slate" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "on_hold", label: "On hold", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
];

const STATUS_DOT_TONE_CLASSES = {
  slate: "bg-[#878b96] shadow-[0_0_0_3px_rgba(135,139,150,.12)]",
  blue: "bg-[#6884e8] shadow-[0_0_0_3px_rgba(104,132,232,.12)]",
  amber: "bg-[#c8934d] shadow-[0_0_0_3px_rgba(200,147,77,.12)]",
  green: "bg-[#5da578] shadow-[0_0_0_3px_rgba(93,165,120,.12)]",
};

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(255, "Use 255 characters or fewer."),
  description: z.string().trim().max(2000, "Use 2000 characters or fewer."),
  status: z.enum(["planned", "in_progress", "on_hold", "completed"]),
  dueDate: z.string(),
  folderId: z.string(),
  coverImage: z
    .any()
    .nullable()
    .refine((file) => !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type), "Choose a JPG, PNG, or WebP image.")
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, "Cover image must be 10 MB or smaller."),
  modelFile: z
    .any()
    .nullable()
    .refine((file) => !file || ["glb", "gltf", "gib"].includes(file.name.split(".").pop()?.toLowerCase()), "Choose a GLB, GLTF, or GIB file."),
});

const folderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required.").max(255, "Use 255 characters or fewer."),
  parentId: z.string(),
});

export function CreateProjectModal({ teamId, folders, initialFolderId = "", onClose }) {
  const navigate = useNavigate();
  const mutation = useCreateProject(teamId);
  const dialogRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);

  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planned",
      dueDate: "",
      folderId: String(initialFolderId || ""),
      coverImage: null,
      modelFile: null,
    },
  });

  const coverImage = useWatch({ control, name: "coverImage" });
  const modelFile = useWatch({ control, name: "modelFile" });
  const status = useWatch({ control, name: "status" });
  const description = useWatch({ control, name: "description" });
  const coverPreview = useObjectUrl(coverImage);
  const isSubmitting = mutation.isPending;

  useModalBehavior(dialogRef, onClose, isSubmitting);

  function chooseCover(file) {
    setValue("coverImage", file ?? null, { shouldDirty: true, shouldValidate: true });
    clearErrors("coverImage");
  }

  async function onSubmit(values) {
    try {
      const project = await mutation.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        dueDate: values.dueDate,
        folderId: values.folderId ? Number(values.folderId) : null,
        coverImage: values.coverImage,
        modelFile: values.modelFile,
      });
      onClose();
      navigate(`/project/${project.id}/overview`);
    } catch {
      // Mutation errors are shown in the dialog.
    }
  }

  const apiError = mutation.error ? getCreateProjectErrorMessage(mutation.error) : "";

  return (
    <ModalBackdrop onClose={onClose} disabled={isSubmitting}>
      <section ref={dialogRef} className="create-dialog overflow-y-auto border border-[#34363c] rounded-[12px] text-[#e6e6e8] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [@media_(max-width:760px)]:w-full create-dialog--project flex overflow-hidden flex-col bg-[#1b1c1e] [&_.create-dialog__close]:text-[#73757a] [&_.project-composer]:min-h-0 [&_.project-composer]:flex [&_.project-composer]:flex-1 [&_.project-composer]:overflow-y-auto [&_.project-composer]:pt-[19px] [&_.project-composer]:pr-[42px] [&_.project-composer]:pb-[20px] [&_.project-composer]:pl-[42px] [&_.project-composer__main]:min-h-0 [&_.project-composer__main]:flex [&_.project-composer__main]:flex-1 [&_.project-composer__main]:flex-col [&_.project-composer__main]:gap-0 [&_.project-title-field]:min-w-0 [&_.project-title-field]:flex-1 [&_.project-title-field_input]:w-full [&_.project-title-field_input]:pt-[1px] [&_.project-title-field_input]:pr-0 [&_.project-title-field_input]:pb-[4px] [&_.project-title-field_input]:pl-0 [&_.project-title-field_input]:border-0 [&_.project-title-field_input]:outline-0 [&_.project-title-field_input]:text-[#ededee] [&_.project-title-field_input]:bg-transparent [&_.project-title-field_input]:font-[590] [&_.project-title-field_input]:tracking-[-.035em] [&_.project-title-field_input]:leading-[1.1] [&_.project-title-field_input::placeholder]:text-[#74767b] [&_.project-title-field_input::placeholder]:opacity-100 [&_.project-title-field_input:focus]:border-0 [&_.create-select-wrap]:w-auto [&_.create-select-wrap]:h-[27px] [&_.create-select-wrap]:gap-[6px] [&_.create-select-wrap]:py-0 [&_.create-select-wrap]:px-[8px] [&_.create-select-wrap]:border-[#393b40] [&_.create-select-wrap]:rounded-[14px] [&_.create-select-wrap]:bg-[#242528] [&_.create-input-with-icon]:w-auto [&_.create-input-with-icon]:h-[27px] [&_.create-input-with-icon]:gap-[6px] [&_.create-input-with-icon]:py-0 [&_.create-input-with-icon]:px-[8px] [&_.create-input-with-icon]:border-[#393b40] [&_.create-input-with-icon]:rounded-[14px] [&_.create-input-with-icon]:bg-[#242528] [&_.create-select-wrap:hover]:border-[#4a4c52] [&_.create-select-wrap:hover]:bg-[#292a2e] [&_.create-input-with-icon:hover]:border-[#4a4c52] [&_.create-input-with-icon:hover]:bg-[#292a2e] [&_.create-select-wrap:focus-within]:border-[#626ccf] [&_.create-input-with-icon:focus-within]:border-[#626ccf] [&_.create-select-wrap>svg]:w-[12px] [&_.create-select-wrap>svg]:h-[12px] [&_.create-select-wrap>svg]:text-[#898b91] [&_.create-input-with-icon>svg]:w-[12px] [&_.create-input-with-icon>svg]:h-[12px] [&_.create-input-with-icon>svg]:text-[#898b91] [&_.create-select-wrap>svg:last-child]:w-[9px] [&_.create-select-wrap>svg:last-child]:h-[9px] [&_.create-select-wrap_select]:w-auto [&_.create-select-wrap_select]:text-[#aeb0b5] [&_.create-select-wrap_select]:text-[10px] [&_.create-input-with-icon_input]:w-auto [&_.create-input-with-icon_input]:text-[#aeb0b5] [&_.create-input-with-icon_input]:text-[10px] [&_.project-property--status_select]:w-[70px] [&_.create-input-with-icon_input]:w-[98px] [&_.create-input-with-icon_input]:scheme-dark [&_.status-dot]:w-[6px] [&_.status-dot]:h-[6px] [&_.status-dot]:basis-[6px] [&_.status-dot]:shadow-none [&_.project-description-field]:min-h-[260px] [&_.project-description-field]:flex [&_.project-description-field]:flex-1 [&_.project-description-field]:flex-col [&_.project-description-field]:p-0 [&_.project-description-field]:border-t [&_.project-description-field]:border-t-[#2c2d31] [&_.project-description-field_textarea]:min-h-[240px] [&_.project-description-field_textarea]:flex-1 [&_.project-description-field_textarea]:resize-none [&_.project-description-field_textarea]:pt-[25px] [&_.project-description-field_textarea]:pr-0 [&_.project-description-field_textarea]:pb-[18px] [&_.project-description-field_textarea]:pl-0 [&_.project-description-field_textarea]:border-0 [&_.project-description-field_textarea]:outline-0 [&_.project-description-field_textarea]:text-[#d6d7d9] [&_.project-description-field_textarea]:bg-transparent [&_.project-description-field_textarea]:text-[13px] [&_.project-description-field_textarea]:leading-[1.65] [&_.project-description-field_textarea::placeholder]:text-[#64666b] [&_.project-description-field_textarea:focus]:border-0 [&_.project-description-field_textarea:focus]:shadow-none [&_.project-description-field>small]:right-0 [&_.project-description-field>small]:bottom-[9px] [&_.project-description-field>small]:opacity-0 [&_.project-description-field:focus-within>small]:opacity-100 [&_.project-description-field>small.is-visible]:opacity-100 [&_.project-assets]:flex-none [&_.project-assets]:p-0 [&_.project-assets]:border [&_.project-assets]:border-[#303136] [&_.project-assets]:rounded-[9px] [&_.project-assets]:bg-[#1e1f21] [&_.project-assets__heading]:min-h-[48px] [&_.project-assets__heading]:flex [&_.project-assets__heading]:items-center [&_.project-assets__heading]:justify-between [&_.project-assets__heading]:gap-[16px] [&_.project-assets__heading]:py-0 [&_.project-assets__heading]:px-[13px] [&_.project-assets__heading]:list-none [&_.project-assets__heading]:text-[#adaeb2] [&_.project-assets__heading]:cursor-pointer [&_.project-assets__heading]:select-none [&_.project-assets__heading::-webkit-details-marker]:hidden [&_.project-assets__heading>span]:min-w-0 [&_.project-assets__heading>span]:flex [&_.project-assets__heading>span]:items-baseline [&_.project-assets__heading>span]:gap-[9px] [&_.project-assets__heading_strong]:text-[#bfc0c3] [&_.project-assets__heading_strong]:text-[11px] [&_.project-assets__heading_strong]:font-[570] [&_.project-assets__heading_strong]:tracking-normal [&_.project-assets__heading_small]:overflow-hidden [&_.project-assets__heading_small]:text-[#5f6166] [&_.project-assets__heading_small]:text-[9px] [&_.project-assets__heading_small]:text-ellipsis [&_.project-assets__heading_small]:whitespace-nowrap [&_.project-assets__heading>svg]:w-[13px] [&_.project-assets__heading>svg]:h-[13px] [&_.project-assets__heading>svg]:flex-none [&_.project-assets__heading>svg]:text-[#72747a] [&_.project-assets[open]_.project-assets__heading>svg]:text-[#aaaebf] [&_.project-assets__grid]:gap-[10px] [&_.project-assets__grid]:pt-0 [&_.project-assets__grid]:pr-[10px] [&_.project-assets__grid]:pb-[10px] [&_.project-assets__grid]:pl-[10px] [&_.project-assets__grid]:border-t [&_.project-assets__grid]:border-t-[#2b2c30] [&_.cover-dropzone]:mt-[10px] [&_.model-file-field]:mt-[10px] [&_.create-dialog__error]:flex-none [&_.create-dialog__error]:mt-0 [&_.create-dialog__error]:mr-[42px] [&_.create-dialog__error]:mb-[12px] [&_.create-dialog__error]:ml-[42px] [&_.create-dialog__footer]:min-h-[57px] [&_.create-dialog__footer]:justify-end [&_.create-dialog__footer]:py-[10px] [&_.create-dialog__footer]:px-[18px] [&_.create-dialog__footer]:border-[#2b2c30] [&_.create-dialog__footer]:bg-[#191a1c] [&_.create-button]:h-[30px] [&_.create-button]:rounded-[15px] [&_.create-button--secondary]:border-[#3b3d42] [&_.create-button--secondary]:text-[#b0b1b5] [&_.create-button--secondary]:bg-[#242528] [&_.create-button--primary]:px-[15px] [&_.create-button--primary]:border-[#7881dc] [&_.create-button--primary]:bg-[#6570d8] [@media_(max-width:760px)]:[&_.project-composer]:pt-[17px] [@media_(max-width:760px)]:[&_.project-composer]:pr-[18px] [@media_(max-width:760px)]:[&_.project-composer]:pb-[16px] [@media_(max-width:760px)]:[&_.project-composer]:pl-[18px] [@media_(max-width:760px)]:[&_.project-description-field]:min-h-[210px] [@media_(max-width:760px)]:[&_.project-description-field_textarea]:min-h-[190px] [@media_(max-width:760px)]:[&_.project-assets__grid]:grid-cols-1 [@media_(max-width:760px)]:[&_.create-dialog__error]:mx-[18px]" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <form className="project-create-form min-h-0 flex flex-1 flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
          <button type="button" className="create-dialog__close create-dialog__close--project w-[28px] h-[28px] grid place-items-center pt-0 pr-0 pb-[2px] pl-0 border-0 rounded-[6px] text-[#777980] bg-transparent leading-none cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#28292d] [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed" aria-label="Close new project dialog" onClick={onClose} disabled={isSubmitting}>×</button>
          <div className="project-composer pt-[25px] pr-[29px] pb-[24px] pl-[29px] [@media_(max-width:760px)]:py-[21px] [@media_(max-width:760px)]:px-[17px]">
            <div className="project-composer__main grid gap-[23px]">
              <div className="project-title-row flex items-start gap-[14px] [@media_(max-width:760px)]:gap-[11px]">
                <span className="project-title-row__icon w-[30px] h-[30px] grid place-items-center mt-[1px] border border-[#45474d] rounded-[5px] text-[#a7a9af] bg-[#303236] [&_svg]:w-[15px] [&_svg]:h-[15px]" aria-hidden="true"><NavIcon type="projects" /></span>
                <div className="project-title-field [&_label]:block [&_label]:mb-[8px] [&_label]:text-[#8a8c92] [&_label]:text-[11px] [&_label]:font-[610] [&_label]:tracking-[.035em] [&_input]:w-full [&_input]:pt-0 [&_input]:pr-0 [&_input]:pb-[9px] [&_input]:pl-0 [&_input]:border-0 [&_input]:border-b [&_input]:border-b-[#33353a] [&_input]:outline-0 [&_input]:text-[#f0f0f2] [&_input]:bg-transparent [&_input]:font-[540] [&_input]:tracking-[-.04em] [&_input::placeholder]:text-[#55575d] [&_input:focus]:border-[#6973d5]">
                  <label id="new-project-title" className="sr-only" htmlFor="new-project-name">New project</label>
                  <input
                    id="new-project-name"
                    type="text"
                    placeholder="Project name"
                    autoFocus
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.name)}
                    {...register("name")}
                  />
                  {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
                </div>
              </div>

              <div className="project-property-bar flex flex-wrap items-center gap-[6px] mt-[13px] mr-0 mb-[20px] ml-[44px] [@media_(max-width:760px)]:ml-[41px]" aria-label="Project properties">
                <label className="project-property min-w-0 project-property--status">
                  <span className="sr-only">Status</span>
                  <div className="create-select-wrap h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&>svg:last-child]:w-[12px] [&>svg:last-child]:h-[12px] [&>svg:last-child]:pointer-events-none [&_select]:min-w-0 [&_select]:h-full [&_select]:flex-1 [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d8d8da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:scheme-dark [&_select]:cursor-pointer">
                    <span className={`status-dot w-[8px] h-[8px] rounded-full bg-[#777a82] ${STATUS_DOT_TONE_CLASSES[STATUS_OPTIONS.find((option) => option.value === status)?.tone] ?? ""}`} />
                    <select disabled={isSubmitting} {...register("status")}>
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <NavIcon type="chevron-down" />
                  </div>
                </label>

                <label className="project-property min-w-0">
                  <span className="sr-only">Due date</span>
                  <div className="create-input-with-icon h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&_input]:min-w-0 [&_input]:h-full [&_input]:flex-1 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#d8d8da] [&_input]:bg-transparent [&_input]:text-[12px] [&_input]:scheme-dark">
                    <NavIcon type="calendar" />
                    <input type="date" aria-label="Due date" disabled={isSubmitting} {...register("dueDate")} />
                  </div>
                </label>

                <label className="project-property min-w-0 project-property--folder">
                  <span className="sr-only">Folder</span>
                  <div className="create-select-wrap h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&>svg:last-child]:w-[12px] [&>svg:last-child]:h-[12px] [&>svg:last-child]:pointer-events-none [&_select]:min-w-0 [&_select]:h-full [&_select]:flex-1 [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d8d8da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:scheme-dark [&_select]:cursor-pointer">
                    <FolderIcon />
                    <select disabled={isSubmitting} {...register("folderId")}>
                      <option value="">No folder</option>
                      {folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
                    </select>
                    <NavIcon type="chevron-down" />
                  </div>
                </label>
              </div>

              <label className="project-description-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em] relative [&_textarea]:w-full [&_textarea]:min-h-[112px] [&_textarea]:block [&_textarea]:resize-y [&_textarea]:pt-[12px] [&_textarea]:pr-[13px] [&_textarea]:pb-[26px] [&_textarea]:pl-[13px] [&_textarea]:border [&_textarea]:border-[#35373d] [&_textarea]:rounded-[7px] [&_textarea]:outline-0 [&_textarea]:text-[#dedee0] [&_textarea]:bg-[#131416] [&_textarea]:text-[13px] [&_textarea]:leading-[1.55] [&_textarea::placeholder]:text-[#55575d] [&_textarea:focus]:border-[#6973d5] [&>small]:absolute [&>small]:right-[10px] [&>small]:bottom-[8px] [&>small]:text-[#56585e] [&>small]:text-[9px] [&>small]:tabular-nums">
                <span className="sr-only">Description</span>
                <textarea
                  placeholder="Write a description, project brief, or collect ideas…"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.description)}
                  {...register("description")}
                />
                <small className={description.length ? "is-visible" : ""}>{description.length} / 2000</small>
                {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
              </label>

              <div className="project-assets project-assets--inline pt-[2px]" aria-label="Project assets">
                <div className="project-assets__grid grid gap-[10px] [@media_(max-width:760px)]:grid-cols-1">
                  <label
                    className={`cover-dropzone relative min-w-0 flex items-center gap-[11px] overflow-hidden border border-dashed border-[#3d4046] rounded-[8px] bg-[#141517] cursor-pointer min-h-[72px] p-[8px] [&:hover]:border-[#666fcb] [&:hover]:bg-[#181a20] [&.is-dragging]:border-[#666fcb] [&.is-dragging]:bg-[#181a20] [&>img]:w-[82px] [&>img]:h-[54px] [&>img]:object-cover [&>img]:rounded-[5px] [&_input]:absolute [&_input]:w-[1px] [&_input]:h-[1px] [&_input]:opacity-0${dragActive ? " is-dragging" : ""}${coverPreview ? " has-image" : ""}`}
                    onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false); }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      chooseCover(event.dataTransfer.files?.[0]);
                    }}
                  >
                    {coverPreview ? <img src={coverPreview} alt="Selected project cover preview" /> : <span className="cover-dropzone__art w-[50px] h-[50px] grid place-items-center border border-[#373a40] rounded-[6px] text-[#8b8fca] [&_svg]:w-[17px] [&_svg]:h-[17px]"><NavIcon type="plus" /></span>}
                    <span className="cover-dropzone__copy min-w-0 flex-1 [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:block [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[#d0d0d3] [&_strong]:text-[11px] [&_strong]:font-[580] [&_small]:mt-[4px] [&_small]:text-[#65676d] [&_small]:text-[9px]">
                      <strong>{coverImage ? coverImage.name : "Cover image"}</strong>
                      <small>{coverImage ? formatFileSize(coverImage.size) : "Drop an image or click to browse"}</small>
                    </span>
                    <span className="cover-dropzone__action flex-none py-[5px] px-[7px] border border-[#3b3d43] rounded-[5px] text-[#a9aaae] bg-[#202124] text-[9px]">{coverImage ? "Replace" : "Choose image"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isSubmitting}
                      onChange={(event) => chooseCover(event.target.files?.[0])}
                    />
                  </label>

                  <label className="model-file-field relative min-w-0 flex items-center gap-[11px] overflow-hidden border border-dashed border-[#3d4046] rounded-[8px] bg-[#141517] cursor-pointer [&:hover]:border-[#666fcb] [&:hover]:bg-[#181a20] [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:block [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[#d0d0d3] [&_strong]:text-[11px] [&_strong]:font-[580] [&_small]:mt-[4px] [&_small]:text-[#65676d] [&_small]:text-[9px] min-h-[72px] p-[10px] [&_input]:absolute [&_input]:w-[1px] [&_input]:h-[1px] [&_input]:opacity-0">
                    <span className="model-file-field__icon w-[50px] h-[50px] grid place-items-center border border-[#373a40] rounded-[6px] text-[#8b8fca] [&_svg]:w-[17px] [&_svg]:h-[17px] w-[34px] h-[34px] basis-[34px]"><NavIcon type="projects" /></span>
                    <span>
                      <strong>{modelFile ? modelFile.name : "3D model"}</strong>
                      <small>{modelFile ? formatFileSize(modelFile.size) : "Optional · GLB, GLTF, or GIB"}</small>
                    </span>
                    <span className="model-file-field__action flex-none py-[5px] px-[7px] border border-[#3b3d43] rounded-[5px] text-[#a9aaae] bg-[#202124] text-[9px]">{modelFile ? "Replace" : "Attach"}</span>
                    <input
                      type="file"
                      accept=".glb,.gltf,.gib,model/gltf-binary,model/gltf+json"
                      disabled={isSubmitting}
                      onChange={(event) => setValue("modelFile", event.target.files?.[0] ?? null, { shouldValidate: true })}
                    />
                  </label>
                </div>
                {errors.coverImage ? <FieldError>{errors.coverImage.message}</FieldError> : null}
                {errors.modelFile ? <FieldError>{errors.modelFile.message}</FieldError> : null}
              </div>
            </div>
          </div>

          {apiError ? <div className="create-dialog__error mt-0 mr-[29px] mb-[18px] ml-[29px] py-[9px] px-[11px] border border-[#603b40] rounded-[6px] text-[#e1a3a9] bg-[#2b181b] text-[11px] [@media_(max-width:760px)]:mx-[17px]" role="alert">{apiError}</div> : null}

          <footer className="create-dialog__footer min-h-[61px] flex items-center justify-between gap-[16px] pt-[10px] pr-[14px] pb-[10px] pl-[19px] border-t border-t-[#292b2f] bg-[#161719] [&>div]:flex [&>div]:items-center [&>div]:gap-[8px] [@media_(max-width:760px)]:justify-end">
            <div>
              <button type="button" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--secondary border-[#383a3f] text-[#a9aaae] bg-[#1d1e21] [&:hover]:text-[#dfdfe1] [&:hover]:bg-[#242529]" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--primary border-[#747dd8] text-[#fff] bg-[#5e6ad2] [&:hover]:bg-[#6a75dc]" disabled={isSubmitting}>
                {isSubmitting ? <><span className="create-spinner w-[11px] h-[11px] border-[1.5px] border-solid border-[rgba(255,255,255,.34)] border-t-[#fff] rounded-full" />Creating…</> : "Create project"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </ModalBackdrop>
  );
}

export function CreateFolderModal({ teamId, folders, initialFolderId = "", onClose }) {
  const mutation = useCreateFolder(teamId);
  const dialogRef = useRef(null);
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: "", parentId: String(initialFolderId || "") },
  });
  const isSubmitting = mutation.isPending;
  useModalBehavior(dialogRef, onClose, isSubmitting);

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync({
        name: values.name.trim(),
        parentId: values.parentId ? Number(values.parentId) : null,
      });
      onClose();
    } catch {
      // Mutation errors are shown in the dialog.
    }
  }

  const apiError = mutation.error ? getCreateFolderErrorMessage(mutation.error) : "";

  return (
    <ModalBackdrop onClose={onClose} disabled={isSubmitting} compact>
      <section ref={dialogRef} className="create-dialog overflow-y-auto border border-[#34363c] rounded-[12px] text-[#e6e6e8] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [@media_(max-width:760px)]:w-full create-dialog--folder bg-[#191a1c] [&_.create-dialog__error]:mx-[25px] [@media_(max-width:760px)]:w-full" role="dialog" aria-modal="true" aria-labelledby="new-folder-title">
        <header className="create-dialog__header sticky top-0 z-[4] h-[52px] flex items-center justify-between pt-0 pr-[13px] pb-0 pl-[16px] border-b border-b-[#282a2e]">
          <div className="create-dialog__context min-w-0 flex items-center gap-[8px] text-[#71737a] text-[12px] [&_strong]:overflow-hidden [&_strong]:text-[#c8c9cc] [&_strong]:font-[570] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap">
            <span className="create-dialog__mark w-[22px] h-[22px] grid place-items-center border border-[#3e414b] rounded-full text-[#aeb4f1] bg-[#212329] [&_svg]:w-[12px] [&_svg]:h-[12px] create-dialog__mark--folder rounded-[5px] text-[#d0a363]"><FolderIcon /></span>
            <strong id="new-folder-title">New folder</strong>
          </div>
          <button type="button" className="create-dialog__close w-[28px] h-[28px] grid place-items-center pt-0 pr-0 pb-[2px] pl-0 border-0 rounded-[6px] text-[#777980] bg-transparent leading-none cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#28292d] [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed" aria-label="Close new folder dialog" onClick={onClose} disabled={isSubmitting}>×</button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="folder-composer grid gap-[18px] pt-[24px] pr-[25px] pb-[27px] pl-[25px] [@media_(max-width:760px)]:px-[18px]">
            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Folder name</span>
              <div className="folder-name-field h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&_input]:min-w-0 [&_input]:h-full [&_input]:flex-1 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#d8d8da] [&_input]:bg-transparent [&_input]:text-[12px] [&_input::placeholder]:text-[#55575d] h-[42px] [&>svg]:text-[#c59a5e]">
                <FolderIcon />
                <input
                  type="text"
                  placeholder="e.g. Manufacturing references"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
              </div>
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </label>

            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Location</span>
              <div className="create-select-wrap h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&>svg:last-child]:w-[12px] [&>svg:last-child]:h-[12px] [&>svg:last-child]:pointer-events-none [&_select]:min-w-0 [&_select]:h-full [&_select]:flex-1 [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d8d8da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:scheme-dark [&_select]:cursor-pointer">
                <NavIcon type="table" />
                <select disabled={isSubmitting} {...register("parentId")}>
                  <option value="">Workspace root</option>
                  {folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
                </select>
                <NavIcon type="chevron-down" />
              </div>
            </label>
          </div>

          {apiError ? <div className="create-dialog__error mt-0 mr-[29px] mb-[18px] ml-[29px] py-[9px] px-[11px] border border-[#603b40] rounded-[6px] text-[#e1a3a9] bg-[#2b181b] text-[11px] [@media_(max-width:760px)]:mx-[17px]" role="alert">{apiError}</div> : null}

          <footer className="create-dialog__footer min-h-[61px] flex items-center justify-between gap-[16px] pt-[10px] pr-[14px] pb-[10px] pl-[19px] border-t border-t-[#292b2f] bg-[#161719] [&>div]:flex [&>div]:items-center [&>div]:gap-[8px] [@media_(max-width:760px)]:justify-end">
            <span className="create-dialog__hint text-[#5e6066] text-[10px] [&_kbd]:py-[2px] [&_kbd]:px-[5px] [&_kbd]:border [&_kbd]:border-[#34363b] [&_kbd]:rounded-[4px] [&_kbd]:text-[#81838a] [&_kbd]:bg-[#1d1e21] [@media_(max-width:760px)]:hidden">Folders keep related projects together.</span>
            <div>
              <button type="button" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--secondary border-[#383a3f] text-[#a9aaae] bg-[#1d1e21] [&:hover]:text-[#dfdfe1] [&:hover]:bg-[#242529]" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--primary border-[#747dd8] text-[#fff] bg-[#5e6ad2] [&:hover]:bg-[#6a75dc]" disabled={isSubmitting}>
                {isSubmitting ? <><span className="create-spinner w-[11px] h-[11px] border-[1.5px] border-solid border-[rgba(255,255,255,.34)] border-t-[#fff] rounded-full" />Creating…</> : "Create folder"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </ModalBackdrop>
  );
}

export function CreatePartModal({ onClose }) {
  const mutation = useCreatePart();
  const dialogRef = useRef(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(partFormSchema),
    defaultValues: PART_FORM_DEFAULT_VALUES,
  });
  const isSubmitting = mutation.isPending;
  useModalBehavior(dialogRef, onClose, isSubmitting);

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync(values);
      onClose();
    } catch {
      // Mutation errors are shown in the dialog.
    }
  }

  const apiError = mutation.error ? getCreatePartErrorMessage(mutation.error) : "";

  return (
    <ModalBackdrop onClose={onClose} disabled={isSubmitting} compact>
      <section ref={dialogRef} className="create-dialog overflow-y-auto border border-[#34363c] rounded-[12px] text-[#e6e6e8] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [@media_(max-width:760px)]:w-full create-dialog--part bg-[#191a1c] [&_.create-dialog__error]:mx-[25px]" role="dialog" aria-modal="true" aria-labelledby="new-part-title">
        <header className="create-dialog__header sticky top-0 z-[4] h-[52px] flex items-center justify-between pt-0 pr-[13px] pb-0 pl-[16px] border-b border-b-[#282a2e]">
          <div className="create-dialog__context min-w-0 flex items-center gap-[8px] text-[#71737a] text-[12px] [&_strong]:overflow-hidden [&_strong]:text-[#c8c9cc] [&_strong]:font-[570] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap">
            <span className="create-dialog__mark w-[22px] h-[22px] grid place-items-center border border-[#3e414b] rounded-full text-[#aeb4f1] bg-[#212329] [&_svg]:w-[12px] [&_svg]:h-[12px] create-dialog__mark--part border-[#4a4e77] text-[#bdc3ff] bg-[#292b3b]"><NavIcon type="inventory" /></span>
            <strong id="new-part-title">New part</strong>
          </div>
          <button type="button" className="create-dialog__close w-[28px] h-[28px] grid place-items-center pt-0 pr-0 pb-[2px] pl-0 border-0 rounded-[6px] text-[#777980] bg-transparent leading-none cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#28292d] [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed" aria-label="Close new part dialog" onClick={onClose} disabled={isSubmitting}>×</button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="part-composer grid pt-[24px] pr-[25px] pb-[27px] pl-[25px] [&_.create-field:nth-child(n+3)]:col-span-full [&_.create-field>span]:flex [&_.create-field>span]:items-baseline [&_.create-field>span]:justify-between [&_.create-field>span_small]:text-[#5f6167] [&_.create-field>span_small]:text-[9px] [&_.create-field>span_small]:font-[500] [&_.create-field>span_small]:tracking-normal [&_.create-field>span_small]:normal-case [&_.create-field>input]:w-full [&_.create-field>input]:border [&_.create-field>input]:border-[#35373d] [&_.create-field>input]:rounded-[7px] [&_.create-field>input]:outline-0 [&_.create-field>input]:text-[#d8d8da] [&_.create-field>input]:bg-[#131416] [&_.create-field>input]:text-[12px] [&_.create-field>textarea]:w-full [&_.create-field>textarea]:border [&_.create-field>textarea]:border-[#35373d] [&_.create-field>textarea]:rounded-[7px] [&_.create-field>textarea]:outline-0 [&_.create-field>textarea]:text-[#d8d8da] [&_.create-field>textarea]:bg-[#131416] [&_.create-field>textarea]:text-[12px] [&_.create-field>input]:h-[38px] [&_.create-field>input]:py-0 [&_.create-field>input]:px-[10px] [&_.create-field>textarea]:min-h-[74px] [&_.create-field>textarea]:resize-y [&_.create-field>textarea]:p-[10px] [&_.create-field>textarea]:leading-[1.5] [&_.create-field>textarea.part-composer__dimensions]:min-h-[112px] [&_.create-field>textarea.part-composer__dimensions]:text-[11px] [&_.create-field>input:focus]:border-[#6973d5] [&_.create-field>textarea:focus]:border-[#6973d5] [&_.create-field>input::placeholder]:text-[#5e6066] [&_.create-field>textarea::placeholder]:text-[#5e6066] [@media_(max-width:620px)]:grid-cols-1 [@media_(max-width:620px)]:[&_.create-field:nth-child(n+3)]:col-auto">
            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Part name</span>
              <input
                type="text"
                placeholder="e.g. M4 drive screw"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </label>

            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Type</span>
              <div className="create-select-wrap h-[38px] flex items-center gap-[8px] py-0 px-[10px] border border-[#35373d] rounded-[7px] bg-[#131416] [&:focus-within]:border-[#6973d5] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-none [&>svg]:text-[#74767c] [&>svg:last-child]:w-[12px] [&>svg:last-child]:h-[12px] [&>svg:last-child]:pointer-events-none [&_select]:min-w-0 [&_select]:h-full [&_select]:flex-1 [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d8d8da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:scheme-dark [&_select]:cursor-pointer">
                <NavIcon type="inventory" />
                <select disabled={isSubmitting} aria-invalid={Boolean(errors.type)} {...register("type")}>
                  <option value="">Choose a type</option>
                  {PART_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <NavIcon type="chevron-down" />
              </div>
              {errors.type ? <FieldError>{errors.type.message}</FieldError> : null}
            </label>

            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Dimensions <small>JSON object</small></span>
              <textarea
                className="part-composer__dimensions"
                placeholder={'{\n  "thread": "M4",\n  "length": "40mm"\n}'}
                rows="5"
                spellCheck="false"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.dimensions)}
                {...register("dimensions")}
              />
              {errors.dimensions ? <FieldError>{errors.dimensions.message}</FieldError> : null}
            </label>

            <label className="create-field [&>span]:block [&>span]:mb-[8px] [&>span]:text-[#8a8c92] [&>span]:text-[11px] [&>span]:font-[610] [&>span]:tracking-[.035em]">
              <span>Notes <small>Optional</small></span>
              <textarea
                placeholder="Assembly notes or handling instructions"
                rows="3"
                disabled={isSubmitting}
                {...register("notes")}
              />
            </label>
          </div>

          {apiError ? <div className="create-dialog__error mt-0 mr-[29px] mb-[18px] ml-[29px] py-[9px] px-[11px] border border-[#603b40] rounded-[6px] text-[#e1a3a9] bg-[#2b181b] text-[11px] [@media_(max-width:760px)]:mx-[17px]" role="alert">{apiError}</div> : null}

          <footer className="create-dialog__footer min-h-[61px] flex items-center justify-between gap-[16px] pt-[10px] pr-[14px] pb-[10px] pl-[19px] border-t border-t-[#292b2f] bg-[#161719] [&>div]:flex [&>div]:items-center [&>div]:gap-[8px] [@media_(max-width:760px)]:justify-end">
            <span className="create-dialog__hint text-[#5e6066] text-[10px] [&_kbd]:py-[2px] [&_kbd]:px-[5px] [&_kbd]:border [&_kbd]:border-[#34363b] [&_kbd]:rounded-[4px] [&_kbd]:text-[#81838a] [&_kbd]:bg-[#1d1e21] [@media_(max-width:760px)]:hidden">The part will be added to this organization’s inventory.</span>
            <div>
              <button type="button" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--secondary border-[#383a3f] text-[#a9aaae] bg-[#1d1e21] [&:hover]:text-[#dfdfe1] [&:hover]:bg-[#242529]" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--primary border-[#747dd8] text-[#fff] bg-[#5e6ad2] [&:hover]:bg-[#6a75dc]" disabled={isSubmitting}>
                {isSubmitting ? <><span className="create-spinner w-[11px] h-[11px] border-[1.5px] border-solid border-[rgba(255,255,255,.34)] border-t-[#fff] rounded-full" />Creating…</> : "Create part"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </ModalBackdrop>
  );
}

function ModalBackdrop({ children, compact = false, disabled, onClose }) {
  return (
    <div
      className={`create-modal-backdrop fixed inset-0 z-[300] grid place-items-center py-[34px] px-[24px] overflow-y-auto [@media_(max-width:760px)]:items-end [@media_(max-width:760px)]:pt-[16px] [@media_(max-width:760px)]:pr-[10px] [@media_(max-width:760px)]:pb-[10px] [@media_(max-width:760px)]:pl-[10px]${compact ? " create-modal-backdrop--compact" : ""}`}
      onMouseDown={(event) => {
        if (!disabled && event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function FieldError({ children }) {
  return <span className="create-field-error block mt-[6px] text-[#e08d93] text-[10px]" role="alert">{children}</span>;
}

function flattenFolders(folders, depth = 0, result = []) {
  for (const folder of folders ?? []) {
    result.push({ id: folder.id, label: `${"— ".repeat(depth)}${folder.name}` });
    flattenFolders(folder.children, depth + 1, result);
  }
  return result;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useObjectUrl(file) {
  const url = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

function useModalBehavior(dialogRef, onClose, disabled) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !disabled) onClose();
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [dialogRef, disabled, onClose]);
}
