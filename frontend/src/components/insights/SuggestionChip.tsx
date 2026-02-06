interface SuggestionChipProps {
  text: string;
  onClick: () => void;
}

const SuggestionChip = ({ text, onClick }: SuggestionChipProps) => {
  return (
    <button onClick={onClick} className="suggestion-chip">
      {text}
    </button>
  );
};

export default SuggestionChip;
