// src/MainApp.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionList } from "@/components/SectionList";
import { LessonList } from "@/components/LessonList";
import { LessonView } from "@/components/LessonView";
import { StatsView } from "@/components/StatsView";
// import { sections } from "@/data/lessons";
import { useSections } from "@/hooks/useSections";
import { useProgress } from "@/hooks/useProgress";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { formatDuration } from "@/lib/utils";
import { BarChart3, Flame, GraduationCap, Loader2, Settings } from "lucide-react";
import { AdminView } from "./components/AdminView";

type View =
  | { name: "sections" }
  | { name: "lessons"; sectionId: number }
  | { name: "lesson"; lessonId: number }
  | { name: "stats" }
  | { name: "admin"};

export function MainApp() {
  const [view, setView] = useState<View>({ name: "sections" });
  const { sections, loading, error, refetch } = useSections(); 
  const { getLesson, markSentenceLearned, openLesson } = useProgress();

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setView({ name: "sections" })}
            className="flex items-center gap-2 font-bold"
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Dev English</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-4 text-sm sm:flex">
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" /> {streak}
              </span>
              <span className="text-muted-foreground">
                {formatDuration(todaySeconds)} hôm nay
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ name: "stats" })}
            >
              <BarChart3 className="mr-1 h-4 w-4" /> Thống kê
            </Button>

            <Button variant="outline" size="sm" onClick={() => setView({ name: "admin" })}>
              <Settings className="mr-1 h-4 w-4" /> Quản lý
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Loading / Error state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
            Lỗi tải dữ liệu: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {view.name === "sections" && (
              <>
                <h1 className="mb-6 text-2xl font-bold">
                  Học tiếng Anh cho Developer
                </h1>
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
          </>
        )}
      </main>
    </div>
  );
}