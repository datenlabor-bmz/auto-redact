import type { IHighlight } from "react-pdf-highlighter";

// const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
export const uploadPdf = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onFileUpload: (fileUrl: string, file: File) => void,
  onBackendHighlights: (highlights: IHighlight[]) => void
) => {
  const file = event.target.files?.[0];
  if (file) {
    const fileUrl = URL.createObjectURL(file);
    onFileUpload(fileUrl, file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze PDF");
      }

      const analysisResult = await response.json();
      const convertedHighlights = Object.entries(analysisResult).flatMap(
        ([pageNum, highlights]: [string, any[]]) =>
          highlights.map((h: any) => {
            return {
              content: {
                text: h.text || "",
              },
              position: {
                boundingRect: {
                  x1: h.x0,
                  y1: h.y0,
                  x2: h.x1,
                  y2: h.y1,
                  width: h.page_width,
                  height: h.page_height,
                },
                rects: [
                  {
                    x1: h.x0,
                    y1: h.y0,
                    x2: h.x1,
                    y2: h.y1,
                    width: h.page_width,
                    height: h.page_height,
                  },
                ],
                pageNumber: Number.parseInt(pageNum),
              },
              comment: { text: "AI Generated", emoji: "🤖" },
              id: String(Math.random()).slice(2),
            };
          })
      );

      onBackendHighlights(convertedHighlights);
    } catch (error) {
      console.error("Error analyzing PDF:", error);
    }
  }
};
