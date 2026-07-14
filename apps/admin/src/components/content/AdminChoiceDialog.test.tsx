// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminChoiceDialog } from "./AdminChoiceDialog";

function DialogHarness({
  onSelect = vi.fn(),
}: {
  readonly onSelect?: (choice: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        대화상자 열기
      </button>
      <AdminChoiceDialog
        choices={[
          { id: "first", label: "첫 번째 초안" },
          { id: "second", label: "두 번째 초안" },
        ]}
        description="사용할 초안을 선택합니다."
        onCancel={() => setOpen(false)}
        onSelect={(choice) => {
          onSelect(choice);
          setOpen(false);
        }}
        open={open}
        title="초안 선택"
      />
    </>
  );
}

describe("AdminChoiceDialog", () => {
  afterEach(() => cleanup());

  it("labels an aria-modal dialog, contains focus, and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "대화상자 열기" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "초안 선택" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const first = screen.getByRole("button", { name: "첫 번째 초안" });
    const cancel = screen.getByRole("button", { name: "취소" });
    expect(document.activeElement).toBe(first);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cancel);
    await user.tab();
    expect(document.activeElement).toBe(first);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("returns the named choice and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DialogHarness onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "대화상자 열기" }));
    await user.click(screen.getByRole("button", { name: "두 번째 초안" }));
    expect(onSelect).toHaveBeenCalledWith("second");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
