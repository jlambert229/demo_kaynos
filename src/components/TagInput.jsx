import { useState, useRef, useCallback } from "react";
import AppIcon from "./AppIcon";

export default function TagInput({ tags = [], onChange, placeholder = "Add tag...", suggestions = [] }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const addTag = useCallback((raw) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  }, [tags, onChange]);

  const removeTag = useCallback((tag) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filtered = input.length > 0
    ? suggestions.filter((s) => s.includes(input.toLowerCase()) && !tags.includes(s))
    : [];

  return (
    <div className="tag-input-wrap">
      <div className={`tag-input-box ${focused ? "tag-input-box--focused" : ""}`} onClick={() => inputRef.current?.focus()}>
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
            <button type="button" className="tag-pill-x" onClick={(e) => { e.stopPropagation(); removeTag(tag); }} aria-label={`Remove ${tag}`}>
              <AppIcon name="cross-mark" size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setTimeout(() => setFocused(false), 150); if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ""}
          aria-label="Add tag"
        />
      </div>
      {focused && filtered.length > 0 && (
        <ul className="tag-suggestions">
          {filtered.slice(0, 8).map((s) => (
            <li key={s}>
              <button type="button" className="tag-suggestion-btn" onMouseDown={(e) => { e.preventDefault(); addTag(s); }}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TagList({ tags = [], onTagClick }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="tag-chip"
          onClick={() => onTagClick?.(tag)}
          title={onTagClick ? `Filter by "${tag}"` : tag}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
