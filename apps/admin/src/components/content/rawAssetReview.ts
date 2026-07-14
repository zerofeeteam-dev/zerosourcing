export type RawAssetReviewStatus =
  | "ready"
  | "uploading"
  | "uploaded"
  | "error"
  | "removing";

export type RawAssetReviewItem = {
  readonly errorMessage: string | null;
  readonly file: File;
  readonly id: string;
  readonly path: string | null;
  readonly publicUrl: string | null;
  readonly relativePath: string;
  readonly status: RawAssetReviewStatus;
};

export function rawAssetReviewStatusLabel(
  status: RawAssetReviewStatus,
): string {
  switch (status) {
    case "ready":
      return "검토 대기";
    case "uploading":
      return "업로드 중";
    case "uploaded":
      return "업로드 완료";
    case "error":
      return "오류";
    case "removing":
      return "정리 중";
  }
}

export function proposedRawAssetRelativePath(file: File): string {
  return file.webkitRelativePath || `images/${file.name}`;
}

export function createRawAssetReviewItems(
  files: readonly File[],
  createId: () => string = () => crypto.randomUUID(),
): readonly RawAssetReviewItem[] {
  return files.map((file) => ({
    errorMessage: null,
    file,
    id: createId(),
    path: null,
    publicUrl: null,
    relativePath: proposedRawAssetRelativePath(file),
    status: "ready",
  }));
}

export function updateRawAssetReviewItem(
  items: readonly RawAssetReviewItem[],
  id: string,
  update: Partial<Omit<RawAssetReviewItem, "file" | "id">>,
): readonly RawAssetReviewItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...update } : item));
}

export function rawHtmlContainsBaseElement(html: string): boolean {
  return /<base(?:\s|\/?>)/iu.test(html);
}

export function isSupportedHtmlSourceFile(file: File): boolean {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  return (
    file.type === "text/html" || extension === "html" || extension === "htm"
  );
}
