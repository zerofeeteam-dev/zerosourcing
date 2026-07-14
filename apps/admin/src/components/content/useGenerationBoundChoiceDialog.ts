import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminChoiceRequest } from "./AdminChoiceDialog";

type BoundChoiceRequest = {
  readonly generation: string;
  readonly request: AdminChoiceRequest;
};

export function canSelectGenerationBoundChoice(
  bound: BoundChoiceRequest | null,
  activeGeneration: string,
  disabled: boolean,
): bound is BoundChoiceRequest {
  return bound !== null && !disabled && bound.generation === activeGeneration;
}

/**
 * Owns every destructive choice at the editor boundary. Selection callbacks
 * bind the rendered request and validate it against the latest generation and
 * hard-disabled state before invoking a captured action.
 */
export function useGenerationBoundChoiceDialog(
  activeGeneration: string,
  disabled: boolean,
) {
  const generationRef = useRef(activeGeneration);
  generationRef.current = activeGeneration;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const boundRef = useRef<BoundChoiceRequest | null>(null);
  const [bound, setBound] = useState<BoundChoiceRequest | null>(null);

  const closeDialog = useCallback(() => {
    boundRef.current = null;
    setBound(null);
  }, []);

  const openDialog = useCallback((request: AdminChoiceRequest) => {
    if (disabledRef.current) return;
    const next = {
      generation: generationRef.current,
      request,
    } satisfies BoundChoiceRequest;
    boundRef.current = next;
    setBound(next);
  }, []);

  const cancelDialog = useCallback(() => {
    if (boundRef.current === bound) closeDialog();
  }, [bound, closeDialog]);

  const selectDialog = useCallback(
    (choiceId: string) => {
      const current = bound;
      if (boundRef.current !== current) return;
      closeDialog();
      if (
        !canSelectGenerationBoundChoice(
          current,
          generationRef.current,
          disabledRef.current,
        )
      ) {
        return;
      }
      current.request.onSelect(choiceId);
    },
    [bound, closeDialog],
  );

  useEffect(() => {
    if (
      boundRef.current &&
      !canSelectGenerationBoundChoice(
        boundRef.current,
        activeGeneration,
        disabled,
      )
    ) {
      closeDialog();
    }
  }, [activeGeneration, closeDialog, disabled]);

  const activeRequest = canSelectGenerationBoundChoice(
    bound,
    activeGeneration,
    disabled,
  )
    ? bound.request
    : null;

  return {
    cancelDialog,
    openDialog,
    request: activeRequest,
    selectDialog,
  } as const;
}
