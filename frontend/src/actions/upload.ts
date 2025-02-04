import { SecuredactHighlight } from "../types/highlights";

export const uploadPdf = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onFileUpload: (
    fileUrl: string,
    file: File,
    highlights: Array<SecuredactHighlight>
  ) => void
) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save annotations");
      }

      const responseData = await response.json();
      const { pdf: pdfBase64, highlights } = responseData;

      // Convert base64 PDF back to blob
      const pdfBlob = await fetch(
        `data:application/pdf;base64,${pdfBase64}`
      ).then((res) => res.blob());
      const fileWithoutRedactionAnnotations = new File([pdfBlob], file.name, {
        type: "application/pdf",
      });

      // Create URL from the processed file
      const processedFileUrl = URL.createObjectURL(
        fileWithoutRedactionAnnotations
      );
      onFileUpload(
        processedFileUrl,
        fileWithoutRedactionAnnotations,
        highlights
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  }
};
