import { describe, expect, it, vi } from "vitest";

import type { SupabaseConfig } from "./supabase";
import { revalidatePublicContent } from "./publicContentRevalidation";

function enabledConfig(
  accessToken: string | null,
): Extract<SupabaseConfig, { kind: "enabled" }> {
  return {
    client: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: accessToken ? { access_token: accessToken } : null,
          },
          error: null,
        }),
      },
    },
    kind: "enabled",
    url: "https://project.supabase.co",
  } as unknown as Extract<SupabaseConfig, { kind: "enabled" }>;
}

describe("revalidatePublicContent", () => {
  it("sends the current admin bearer token to the public revalidation route", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(
      revalidatePublicContent(
        enabledConfig("admin-token"),
        {
          entity: "blog",
          previousSlug: "old-slug",
          slug: "new-slug",
        },
        {
          fetch: fetchMock,
          publicSiteUrl: "https://www.zerosourcing.kr",
        },
      ),
    ).resolves.toEqual({ ok: true });

    const [request, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(request)).toBe(
      "https://www.zerosourcing.kr/api/revalidate-public-content",
    );
    expect(init).toMatchObject({
      body: JSON.stringify({
        entity: "blog",
        previousSlug: "old-slug",
        slug: "new-slug",
      }),
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      method: "POST",
    });
  });

  it("does not call the public route without a valid admin session", async () => {
    const fetchMock = vi.fn();

    await expect(
      revalidatePublicContent(
        enabledConfig(null),
        { entity: "portfolio", slug: "example" },
        { fetch: fetchMock, publicSiteUrl: "https://www.zerosourcing.kr" },
      ),
    ).resolves.toMatchObject({ ok: false });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to send an admin token to an insecure remote origin", async () => {
    const fetchMock = vi.fn();

    await expect(
      revalidatePublicContent(
        enabledConfig("admin-token"),
        { entity: "portfolio", slug: "example" },
        { fetch: fetchMock, publicSiteUrl: "http://example.com" },
      ),
    ).resolves.toEqual({
      message: "공개 사이트 주소가 올바르지 않아 캐시를 갱신하지 못했습니다.",
      ok: false,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the saved content successful when cache invalidation is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      revalidatePublicContent(
        enabledConfig("admin-token"),
        { entity: "portfolio", slug: "example" },
        { fetch: fetchMock, publicSiteUrl: "https://www.zerosourcing.kr" },
      ),
    ).resolves.toEqual({
      message: "네트워크 문제로 공개 사이트 캐시를 갱신하지 못했습니다.",
      ok: false,
    });
  });
});
