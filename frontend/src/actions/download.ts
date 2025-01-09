import type { IHighlight } from "react-pdf-highlighter";

export const downloadPdf = async (
  currentPdfFile: File,
  highlights: IHighlight[],
  isDraft: boolean = false
) => {
  if (!currentPdfFile) {
    alert("No PDF file loaded");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", currentPdfFile);

    // Transform highlights back to PyMuPDF coordinate system
    const transformedHighlights = highlights.map((h) => {
      return {
        ...h,
        position: {
          ...h.position,
          boundingRect: {
            ...h.position.boundingRect,
            // Convert back to PyMuPDF coordinates
            y1: h.position.boundingRect.y1,
            y2: h.position.boundingRect.y2,
          },
        },
      };
    });

    formData.append("annotations", JSON.stringify(transformedHighlights));
    formData.append("is_draft", JSON.stringify(isDraft));

    const response = await fetch("/api/save-annotations", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to save annotations");
    }

    // Download the annotated PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isDraft ? `draft_${currentPdfFile.name}` : `redacted_${currentPdfFile.name}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error saving annotations:", error);
    alert("Failed to save annotations");
  }
};
