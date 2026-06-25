import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileUpload } from "./FileUpload";

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const content = new Array(sizeBytes).fill("a").join("");
  return new File([content], name, { type });
}

describe("FileUpload component", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("renders in idle state by default", () => {
    render(<FileUpload />);
    expect(screen.getByTestId("file-upload-dropzone")).toBeInTheDocument();
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("renders hidden file input with correct accept for csv variant", () => {
    render(<FileUpload variant="csv" />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    expect(input.accept).toContain("text/csv");
  });

  it("renders hidden file input with correct accept for logo variant", () => {
    render(<FileUpload variant="logo" />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    expect(input.accept).toContain("image/png");
  });

  it("renders hidden file input with correct accept for avatar variant", () => {
    render(<FileUpload variant="avatar" />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    expect(input.accept).toContain("image/jpeg");
  });

  it("drop zone has role=button and is focusable", () => {
    render(<FileUpload />);
    const zone = screen.getByTestId("file-upload-dropzone");
    expect(zone).toHaveAttribute("role", "button");
    expect(zone).toHaveAttribute("tabIndex", "0");
  });

  it("drop zone has aria-label for screen readers", () => {
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    expect(zone.getAttribute("aria-label")).toMatch(/csv/i);
  });

  it("shows size limit in hint text", () => {
    render(<FileUpload maxSizeBytes={5 * 1024 * 1024} />);
    expect(screen.getByText(/max 5 mb/i)).toBeInTheDocument();
  });

  it("clicking drop zone triggers file input click", async () => {
    render(<FileUpload />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    const zone = screen.getByTestId("file-upload-dropzone");
    await userEvent.click(zone);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("pressing Enter on drop zone opens file dialog", () => {
    render(<FileUpload />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("pressing Space on drop zone opens file dialog", () => {
    render(<FileUpload />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.keyDown(zone, { key: " " });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("adds dragover class when dragging over the zone", () => {
    render(<FileUpload />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.dragOver(zone);
    expect(zone.className).toContain("dragover");
    expect(screen.getByText(/release to upload/i)).toBeInTheDocument();
  });

  it("returns to idle state on drag leave", () => {
    render(<FileUpload />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    expect(zone.className).toContain("idle");
  });

  it("shows error for rejected file type", async () => {
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    const badFile = makeFile("photo.png", "image/png");
    fireEvent.drop(zone, { dataTransfer: { files: [badFile] } });
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/file type not accepted/i);
  });

  it("shows error when file exceeds max size", async () => {
    render(<FileUpload variant="csv" maxSizeBytes={100} />);
    const zone = screen.getByTestId("file-upload-dropzone");
    const bigFile = makeFile("data.csv", "text/csv", 200);
    fireEvent.drop(zone, { dataTransfer: { files: [bigFile] } });
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/too large/i);
  });

  it("shows success state and CSV preview after valid drop", async () => {
    const csvContent = "name,email,amount\nAlice,alice@example.com,100\nBob,bob@example.com,200";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-csv-preview")).toBeInTheDocument();
    });
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows image preview after valid logo upload", async () => {
    const file = makeFile("logo.png", "image/png");
    render(<FileUpload variant="logo" />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-image-preview")).toBeInTheDocument();
    });
  });

  it("calls onFileSelect with the file on valid upload", async () => {
    const csvContent = "col1,col2\nval1,val2";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    const onFileSelect = vi.fn();
    render(<FileUpload variant="csv" onFileSelect={onFileSelect} />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(onFileSelect).toHaveBeenCalledWith(file));
  });

  it("shows error state when onFileSelect throws", async () => {
    const csvContent = "col1\nval1";
    const file = new File([csvContent], "fail.csv", { type: "text/csv" });
    const onFileSelect = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<FileUpload variant="csv" onFileSelect={onFileSelect} />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/network error/i);
  });

  it("retry button resets to idle state", async () => {
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    const badFile = makeFile("photo.png", "image/png");
    fireEvent.drop(zone, { dataTransfer: { files: [badFile] } });
    await waitFor(() => screen.getByTestId("file-upload-error"));
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryBtn);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("remove button resets to idle after successful upload", async () => {
    const csvContent = "col1\nval1";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => screen.getByTestId("file-upload-csv-preview"));
    const removeBtn = screen.getByRole("button", { name: /remove uploaded csv/i });
    await userEvent.click(removeBtn);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("progress bar has role=progressbar during upload", async () => {
    const onFileSelect = vi.fn(() => new Promise<void>((res) => setTimeout(res, 500)));
    const csvContent = "col1\nval1";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    render(<FileUpload variant="csv" onFileSelect={onFileSelect} />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  it("truncates CSV preview to max 5 rows and 6 columns", async () => {
    const headers = Array.from({ length: 10 }, (_, i) => `col${i}`).join(",");
    const row = Array.from({ length: 10 }, (_, i) => `val${i}`).join(",");
    const rows = Array.from({ length: 10 }, () => row).join("\n");
    const file = new File([`${headers}\n${rows}`], "large.csv", { type: "text/csv" });
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => screen.getByTestId("file-upload-csv-preview"));
    const cols = screen.getAllByRole("columnheader");
    expect(cols.length).toBeLessThanOrEqual(6);
    const allRows = screen.getAllByRole("row");
    expect(allRows.length).toBeLessThanOrEqual(6);
  });

  it("handles file selection via input change (mobile picker)", async () => {
    const csvContent = "a,b\n1,2";
    const file = new File([csvContent], "mobile.csv", { type: "text/csv" });
    render(<FileUpload variant="csv" />);
    const input = screen.getByTestId("file-upload-input") as HTMLInputElement;
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-csv-preview")).toBeInTheDocument();
    });
  });

  it("applies custom className to root", () => {
    render(<FileUpload className="my-custom" />);
    expect(screen.getByTestId("file-upload-root").className).toContain("my-custom");
  });

  it("has a live region for screen reader announcements", () => {
    render(<FileUpload />);
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
  });
});
