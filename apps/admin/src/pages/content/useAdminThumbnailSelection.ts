import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminThumbnailFile } from "../../lib/adminTypes";
import { parseAdminThumbnailFile } from "../../lib/adminValidation";

export type AdminThumbnailSelection = {
  readonly previewUrl?: string;
  readonly removed: boolean;
  readonly selected?: AdminThumbnailFile;
};

export type AdminThumbnailSelectionResult =
  | { readonly ok: true }
  | { readonly message: string; readonly ok: false };

const emptySelection = Object.freeze({
  removed: false,
}) satisfies AdminThumbnailSelection;

export function useAdminThumbnailSelection(initialPreviewUrl?: string) {
  const [selection, setSelection] = useState<AdminThumbnailSelection>(() =>
    initialPreviewUrl
      ? { previewUrl: initialPreviewUrl, removed: false }
      : emptySelection,
  );
  const ownedObjectUrlRef = useRef<string | null>(null);

  const revokeOwnedObjectUrl = useCallback(() => {
    const ownedUrl = ownedObjectUrlRef.current;
    if (ownedUrl === null) return;
    ownedObjectUrlRef.current = null;
    URL.revokeObjectURL(ownedUrl);
  }, []);

  useEffect(() => revokeOwnedObjectUrl, [revokeOwnedObjectUrl]);

  const select = useCallback(
    (fileList: FileList | null): AdminThumbnailSelectionResult => {
      const file = fileList?.[0];
      if (!file) return { ok: true };
      const parsed = parseAdminThumbnailFile(file, "thumbnail");
      if (!parsed.ok) {
        return { message: parsed.error.message, ok: false };
      }

      const previewUrl = URL.createObjectURL(file);
      revokeOwnedObjectUrl();
      ownedObjectUrlRef.current = previewUrl;
      setSelection({
        previewUrl,
        removed: false,
        selected: parsed.value,
      });
      return { ok: true };
    },
    [revokeOwnedObjectUrl],
  );

  const remove = useCallback(() => {
    revokeOwnedObjectUrl();
    setSelection({ removed: true });
  }, [revokeOwnedObjectUrl]);

  const reset = useCallback(
    (previewUrl?: string | null) => {
      revokeOwnedObjectUrl();
      setSelection(
        previewUrl ? { previewUrl, removed: false } : emptySelection,
      );
    },
    [revokeOwnedObjectUrl],
  );

  return { remove, reset, select, selection } as const;
}
