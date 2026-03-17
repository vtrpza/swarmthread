import { useState } from "react"
import { useNavigate } from "react-router"
import { useCreateRun } from "../hooks/useCreateRun"
import { AUDIENCE_SEGMENTS, CONTROVERSY_LEVELS, CONTENT_TYPES } from "../types"

const DEFAULT_FORM = {
  title: "",
  brand: "",
  goal: "",
  content_type: "thought_leadership",
  message: "",
  cta: "",
  tone: "",
  audience_segments: [] as string[],
  controversy_level: "low",
  agent_count: 20,
  round_count: 150,
  max_total_cost_usd: 10.0,
}

function HomePage() {
  const navigate = useNavigate()
  const createRun = useCreateRun()
  const [form, setForm] = useState(DEFAULT_FORM)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createRun.mutateAsync(form)
    navigate(`/runs/${result.id}`)
  }

  const handleSegmentToggle = (segment: string) => {
    setForm((prev) => ({
      ...prev,
      audience_segments: prev.audience_segments.includes(segment)
        ? prev.audience_segments.filter((s) => s !== segment)
        : [...prev.audience_segments, segment],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1>Create New Run</h1>
      <p className="text-[var(--text)] mb-8">
        Set up a batch simulation to predict marketing content impact.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
            placeholder="Campaign name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <input
              type="text"
              required
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
              placeholder="Your brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Goal</label>
            <input
              type="text"
              required
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
              placeholder="e.g., Drive signups"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={form.content_type}
            onChange={(e) => setForm({ ...form, content_type: e.target.value })}
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            required
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
            placeholder="The content you want to test"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">CTA</label>
            <input
              type="text"
              required
              value={form.cta}
              onChange={(e) => setForm({ ...form, cta: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
              placeholder="e.g., Sign up now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <input
              type="text"
              required
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
              placeholder="e.g., confident, friendly"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Audience Segments
          </label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_SEGMENTS.map((segment) => (
              <button
                key={segment}
                type="button"
                onClick={() => handleSegmentToggle(segment)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  form.audience_segments.includes(segment)
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-bg)]"
                }`}
              >
                {segment}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Controversy Level
          </label>
          <select
            value={form.controversy_level}
            onChange={(e) =>
              setForm({ ...form, controversy_level: e.target.value })
            }
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
          >
            {CONTROVERSY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Agents</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.agent_count}
              onChange={(e) =>
                setForm({ ...form, agent_count: parseInt(e.target.value) || 20 })
              }
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rounds</label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.round_count}
              onChange={(e) =>
                setForm({ ...form, round_count: parseInt(e.target.value) || 150 })
              }
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Cost ($)</label>
            <input
              type="number"
              min={1}
              step={0.5}
              value={form.max_total_cost_usd}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_total_cost_usd: parseFloat(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createRun.isPending}
          className="w-full py-3 px-4 bg-[var(--accent)] text-white rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createRun.isPending ? "Creating..." : "Create Run"}
        </button>

        {createRun.isError && (
          <div className="p-3 rounded bg-red-100 text-red-700">
            Error: {createRun.error instanceof Error ? createRun.error.message : "Failed to create run"}
          </div>
        )}
      </form>
    </div>
  )
}

export default HomePage
