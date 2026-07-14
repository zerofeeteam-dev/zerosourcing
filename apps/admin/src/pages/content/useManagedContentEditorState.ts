import { useCallback, useEffect, useState } from "react";

type EditorState = {
  readonly busy: boolean;
  readonly documentKey: string;
  readonly pendingAssetCount: number;
};

export function useManagedContentEditorState(
  documentKey: string,
  documentIsCurrent: (documentKey: string) => boolean,
) {
  const [state, setState] = useState<EditorState>({
    busy: true,
    documentKey,
    pendingAssetCount: 0,
  });

  useEffect(() => {
    setState({ busy: true, documentKey, pendingAssetCount: 0 });
  }, [documentKey]);

  const onBusyChange = useCallback(
    (busy: boolean) => {
      if (!documentIsCurrent(documentKey)) return;
      setState((current) => ({
        busy,
        documentKey,
        pendingAssetCount:
          current.documentKey === documentKey ? current.pendingAssetCount : 0,
      }));
    },
    [documentIsCurrent, documentKey],
  );

  const onPendingAssetCountChange = useCallback(
    (pendingAssetCount: number) => {
      if (!documentIsCurrent(documentKey)) return;
      setState((current) => ({
        busy: current.documentKey === documentKey ? current.busy : true,
        documentKey,
        pendingAssetCount,
      }));
    },
    [documentIsCurrent, documentKey],
  );

  const activeState =
    state.documentKey === documentKey
      ? state
      : { busy: true, documentKey, pendingAssetCount: 0 };

  return {
    busy: activeState.busy,
    onBusyChange,
    onPendingAssetCountChange,
    pendingAssetCount: activeState.pendingAssetCount,
  } as const;
}
