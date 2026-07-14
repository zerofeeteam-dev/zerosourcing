// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGenerationBoundChoiceDialog } from "./useGenerationBoundChoiceDialog";

let capturedSelect: ((choiceId: string) => void) | null = null;

function Harness({
  disabled,
  generation,
  onAction,
}: {
  readonly disabled: boolean;
  readonly generation: string;
  readonly onAction: (choiceId: string) => void;
}) {
  const dialog = useGenerationBoundChoiceDialog(generation, disabled);
  capturedSelect = dialog.selectDialog;
  return (
    <>
      <button
        onClick={() =>
          dialog.openDialog({
            choices: [{ id: "confirm", label: "확인" }],
            description: "설명",
            onSelect: onAction,
            title: "선택",
          })
        }
        type="button"
      >
        열기
      </button>
      {dialog.request ? <span>열린 선택</span> : null}
    </>
  );
}

afterEach(() => {
  capturedSelect = null;
  cleanup();
});

describe("useGenerationBoundChoiceDialog", () => {
  it("closes on an A to B rerender and ignores a directly invoked stale callback", () => {
    const onAction = vi.fn();
    const view = render(
      <Harness disabled={false} generation="record-a" onAction={onAction} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "열기" }));
    expect(screen.getByText("열린 선택")).toBeTruthy();
    const staleSelect = capturedSelect;

    view.rerender(
      <Harness disabled={false} generation="record-b" onAction={onAction} />,
    );
    expect(screen.queryByText("열린 선택")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "열기" }));
    const currentSelect = capturedSelect;
    act(() => staleSelect?.("confirm"));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText("열린 선택")).toBeTruthy();
    act(() => currentSelect?.("confirm"));
    expect(onAction).toHaveBeenCalledWith("confirm");
  });

  it("closes and rejects selection when the editor becomes hard-disabled", () => {
    const onAction = vi.fn();
    const view = render(
      <Harness disabled={false} generation="record-a" onAction={onAction} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "열기" }));
    const staleSelect = capturedSelect;
    view.rerender(
      <Harness disabled generation="record-a" onAction={onAction} />,
    );

    expect(screen.queryByText("열린 선택")).toBeNull();
    act(() => staleSelect?.("confirm"));
    expect(onAction).not.toHaveBeenCalled();
  });
});
