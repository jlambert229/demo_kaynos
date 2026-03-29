import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "./Toast";
import VideoUpload from "./VideoUpload";
import AppIcon from "./AppIcon";
import { extractVimeoId } from "../utils/vimeo";
import { useBeforeUnloadDirty } from "../hooks/useBeforeUnloadDirty";
import TagInput from "./TagInput";

const DESCRIPTION_MAX = 4000;

export default function NewClass() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    vimeoLink: "",
    tags: [],
  });
  const [videoSource, setVideoSource] = useState("upload");
  const [uploadData, setUploadData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);

  useEffect(() => {
    api.school.tags().then((d) => setTagSuggestions(d.tags || [])).catch(() => {});
  }, []);

  const vimeoId = extractVimeoId(form.vimeoLink);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: form.title,
        date: form.date,
        description: form.description,
        vimeoLink: form.vimeoLink,
        tags: form.tags,
        videoSource,
        uploadKey: uploadData?.videoKey ?? null,
      }),
    [form.title, form.date, form.description, form.vimeoLink, form.tags, videoSource, uploadData]
  );

  const [dirtyBaseline, setDirtyBaseline] = useState(null);
  useEffect(() => {
    setDirtyBaseline((prev) => (prev === null ? formSnapshot : prev));
  }, [formSnapshot]);

  const isDirty = dirtyBaseline !== null && formSnapshot !== dirtyBaseline;
  useBeforeUnloadDirty(isDirty && !saving);

  const handlePublish = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        date: form.date,
        description: form.description || null,
        tags: form.tags,
      };

      if (videoSource === "vimeo" && vimeoId) {
        payload.vimeoId = vimeoId;
      } else if (videoSource === "upload" && uploadData) {
        payload.videoKey = uploadData.videoKey;
        payload.videoSize = uploadData.videoSize;
        payload.videoContentType = uploadData.videoContentType;
      }

      const result = await api.classes.create(payload);

      if (videoSource === "upload" && uploadData) {
        await api.video.confirmUpload({
          targetType: "class",
          targetId: result.class.id,
          videoKey: uploadData.videoKey,
          videoSize: uploadData.videoSize,
          videoContentType: uploadData.videoContentType,
        });
      }

      toast.success("Class published");
      navigate(`/classes/${result.class.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to publish class");
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <Link to="/classes" className="detail-back" style={{ marginBottom: 8 }}>← Classes</Link>
        <div className="page-title">New class recording</div>
        <div className="page-subtitle">Visible to every student in your school.</div>
      </div>
      <div className="page-body page-body-narrow">
        <div className="form-composer">
          <span className="form-section-label">Video source</span>
          <div className="form-panel">
            <div className="source-toggle" role="group" aria-label="How to attach video">
              <button
                type="button"
                className={`source-toggle-btn ${videoSource === "upload" ? "active" : ""}`}
                onClick={() => setVideoSource("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                className={`source-toggle-btn ${videoSource === "vimeo" ? "active" : ""}`}
                onClick={() => setVideoSource("vimeo")}
              >
                Vimeo
              </button>
              <button
                type="button"
                className={`source-toggle-btn ${videoSource === "none" ? "active" : ""}`}
                onClick={() => setVideoSource("none")}
              >
                Notes only
              </button>
            </div>

            {videoSource === "upload" && (
              <div style={{ marginTop: 20 }}>
                <VideoUpload
                  targetType="class"
                  onUploadComplete={setUploadData}
                  onRemove={() => setUploadData(null)}
                />
              </div>
            )}

            {videoSource === "vimeo" && (
              <div className="link-input-wrap" style={{ marginTop: 20, marginBottom: 0 }}>
                <span className="link-label">Vimeo URL or video ID</span>
                <div className="link-input-row">
                  <input
                    placeholder="https://vimeo.com/…"
                    value={form.vimeoLink}
                    onChange={(e) => setForm((f) => ({ ...f, vimeoLink: e.target.value }))}
                  />
                </div>
                {form.vimeoLink && (
                  <div className={`link-valid ${vimeoId ? "valid" : "invalid"}`}>
                    <span>{vimeoId ? <AppIcon name="check-mark" size={18} /> : <AppIcon name="cross-mark" size={18} />}</span>
                    {vimeoId ? `Video ID: ${vimeoId}` : "Enter a valid Vimeo URL or ID"}
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="form-section-label">Class details</span>
          <div className="form-panel">
            <div className="modal-field">
              <label className="login-label">Title</label>
              <input className="login-input" placeholder="e.g. Fundamentals — guard passing" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="login-label">Date</label>
              <input className="login-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="login-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="What did you cover? Students see this under the video."
                value={form.description}
                maxLength={DESCRIPTION_MAX}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                aria-describedby="class-desc-count"
              />
              <div id="class-desc-count" className="form-char-count">
                {form.description.length} / {DESCRIPTION_MAX}
              </div>
            </div>
            <div className="modal-field" style={{ marginBottom: 0 }}>
              <label className="login-label">Tags</label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                placeholder="e.g. fundamentals, guard passing, competition prep"
                suggestions={tagSuggestions}
              />
            </div>
          </div>

          <button
            type="button"
            className="login-btn btn-submit-wide"
            onClick={handlePublish}
            disabled={saving || !form.title || !form.date}
          >
            {saving ? "Publishing…" : "Publish class"}
          </button>
        </div>
      </div>
    </>
  );
}
