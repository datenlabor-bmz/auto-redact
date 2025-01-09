export const uploadPdf = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onFileUpload: (fileUrl: string, file: File) => void,
) => {
  const file = event.target.files?.[0];
  if (file) {
    const fileUrl = URL.createObjectURL(file);
    onFileUpload(fileUrl, file);
  }
};
