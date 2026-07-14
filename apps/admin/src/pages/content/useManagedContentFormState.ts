import { useCallback, useRef, useState } from "react";

export type ManagedContentEntity = "blog" | "portfolio";

export type ManagedContentRowIdentity = {
  readonly id: string;
  readonly slug: string;
  readonly updated_at: string;
};

export type ManagedContentOwnerToken = {
  readonly documentKey: string;
  readonly lease: number;
  readonly revision: number;
};

export type ManagedContentLoadToken = {
  readonly request: number;
  readonly routeParam: string;
};

type OwnedManagedContentForm<TForm> = {
  readonly documentKey: string;
  readonly form: TForm;
  readonly recordId: string | null;
  readonly revision: number;
  readonly routeParam: string | null;
};

type FormUpdater<TForm> = TForm | ((current: TForm) => TForm);

type UseManagedContentFormStateInput<TForm> = {
  readonly createEmptyForm: () => TForm;
  readonly entity: ManagedContentEntity;
};

function newDocumentKey(entity: ManagedContentEntity): string {
  return `${entity}:new:${crypto.randomUUID()}`;
}

function loadedDocumentKey(
  entity: ManagedContentEntity,
  row: ManagedContentRowIdentity,
): string {
  return `${entity}:${row.id}:${row.updated_at}`;
}

/**
 * Keeps a form value and the editor identity that owns it in one state object.
 * Async callbacks use owner/load tokens so an older route cannot mutate the
 * document that replaced it.
 */
export function useManagedContentFormState<TForm>({
  createEmptyForm,
  entity,
}: UseManagedContentFormStateInput<TForm>) {
  const initialStateRef = useRef<OwnedManagedContentForm<TForm> | null>(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = {
      documentKey: newDocumentKey(entity),
      form: createEmptyForm(),
      recordId: null,
      revision: 0,
      routeParam: null,
    };
  }

  const [owned, setOwned] = useState(initialStateRef.current);
  const ownedRef = useRef(owned);
  ownedRef.current = owned;
  const latestLoadRequestRef = useRef(0);
  const latestOwnerLeaseRef = useRef(0);
  const lockedOwnerRef = useRef<ManagedContentOwnerToken | null>(null);

  const commitOwned = useCallback((next: OwnedManagedContentForm<TForm>) => {
    ownedRef.current = next;
    setOwned(next);
  }, []);

  const beginLoad = useCallback(
    (routeParam: string): ManagedContentLoadToken => {
      latestLoadRequestRef.current += 1;
      lockedOwnerRef.current = null;
      return { request: latestLoadRequestRef.current, routeParam };
    },
    [],
  );

  const loadIsCurrent = useCallback((token: ManagedContentLoadToken) => {
    return token.request === latestLoadRequestRef.current;
  }, []);

  const acceptLoaded = useCallback(
    (
      token: ManagedContentLoadToken,
      row: ManagedContentRowIdentity,
      form: TForm,
    ): boolean => {
      if (!loadIsCurrent(token)) return false;
      const current = ownedRef.current;
      if (
        current.recordId === row.id &&
        current.routeParam === token.routeParam
      ) {
        return false;
      }
      lockedOwnerRef.current = null;
      commitOwned({
        documentKey: loadedDocumentKey(entity, row),
        form,
        recordId: row.id,
        revision: current.revision + 1,
        routeParam: token.routeParam,
      });
      return true;
    },
    [commitOwned, entity, loadIsCurrent],
  );

  const replaceWithNew = useCallback(() => {
    latestLoadRequestRef.current += 1;
    lockedOwnerRef.current = null;
    const current = ownedRef.current;
    commitOwned({
      documentKey: newDocumentKey(entity),
      form: createEmptyForm(),
      recordId: null,
      revision: current.revision + 1,
      routeParam: null,
    });
  }, [commitOwned, createEmptyForm, entity]);

  const captureOwner = useCallback((): ManagedContentOwnerToken => {
    const current = ownedRef.current;
    latestOwnerLeaseRef.current += 1;
    return {
      documentKey: current.documentKey,
      lease: latestOwnerLeaseRef.current,
      revision: current.revision,
    };
  }, []);

  const ownerIsCurrent = useCallback((token: ManagedContentOwnerToken) => {
    const current = ownedRef.current;
    return (
      token.documentKey === current.documentKey &&
      token.revision === current.revision
    );
  }, []);

  const lockOwner = useCallback(
    (token: ManagedContentOwnerToken): boolean => {
      if (!ownerIsCurrent(token) || lockedOwnerRef.current !== null) {
        return false;
      }
      lockedOwnerRef.current = token;
      return true;
    },
    [ownerIsCurrent],
  );

  const unlockOwner = useCallback((token: ManagedContentOwnerToken): void => {
    const locked = lockedOwnerRef.current;
    if (
      locked?.documentKey === token.documentKey &&
      locked.lease === token.lease &&
      locked.revision === token.revision
    ) {
      lockedOwnerRef.current = null;
    }
  }, []);

  const documentIsCurrent = useCallback((documentKey: string) => {
    return ownedRef.current.documentKey === documentKey;
  }, []);

  const updateForDocument = useCallback(
    (documentKey: string, updater: FormUpdater<TForm>): boolean => {
      const current = ownedRef.current;
      if (current.documentKey !== documentKey) return false;
      if (
        lockedOwnerRef.current?.documentKey === documentKey &&
        lockedOwnerRef.current.revision === current.revision
      ) {
        return false;
      }
      const form =
        typeof updater === "function"
          ? (updater as (value: TForm) => TForm)(current.form)
          : updater;
      commitOwned({ ...current, form });
      return true;
    },
    [commitOwned],
  );

  const acceptSaved = useCallback(
    (
      token: ManagedContentOwnerToken,
      row: ManagedContentRowIdentity,
      form: TForm,
    ): boolean => {
      if (!ownerIsCurrent(token)) return false;
      const locked = lockedOwnerRef.current;
      if (
        locked?.documentKey !== token.documentKey ||
        locked.lease !== token.lease ||
        locked.revision !== token.revision
      ) {
        return false;
      }
      const current = ownedRef.current;
      lockedOwnerRef.current = null;
      commitOwned({
        ...current,
        form,
        recordId: row.id,
        routeParam: row.slug,
      });
      return true;
    },
    [commitOwned, ownerIsCurrent],
  );

  const matchesCurrentRoute = useCallback((routeParam: string): boolean => {
    const current = ownedRef.current;
    return current.recordId !== null && current.routeParam === routeParam;
  }, []);

  const invalidateLoads = useCallback(() => {
    latestLoadRequestRef.current += 1;
  }, []);

  return {
    acceptLoaded,
    acceptSaved,
    beginLoad,
    captureOwner,
    documentIsCurrent,
    documentKey: owned.documentKey,
    form: owned.form,
    invalidateLoads,
    loadIsCurrent,
    lockOwner,
    matchesCurrentRoute,
    ownerIsCurrent,
    recordId: owned.recordId,
    replaceWithNew,
    routeParam: owned.routeParam,
    unlockOwner,
    updateForDocument,
  } as const;
}
