import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "./Toast";
import VideoUpload from "./VideoUpload";
import AppIcon from "./AppIcon";
import { extractVimeoId } from "../utils/vimeo";
import { useBeforeUnloadDirty } from "../hooks/useBeforeUnloadDirty";
import TagInput from "./TagInput";
import { useMembersList, useSchoolTags } from "../hooks/useApiQuery";

export default function NewSession() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    studentId: studentId || "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    vimeoLink: "",
    tags: [],
  });
  const [videoSource, setVideoSource] = useState("upload");
  const [uploadData, setUploadData] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: tagsResult } = useSchoolTags();
  const tagSuggestions = tagsResult?.tags ?? [];

  const { data: membersResult } = useMembersList();
  const members = useMemo(
    () => membersResult?.members?.filter((m) => m.role === "student") ?? [],
    [membersResult],
  );
  const studentName = useMemo(() => {
    if (!studentId) return "";
    const s = membersResult?.members?.find((m) => m.id === studentId);
    return s?.name ?? "";
  }, [studentId, membersResult]);

  const vimeoId = extractVimeoId(form.vimeoLink);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        studentId: form.studentId,
        title: form.title,
        date: form.date,
        vimeoLink: form.vimeoLink,
        tags: form.tags,
        videoSource,
        uploadKey: uploadData?.videoKey ?? null,
      }),
    [form.studentId, form.title, form.date, form.vimeoLink, form.tags, videoSource, uploadData]
  );

  const [dirtyBaseline, setDirtyBaseline] = useState(null);
  useEffect(() => {
    setDirtyBaseline((prev) => (prev === null ? formSnapshot : prev));
  }, [formSnapshot]);

  const isDirty = dirtyBaseline !== null && formSnapshot !== dirtyBaseline;
  useBeforeUnloadDirty(isDirty && !saving);

  const handlePublish = async () => {
    if (!form.studentId || !form.title || !form.date) return;
    setSaving(true);
    try {
      const payload = {
        studentId: form.studentId,
        title: form.title,
        date: form.date,
        tags: form.tags,
      };

      if (videoSource === "vimeo" && vimeoId) {
        payload.vimeoId = vimeoId;
      } else if (videoSource === "upload" && uploadData) {
        payload.videoKey = uploadData.videoKey;
        payload.videoSize = uploadData.videoSize;
        payload.videoContentType = uploadData.videoContentType;
      }

      const result = await api.sessions.create(payload);

      if (videoSource === "upload" && uploadData) {
        await api.video.confirmUpload({
          targetType: "session",
          targetId: result.session.id,
          videoKey: uploadData.videoKey,
          videoSize: uploadData.videoSize,
          videoContentType: uploadData.videoContentType,
        });
      }

      toast.success("Session published");
      navigate(studentId ? `/students/${studentId}/sessions` : `/sessions/${result.session.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to publish session");
      setSaving(false);
    }
  };

  const canPublish = form.studentId && form.title && form.date;

  return (
    <>
      <div className="page-header">
        {studentId && (
          <Link to={`/students/${studentId}/sessions`} className="detail-back" style={{ marginBottom: 8 }}>
            ← {studentName || "Back"}
          </Link>
        )}
        <div className="page-title">New Session{studentName ? ` for ${studentName}` : ""}</div>
        <div className="page-subtitle">Add a recording, link Vimeo, or start with notes only.</div>
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
                  targetType="session"
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

          <span className="form-section-label">Session details</span>
          <div className="form-panel">
            {!studentId && (
              <div className="modal-field">
                <label className="login-label">Student</label>
                <select
                  className="form-select"
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                >
                  <option value="">Select student…</option>
                  {members.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-field">
              <label className="login-label">Title</label>
              <input className="login-input" placeholder="e.g. Half guard — sweeps & entries" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="login-label">Date</label>
              <input className="login-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="login-label">Tags</label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                placeholder="e.g. half guard, sweeps, competition"
                suggestions={tagSuggestions}
              />
            </div>
          </div>

          <button
            type="button"
            className="login-btn btn-submit-wide"
            onClick={handlePublish}
            disabled={saving || !canPublish}
          >
            {saving ? "Publishing…" : "Publish session"}
          </button>
        </div>
      </div>
    </>
  );
}
