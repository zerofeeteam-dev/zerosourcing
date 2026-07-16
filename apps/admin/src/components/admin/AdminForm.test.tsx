// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDateField } from "./AdminForm";

describe("AdminDateField", () => {
  afterEach(cleanup);

  it("opens the native date picker only when the input control is clicked", () => {
    const showPicker = vi.fn();

    render(
      <AdminDateField
        id="published-date"
        label="블로그 작성일"
        onChange={vi.fn()}
        placeholder="블로그 작성일을 선택해주세요."
        value="2026-07-17"
      />,
    );

    const input = screen.getByLabelText("블로그 작성일");
    Object.defineProperty(input, "showPicker", {
      configurable: true,
      value: showPicker,
    });

    fireEvent.click(screen.getByText("블로그 작성일"));
    expect(showPicker).not.toHaveBeenCalled();

    fireEvent.click(input);

    expect(showPicker).toHaveBeenCalledOnce();
  });

  it("does not open the picker when the field is disabled", () => {
    const showPicker = vi.fn();

    render(
      <AdminDateField
        disabled
        id="published-date"
        label="블로그 작성일"
        onChange={vi.fn()}
        placeholder="블로그 작성일을 선택해주세요."
        value="2026-07-17"
      />,
    );

    const input = screen.getByLabelText("블로그 작성일");
    Object.defineProperty(input, "showPicker", {
      configurable: true,
      value: showPicker,
    });

    fireEvent.click(input);

    expect(showPicker).not.toHaveBeenCalled();
  });
});
