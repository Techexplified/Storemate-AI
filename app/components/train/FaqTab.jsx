import { useState, useRef, useEffect } from "react";
import { 
  Plus, Search, ChevronDown, ChevronUp, GripVertical, 
  RotateCcw, Truck, ShoppingBag, CreditCard, HelpCircle, 
  Check, MoreVertical, ArrowLeft
} from "lucide-react";

export const CATEGORIES = [
  { id: "Returns & Refunds", label: "Returns & Refunds", icon: RotateCcw },
  { id: "Shipping", label: "Shipping", icon: Truck },
  { id: "Orders", label: "Orders", icon: ShoppingBag },
  { id: "Payments", label: "Payments", icon: CreditCard },
  { id: "General", label: "General", icon: HelpCircle },
];

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export default function FaqTab({ faqs, setFaqs, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All Categories");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Status");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [editBuffer, setEditBuffer] = useState({});

  const categoryRef = useRef(null);
  const statusRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const visibleFaqs = faqs.filter((f) => !f._deleted);

  const filteredFaqs = visibleFaqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === "All Categories" ||
      (faq.category || "General") === selectedCategoryFilter;

    const matchesStatus =
      selectedStatusFilter === "All Status" ||
      (selectedStatusFilter === "Active" ? faq.isActive !== false : faq.isActive === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddFaq = () => {
    const newId = `temp-${Date.now()}`;
    const newFaq = {
      id: newId,
      question: "",
      answer: "",
      category: selectedCategoryFilter !== "All Categories" ? selectedCategoryFilter : "General",
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    setFaqs([newFaq, ...faqs]);
    setExpandedFaqId(newId);
    setEditBuffer({ [newId]: { ...newFaq } });
  };

  const handleStartEdit = (faq) => {
    if (expandedFaqId === faq.id) {
      setExpandedFaqId(null);
    } else {
      setExpandedFaqId(faq.id);
      setEditBuffer({
        ...editBuffer,
        [faq.id]: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category || "General",
          isActive: faq.isActive !== false,
        },
      });
    }
  };

  const handleSaveInline = (id) => {
    const current = editBuffer[id];
    if (!current) return;
    setFaqs(
      faqs.map((f) => (f.id === id ? { ...f, ...current, updatedAt: new Date().toISOString() } : f))
    );
    setExpandedFaqId(null);
  };

  const handleCancelInline = (id) => {
    // If it was a newly added empty FAQ, remove it
    if (String(id).startsWith("temp-") && !editBuffer[id]?.question.trim()) {
      setFaqs(faqs.filter((f) => f.id !== id));
    }
    setExpandedFaqId(null);
  };

  const handleToggleActive = (e, faq) => {
    e.stopPropagation();
    const updatedStatus = faq.isActive === false ? true : false;
    setFaqs(
      faqs.map((f) => (f.id === faq.id ? { ...f, isActive: updatedStatus, updatedAt: new Date().toISOString() } : f))
    );
  };

  const handleDelete = (id) => {
    setFaqs(
      faqs
        .map((f) => {
          if (f.id === id) return typeof id === "string" && !id.startsWith("temp-") ? { ...f, _deleted: true } : null;
          return f;
        })
        .filter(Boolean)
    );
    setExpandedFaqId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Back to Menu */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "20px",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to menu
        </button>
      )}

      {/* Header & Add Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.3px" }}>
            FAQs
          </h2>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Add and manage frequently asked questions and accurate answers.
          </p>
        </div>

        <button
          onClick={handleAddFaq}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#7c3aed",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(124, 58, 237, 0.2)",
          }}
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              fontSize: "13px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              outline: "none",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category Filter Popover */}
        <div style={{ position: "relative" }} ref={categoryRef}>
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            {selectedCategoryFilter}
            <ChevronDown size={14} color="#64748b" />
          </button>

          {isCategoryOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                width: "210px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                padding: "6px",
                zIndex: 40,
              }}
            >
              <div
                onClick={() => {
                  setSelectedCategoryFilter("All Categories");
                  setIsCategoryOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: selectedCategoryFilter === "All Categories" ? "600" : "400",
                  cursor: "pointer",
                  backgroundColor: selectedCategoryFilter === "All Categories" ? "#f8fafc" : "transparent",
                }}
              >
                <span>All Categories</span>
                {selectedCategoryFilter === "All Categories" && <Check size={14} color="#7c3aed" />}
              </div>
              <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
              {CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryFilter(cat.id);
                      setIsCategoryOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#f8fafc" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconComp size={15} color="#64748b" />
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && <Check size={14} color="#7c3aed" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Filter Popover */}
        <div style={{ position: "relative" }} ref={statusRef}>
          <button
            type="button"
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            {selectedStatusFilter}
            <ChevronDown size={14} color="#64748b" />
          </button>

          {isStatusOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "150px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                padding: "6px",
                zIndex: 40,
              }}
            >
              {["All Status", "Active", "Inactive"].map((st) => (
                <div
                  key={st}
                  onClick={() => {
                    setSelectedStatusFilter(st);
                    setIsStatusOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                    backgroundColor: selectedStatusFilter === st ? "#f8fafc" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {st === "Active" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />}
                    {st === "Inactive" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94a3b8" }} />}
                    <span>{st}</span>
                  </div>
                  {selectedStatusFilter === st && <Check size={14} color="#7c3aed" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 40px 1fr 140px 100px 110px 30px",
          padding: "12px 16px",
          borderBottom: "1px solid #f1f5f9",
          fontSize: "12px",
          fontWeight: "600",
          color: "#64748b",
          alignItems: "center",
        }}>
          <span />
          <span>#</span>
          <span>Question</span>
          <span>Category</span>
          <span>Status</span>
          <span>Updated</span>
          <span />
        </div>

        {/* Empty State */}
        {filteredFaqs.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
            No FAQs match your search or filters.
          </div>
        )}

        {/* Table Rows */}
        {filteredFaqs.map((faq, index) => {
          const isExpanded = expandedFaqId === faq.id;
          const editData = editBuffer[faq.id] || faq;
          const isActive = editData.isActive !== false;

          return (
            <div key={faq.id} style={{ borderBottom: index === filteredFaqs.length - 1 ? "none" : "1px solid #f1f5f9" }}>
              {/* Row Summary */}
              <div
                onClick={() => handleStartEdit(faq)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 40px 1fr 140px 100px 110px 30px",
                  padding: "14px 16px",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: isExpanded ? "#fbfbfe" : "#fff",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <div style={{ color: "#cbd5e1" }}>
                  <GripVertical size={16} />
                </div>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "6px",
                  background: "#f1f5f9", color: "#475569",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: "600"
                }}>
                  {index + 1}
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#0f172a", paddingRight: "16px" }}>
                  {faq.question || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Untitled question</span>}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  {faq.category || "General"}
                </div>
                <div>
                  <div
                    onClick={(e) => handleToggleActive(e, faq)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: "32px", height: "18px", borderRadius: "10px",
                      background: faq.isActive !== false ? "#16a34a" : "#cbd5e1",
                      padding: "2px", position: "relative",
                      transition: "background 0.2s ease"
                    }}>
                      <div style={{
                        width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "2px",
                        left: faq.isActive !== false ? "16px" : "2px",
                        transition: "left 0.2s ease"
                      }} />
                    </div>
                    <span style={{ fontSize: "12px", color: faq.isActive !== false ? "#16a34a" : "#94a3b8", fontWeight: "500" }}>
                      {faq.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {formatRelativeTime(faq.updatedAt)}
                </div>
                <div style={{ color: "#94a3b8", display: "flex", justifyContent: "flex-end" }}>
                  {isExpanded ? <ChevronUp size={16} /> : <MoreVertical size={16} />}
                </div>
              </div>

              {/* Expanded Inline Editor */}
              {isExpanded && (
                <div style={{ padding: "16px 20px 20px 60px", background: "#fbfbfe", borderTop: "1px solid #f1f5f9" }}>
                  {/* Question input if creating or editing */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Question</label>
                    <input
                      type="text"
                      value={editData.question}
                      onChange={(e) =>
                        setEditBuffer({
                          ...editBuffer,
                          [faq.id]: { ...editData, question: e.target.value },
                        })
                      }
                      placeholder="e.g. What is your return policy?"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", alignItems: "start" }}>
                    {/* Left: Answer textarea */}
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Answer</label>
                      <div style={{ position: "relative" }}>
                        <textarea
                          rows={4}
                          maxLength={2000}
                          value={editData.answer}
                          onChange={(e) =>
                            setEditBuffer({
                              ...editBuffer,
                              [faq.id]: { ...editData, answer: e.target.value },
                            })
                          }
                          placeholder="Provide the exact answer customers will receive..."
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "13.5px",
                            lineHeight: "1.5",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                            fontFamily: "inherit",
                            background: "#fff"
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(faq.id)}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "500", cursor: "pointer", padding: 0 }}
                          >
                            Delete
                          </button>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {editData.answer.length}/2000
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Category selector + Status toggle */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Category</label>
                        <select
                          value={editData.category || "General"}
                          onChange={(e) =>
                            setEditBuffer({
                              ...editBuffer,
                              [faq.id]: { ...editData, category: e.target.value },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "13px",
                            outline: "none",
                            background: "#fff"
                          }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Status</label>
                        <div
                          onClick={() =>
                            setEditBuffer({
                              ...editBuffer,
                              [faq.id]: { ...editData, isActive: !isActive },
                            })
                          }
                          style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                        >
                          <div style={{
                            width: "36px", height: "20px", borderRadius: "10px",
                            background: isActive ? "#16a34a" : "#cbd5e1",
                            padding: "2px", position: "relative",
                            transition: "background 0.2s ease"
                          }}>
                            <div style={{
                              width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                              position: "absolute", top: "2px",
                              left: isActive ? "18px" : "2px",
                              transition: "left 0.2s ease"
                            }} />
                          </div>
                          <span style={{ fontSize: "13px", color: isActive ? "#16a34a" : "#64748b", fontWeight: "500" }}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                    <button
                      type="button"
                      onClick={() => handleCancelInline(faq.id)}
                      style={{
                        padding: "6px 14px",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                        color: "#374151"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveInline(faq.id)}
                      style={{
                        padding: "6px 16px",
                        background: "#00A460",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#fff"
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}