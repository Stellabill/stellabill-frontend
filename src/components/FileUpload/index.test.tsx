import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "./index";

function makeFile(name: string, type: string, sizeBytes: number = 1024): File {
  const file = new File(["a".repeat(sizeBytes)], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("FileUpload/index.ts public API", () => {
  it("exports FileUpload component and allows successful upload", async () => {
    const onFileSelect = vi.fn();
    render(<FileUpload variant="csv" onFileSelect={onFileSelect} />);
    
    // Idle state
    const zone = screen.getByTestId("file-upload-dropzone");
    expect(zone).toBeInTheDocument();
    
    // Drop valid file
    const file = new File(["col1,col2\nval1,val2"], "data.csv", { type: "text/csv" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    
    // Success state
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-csv-preview")).toBeInTheDocument();
    });
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("handles invalid inputs (file type rejection)", async () => {
    render(<FileUpload variant="csv" />);
    const zone = screen.getByTestId("file-upload-dropzone");
    
    // Drop invalid file
    const badFile = makeFile("photo.png", "image/png");
    fireEvent.drop(zone, { dataTransfer: { files: [badFile] } });
    
    // Error state
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/file type not accepted/i);
  });

  it("handles boundary behavior (max file size)", async () => {
    render(<FileUpload variant="csv" maxSizeBytes={100} />);
    const zone = screen.getByTestId("file-upload-dropzone");
    
    // Drop large file
    const bigFile = makeFile("data.csv", "text/csv", 200);
    fireEvent.drop(zone, { dataTransfer: { files: [bigFile] } });
    
    // Error state
    await waitFor(() => {
      expect(screen.getByTestId("file-upload-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/too large/i);
  });
});
