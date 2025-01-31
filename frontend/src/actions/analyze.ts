import * as React from "react";
import type { SecuredactHighlight } from "../types/highlights";

export const analyzePdf = async (
  currentPdfFile: File,
  customPrompt: string,
  setIsAnalyzing: (isAnalyzing: boolean) => void,
  addHighlight: (highlight: SecuredactHighlight) => void
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
            addHighlight(data);
          },
        })
      );
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    setIsAnalyzing(false);
  }
};
