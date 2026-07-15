import { adminFailureMessage, type AdminFailure } from "../../lib/adminErrors";

type StorageCleanupIssue = {
  readonly failure: AdminFailure;
  readonly path: string;
  readonly stage?: string;
};

export function managedContentActionBlockReason(input: {
  readonly editorBusy: boolean;
  readonly pendingAssetCount: number;
}): string | undefined {
  if (input.pendingAssetCount > 0) {
    return `본문 이미지 ${input.pendingAssetCount}개를 처리하고 있습니다. 완료될 때까지 저장하거나 이동할 수 없습니다.`;
  }
  if (input.editorBusy) {
    return "본문 에디터가 저장 가능한 내용을 준비하고 있습니다.";
  }
  return undefined;
}

export function thumbnailCleanupWarning(
  issues: readonly StorageCleanupIssue[],
): string | undefined {
  if (issues.length === 0) return undefined;
  return issues
    .map(
      (issue) =>
        `${adminFailureMessage(issue.failure)} 수동 확인 경로: ${issue.path}`,
    )
    .join(" ");
}
