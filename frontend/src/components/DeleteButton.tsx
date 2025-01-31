import { ViewportHighlight } from "react-pdf-highlighter";

interface DeleteButtonProps {
  onClick: () => void;
  highlight: ViewportHighlight;
}

export function DeleteButton({ onClick, highlight }: DeleteButtonProps) {
  const { left, top, width, height } =
    highlight.position.rects.length > 0
      ? highlight.position.rects[0]
      : highlight.position.boundingRect;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: top - 10,
        left: left + width - 10,
      }}
      className="select-none flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      aria-label="Delete highlight"
    >
      ×
    </button>
  );
}
