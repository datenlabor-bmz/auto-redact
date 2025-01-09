import type { IHighlight } from "react-pdf-highlighter";

export const analyzePdf = async (
  currentPdfFile: File,
  customPrompt: string,
  setHighlights: React.Dispatch<React.SetStateAction<IHighlight[]>>,
  setIsAnalyzing: (isAnalyzing: boolean) => void
) => {
  if (!currentPdfFile) return;

  setIsAnalyzing(true);
  try {
    const formData = new FormData();
    formData.append("file", currentPdfFile);
    formData.append("prompt", customPrompt);

    const response = await fetch("/api/analyze-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze PDF");
    }

    const stream = response.body;
    if (!stream) {
      throw new Error("No response body");
    }

    await stream
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                controller.enqueue(line.slice(5));
              }
            }
          },
        })
      )
      .pipeTo(
        new WritableStream({
          write(chunk) {
            const data = JSON.parse(chunk);

            if (data.status === "completed") {
              setIsAnalyzing(false);
              return;
            }

            if (data.status === "started") return;

            const highlight: IHighlight = {
              content: { text: data.text },
              position: {
                boundingRect: {
                  x1: data.x0,
                  y1: data.y0,
                  x2: data.x1,
                  y2: data.y1,
                  width: data.page_width,
                  height: data.page_height,
                },
                rects: [
                  {
                    x1: data.x0,
                    y1: data.y0,
                    x2: data.x1,
                    y2: data.y1,
                    width: data.page_width,
                    height: data.page_height,
                  },
                ],
                pageNumber: data.page,
              },
              comment: { text: "", emoji: "" },
              id: String(Math.random()).slice(2),
            };

            setHighlights((prev) => [...prev, highlight]);
          },
        })
      );
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    setIsAnalyzing(false);
  }
};
