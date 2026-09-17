// src/MainApp.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionList } from "@/components/SectionList";
import { LessonList } from "@/components/LessonList";
import { LessonView } from "@/components/LessonView";
import { StatsView } from "@/components/StatsView";
import { AdminView } from "./components/AdminView";
import { useSections } from "@/hooks/useSections";
import { useProgress } from "@/hooks/useProgress";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  BarChart3, Flame, GraduationCap, Loader2, Settings, Clock, AlertCircle, RefreshCw,
  BookMarked,
} from "lucide-react";
import { useVocab } from "./hooks/useVocab";
import { VocabView } from "./components/VocabView";
import { VocabStudyView } from "./components/VocabStudyView";
import { VocabAdminView } from "./components/VocabAdminView";

type View =
  | { name: "sections" }
  | { name: "vocab" }
  | { name: "vocabStudy"; deckId: number }
  | { name: "lessons"; sectionId: number }
  | { name: "lesson"; lessonId: number }
  | { name: "stats" }
  | { name: "admin" }
  | { name: "vocabAdmin" };

export function MainApp() {
  const [view, setView] = useState<View>({ name: "sections" });
  const { sections, loading, error, refetch } = useSections();
  const { getLesson, markSentenceLearned, openLesson } = useProgress();
  const {
    decks,
    loading: vocabLoading,
    error: vocabError,
    refetch: refetchVocab,
    gradeWord,
    addDeck,
    updateDeck,
    deleteDeck,
    addWord,
    updateWord,
    deleteWord,
    addWordsBulk,
  } = useVocab();

  const inLesson = view.name === "lesson";
  const {
    state: study, todaySeconds, streak, registerActivity, bumpStreak,
  } = useStudyTracker(inLesson);

  useEffect(() => {
    if (inLesson) bumpStreak();
  }, [inLesson, bumpStreak]);

  const currentSection = useMemo(
    () =>
      view.name === "lessons"
        ? sections.find((s) => s.id === view.sectionId)
        : undefined,
    [view, sections]
  );

  const currentLesson = useMemo(
    () =>
      view.name === "lesson"
        ? sections.flatMap((s) => s.lessons).find((l) => l.id === view.lessonId)
        : undefined,
    [view, sections]
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 text-foreground">
      {/* Header — ẩn khi đang học để tập trung */}
      {!inLesson && (
        <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
            <button
              onClick={() => setView({ name: "sections" })}
              className="flex items-center gap-2 font-bold transition-opacity hover:opacity-80"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </span>
              <span className="hidden sm:inline">Dev English</span>
            </button>

            {/* Stats chips — hiện cả trên mobile */}
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-1 py-1 sm:gap-3 sm:px-3">
              <span className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-orange-500">
                <Flame className="h-4 w-4" />
                {streak}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDuration(todaySeconds)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant={view.name === "stats" ? "default" : "ghost"}
                size="icon"
                className="sm:hidden"
                onClick={() => setView({ name: "stats" })}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view.name === "admin" ? "default" : "ghost"}
                size="icon"
                className="sm:hidden"
                onClick={() => setView({ name: "admin" })}
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* Desktop: nút có chữ */}
              <Button
                variant={view.name === "stats" ? "default" : "outline"}
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setView({ name: "stats" })}
              >
                <BarChart3 className="mr-1 h-4 w-4" /> Thống kê
              </Button>
              <Button
                variant={view.name === "admin" ? "default" : "outline"}
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setView({ name: "admin" })}
              >
                <Settings className="mr-1 h-4 w-4" /> Quản lý
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setView({ name: "vocab" })}
              >
                <BookMarked className="h-4 w-4" />
                Từ vựng
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main
        className={cn(
          "mx-auto max-w-5xl px-4 py-6",
          inLesson && "max-w-3xl" // bài học hẹp hơn cho dễ đọc
        )}
      >
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="mb-1 font-semibold text-destructive">Không tải được dữ liệu</p>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-1 h-4 w-4" /> Thử lại
            </Button>
          </div>
        )}

        {/* Views — thêm animation fade-in */}
        {!loading && !error && (
          <div key={view.name} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {view.name === "sections" && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Học tiếng Anh cho Developer
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Luyện nghe & gõ lại câu tiếng Anh thực chiến
                  </p>
                </div>
                <SectionList
                  sections={sections}
                  getLesson={getLesson}
                  onOpenSection={(sectionId) =>
                    setView({ name: "lessons", sectionId })
                  }
                />
              </>
            )}

            {view.name === "lessons" && currentSection && (
              <LessonList
                section={currentSection}
                getLesson={getLesson}
                onBack={() => setView({ name: "sections" })}
                onOpenLesson={(lessonId) => {
                  openLesson(lessonId);
                  setView({ name: "lesson", lessonId });
                }}
              />
            )}

            {view.name === "lesson" && currentLesson && (
              <LessonView
                lesson={currentLesson}
                learnedIds={getLesson(currentLesson.id).learnedSentenceIds}
                onBack={() =>
                  setView({
                    name: "lessons",
                    sectionId: sections.find((s) =>
                      s.lessons.some((l) => l.id === currentLesson.id)
                    )!.id,
                  })
                }
                onCorrect={(sentenceId) =>
                  markSentenceLearned(
                    currentLesson.id,
                    sentenceId,
                    currentLesson.sentences.length
                  )
                }
                onActivity={registerActivity}
              />
            )}

            {view.name === "stats" && (
              <StatsView study={study} onBack={() => setView({ name: "sections" })} />
            )}

            {view.name === "admin" && (
              <AdminView
                sections={sections}
                onBack={() => setView({ name: "sections" })}
                onChanged={refetch}
              />
            )}

            {view.name === "vocab" && (
              <VocabView
                decks={decks}
                loading={vocabLoading}
                error={vocabError}
                onBack={() => setView({ name: "sections" })}
                onRefetch={refetchVocab}
                onStudy={(deckId) => setView({ name: "vocabStudy", deckId })}
                onAdmin={() => setView({ name: "vocabAdmin" })}
              />
            )}

            {view.name === "vocabStudy" && (() => {
              const deck = decks.find((d) => d.id === view.deckId);
              if (!deck) {
                return (
                  <div className="mx-auto max-w-md rounded-xl border p-6 text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Không tìm thấy bộ từ vựng này.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setView({ name: "vocab" })}>
                      Quay lại
                    </Button>
                  </div>
                );
              }
              return (
                <VocabStudyView
                  deck={deck}
                  onGrade={gradeWord}
                  onBack={() => setView({ name: "vocab" })}
                />
              );
            })()}

            {view.name === "vocabAdmin" && (
              <VocabAdminView
                decks={decks}
                onBack={() => setView({ name: "vocab" })}
                addDeck={addDeck}
                updateDeck={updateDeck}
                deleteDeck={deleteDeck}
                addWord={addWord}
                updateWord={updateWord}
                deleteWord={deleteWord}
                addWordsBulk={addWordsBulk}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}