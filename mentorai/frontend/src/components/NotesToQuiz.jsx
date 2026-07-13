import { useEffect, useRef, useState } from "react";
import { notesToQuiz } from "../lib/api.js";
import TiltCard from "./TiltCard.jsx";

const QUESTION_COUNT_OPTIONS = [5, 8, 10, 12];

const PROCESSING_STAGES = [
  "Reading your notes...",
  "Extracting key concepts...",
  "Understanding the material...",
  "Crafting quiz questions...",
  "Almost ready...",
];

export default function NotesToQuiz({ onQuizComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [numQuestions, setNumQuestions] = useState(8);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // Cycle through the processing stage messages while a request is in flight.
  useEffect(() => {
    if (!loading) return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((i) => (i < PROCESSING_STAGES.length - 1 ? i + 1 : i));
    }, 1400);
    return () => clearInterval(interval);
  }, [loading]);

  function handleFileSelect(selected) {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setFileType(selected.type);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setError(null);
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setFileType(null);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setError(null);
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await notesToQuiz(file, numQuestions);
      setQuiz(data.quiz);
    } catch (err) {
      setError(err.message || "Could not process the file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = quiz.questions.filter((q) => answers[q.id] === q.correct_index).length;
    onQuizComplete?.(quiz.questions.length, correct);
  }

  const score = quiz ? quiz.questions.filter((q) => answers[q.id] === q.correct_index).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-glow">notes → quiz</p>
        <h1 className="font-display text-3xl font-semibold text-ink-100">Turn your notes photo into an instant quiz</h1>
      </div>

      {/* Step 1: pick a file */}
      {!quiz && !loading && !file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files?.[0]);
          }}
          className="quiz-dropzone glass flex cursor-pointer flex-col items-center gap-3 rounded-[26px] border border-dashed border-white/15 p-8 text-center transition-colors hover:border-cyan-glow/40 md:p-12"
        >
          <span className="animate-float text-4xl">▣</span>
          <p className="text-ink-100">Upload a photo of your handwritten or printed notes</p>
          <p className="text-xs text-ink-400">JPEG / PNG / WEBP / PDF — click or drag & drop</p>
          <div className="quiz-file-types">
            <span>JPEG</span>
            <span>PNG</span>
            <span>WEBP</span>
            <span>PDF</span>
          </div>
          <span className="upload-cta">
            Choose a file <b>→</b>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Step 2: preview + question-count settings, before generating */}
      {!quiz && !loading && file && (
        <TiltCard glow="violet" maxTilt={3} className="glass-bright rounded-[26px] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex shrink-0 flex-col items-center gap-3">
              {fileType === "application/pdf" ? (
                <div className="pdf-preview flex h-40 w-32 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5">
                  <span className="font-display text-lg font-bold text-cyan-glow">PDF</span>
                  <p className="px-2 text-center text-xs text-ink-400">Notes document ready</p>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="notes preview"
                  className="h-40 w-32 rounded-xl border border-white/10 object-cover shadow-glow-violet"
                />
              )}
              <button
                onClick={handleReset}
                className="font-mono text-xs text-ink-400 underline underline-offset-4 hover:text-cyan-glow"
              >
                choose a different file
              </button>
            </div>

            <div className="flex-1">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-glow">
                how many questions?
              </p>
              <div className="mb-6 flex flex-wrap gap-2">
                {QUESTION_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`rounded-lg border px-4 py-2 font-mono text-sm transition-colors ${
                      numQuestions === n
                        ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow shadow-glow-cyan"
                        : "border-white/10 bg-white/5 text-ink-400 hover:border-cyan-glow/30 hover:text-ink-100"
                    }`}
                  >
                    {n} questions
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                className="shimmer w-full rounded-lg bg-gradient-to-r from-cyan-glow to-violet-glow px-6 py-3 font-display text-sm font-semibold text-void shadow-glow-cyan transition-transform hover:scale-[1.01] md:w-auto"
              >
                Generate Quiz →
              </button>
            </div>
          </div>
        </TiltCard>
      )}

      {/* Processing state */}
      {loading && (
        <TiltCard glow="cyan" maxTilt={2} className="glass-bright flex flex-col items-center gap-5 rounded-[26px] p-10 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute h-16 w-16 animate-ping rounded-full bg-cyan-glow/20" />
            <span className="absolute h-16 w-16 rounded-full border-2 border-cyan-glow/30" />
            <span className="text-3xl">🧠</span>
          </div>
          <p className="font-display text-lg text-ink-100">{PROCESSING_STAGES[stageIndex]}</p>
          <div className="h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-violet-glow transition-all duration-[1400ms] ease-linear"
              style={{ width: `${((stageIndex + 1) / PROCESSING_STAGES.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-ink-400">Generating {numQuestions} questions from your notes</p>
        </TiltCard>
      )}

      {error && (
        <div className="glass rounded-xl border border-magenta-glow/30 p-4 text-sm text-magenta-glow">{error}</div>
      )}

      {/* Quiz */}
      {quiz && (
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-glow">{quiz.extracted_topic}</p>
            <p className="mt-1 text-sm text-ink-400">{quiz.extracted_summary}</p>
            <button
              onClick={handleReset}
              className="mt-3 font-mono text-xs text-ink-400 underline underline-offset-4 hover:text-cyan-glow"
            >
              upload new notes
            </button>
          </div>

          {submitted && (
            <TiltCard glow="cyan" maxTilt={3} className="glass-bright flex items-center justify-between rounded-2xl p-5 shadow-glow-cyan">
              <p className="font-display text-lg text-ink-100">Score</p>
              <p className="font-display text-2xl font-bold text-cyan-glow">
                {score}/{quiz.questions.length}
              </p>
            </TiltCard>
          )}

          {quiz.questions.map((q, qi) => (
            <div key={q.id || qi} className="glass rounded-2xl p-5">
              <p className="mb-3 font-display text-ink-100">
                {qi + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === oi;
                  const isCorrect = q.correct_index === oi;
                  let style = "border-white/10 hover:border-cyan-glow/30";
                  if (submitted) {
                    if (isCorrect) style = "border-cyan-glow/60 bg-cyan-glow/10";
                    else if (isSelected && !isCorrect) style = "border-magenta-glow/60 bg-magenta-glow/10";
                  } else if (isSelected) {
                    style = "border-violet-glow/60 bg-violet-glow/10";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(q.id, oi)}
                      className={`rounded-lg border px-4 py-2.5 text-left text-sm text-ink-100 transition-colors ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-3 text-xs italic text-ink-400">💡 {q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < quiz.questions.length}
              className="self-start rounded-lg bg-gradient-to-r from-cyan-glow to-violet-glow px-6 py-2.5 font-display text-sm font-semibold text-void shadow-glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-40"
            >
              Submit Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}
