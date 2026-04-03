import React, { useState, useRef, useEffect } from "react";

export default function SearchableDropdown({
  label,
  placeholder,
  options = [],
  value,
  onChange,
  onAddNew,
  error,
  disabled = false,
  displayKey = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [newValue, setNewValue] = useState("");

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getDisplayValue = (opt) => {
    if (!opt) return "";
    if (typeof opt === "string") return opt;
    if (displayKey && opt[displayKey]) return opt[displayKey];
    return opt.name || opt.project_name || "";
  };

  const filteredOptions = options.filter((opt) =>
    getDisplayValue(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowNewInput(false);
        setNewValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleAddNewClick = () => {
    setShowNewInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNewSubmit = () => {
    if (!newValue.trim()) return;

    const val = newValue.charAt(0).toUpperCase() + newValue.slice(1);

    if (onAddNew) onAddNew(val);

    onChange(val);

    setShowNewInput(false);
    setNewValue("");
    setIsOpen(false);
  };

  return (
  <div ref={containerRef} className="field" style={{ position: "relative" }}>
    
    {label && (
      <label className={`field-label ${error ? "error-label" : ""}`}>
        {label} *
      </label>
    )}

    <div
      onClick={() => !disabled && setIsOpen(!isOpen)}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    border: error ? "1px solid #ef4444" : "1px solid #3f3f46",
    background: "#09090b",
    color: value ? "#ffffff" : "#71717a",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  }}
>
  <span>{value ? getDisplayValue(value) : placeholder}</span>
  <span style={{ fontSize: "12px", color: "#71717a" }}>&#8964;</span>
</div>
      {isOpen && !disabled && (
        <div
          style={{
            border: "1px solid #444",
            background: "#09090b",
            position: "absolute",
            width: "100%",
            zIndex: 1000
          }}
        >

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "none",
              outline: "none",
              background: "#18181b",
              color: "#fff"
            }}
          />

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                style={{
                  padding: "8px",
                  cursor: "pointer"
                }}
                onClick={() => handleSelect(opt)}
              >
                {getDisplayValue(opt)}
              </div>
            ))
          ) : (
            <div style={{ padding: "8px", color: "#888" }}>
              No results found
            </div>
          )}

          {onAddNew && (
            <div style={{ borderTop: "1px solid #333", padding: "8px" }}>
              
              {!showNewInput ? (
                <div
                  style={{ color: "#4f46e5", cursor: "pointer" }}
                  onClick={handleAddNewClick}
                >
                  + New
                </div>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    ref={inputRef}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={`New ${label}`}
                    style={{ flex: 1, padding: "6px" }}
                  />
                  <button onClick={handleNewSubmit}>
                    Add
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}