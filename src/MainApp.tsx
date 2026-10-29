import { useCallback, useMemo } from "react";
import { SectionList } from "@/components/SectionList";
import { LessonList } from "@/components/lesson-list";
import { LessonView } from "@/components/lesson-view";
import { AdminView } from "@/components/AdminView";
import { VocabView } from "@/components/vocab/VocabView";
import { VocabStudyView } from "@/components/vocab/VocabStudyView";
import { VocabAdminView } from "@/components/vocab-admin/VocabAdminView";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { HomeHero } from "@/components/home/HomeHero";
import { DataGate, NotFoundState } from "@/components/feedback/States";
import { useSections } from "@/hooks/useSections";
import { useProgress } from "@/hooks/useProgress";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { useVocab } from "@/hooks/useVocab";
import { useViewNavigation } from "@/hooks/useViewNavigation";
import {
  FOCUS_VIEWS, HOME_VIEW, buildLessonSectionMap, getParentView, viewKey,
} from "@/app/routes";
import { cn } from "@/lib/utils";
import { StatsView } from "./features/stats";

export function MainApp() {
  const { view, navigate } = useViewNavigation(HOME_VIEW);

  const { sections, loading, error, refetch } = useSections();
  const { getLesson, markSentenceLearned, openLesson, resetLesson } = useProgress();
  const vocab = useVocab();

  const isLesson = view.name === "lesson" || view.name === "vocabStudy";
  const isFocus = FOCUS_VIEWS.has(view.name);

  // Chỉ tính thời gian học khi đang ở bài học (giữ nguyên hành vi cũ)
  const { 
    state: study, ready: studyReady, loadError: studyError, today,
    todaySeconds, streak, streakDoneToday, counting, registerActivity 
  } = useStudyTracker(isLesson);
console.log( today)
  // ---- Lookup O(1) ----
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const lessonById = useMemo(
    () => new Map(sections.flatMap((s) => s.lessons).map((l) => [l.id, l])),
    [sections]
  );
  const lessonSectionMap = useMemo(() => buildLessonSectionMap(sections), [sections]);
  const lessonCount = lessonById.size;

  const goBack = useCallback(
    () => navigate(getParentView(view, lessonSectionMap)),
    [navigate, view, lessonSectionMap]
  );
  const goHome = useCallback(() => navigate(HOME_VIEW), [navigate]);

  const sectionsGate = (children: React.ReactNode) => (
    <DataGate loading={loading} error={error} onRetry={refetch}>
      {children}
    </DataGate>
  );

  function renderView() {
    switch (view.name) {
      case "sections":
        return sectionsGate(
          <>
            <HomeHero
              streak={streak}
              sectionCount={sections.length}
              lessonCount={lessonCount}
              onOpenVocab={() => navigate({ name: "vocab" })}
            />
            <SectionList
              sections={sections}
              getLesson={getLesson}
              onOpenSection={(sectionId) => navigate({ name: "lessons", sectionId })}
            />
          </>
        );

      case "lessons": {
        const section = sectionById.get(view.sectionId);
        return sectionsGate(
          section ? (
            <LessonList
              section={section}
              getLesson={getLesson}
              onBack={goBack}
              onOpenLesson={(lessonId) => {
                openLesson(lessonId);
                navigate({ name: "lesson", lessonId });
              }}
            />
          ) : (
            <NotFoundState message="Không tìm thấy chủ đề này." onBack={goHome} />
          )
        );
      }

      case "lesson": {
        const lesson = lessonById.get(view.lessonId);
        return sectionsGate(
          lesson ? (
            <LessonView
              lesson={lesson}
              progress={getLesson(lesson.id)}
              onBack={goBack}
              onCorrect={(sentenceId) =>
                markSentenceLearned(lesson.id, sentenceId, lesson.sentences.length)
              }
              onActivity={registerActivity}
              onReset={() => resetLesson(lesson.id)}
            />
          ) : (
            <NotFoundState message="Không tìm thấy bài học này." onBack={goHome} />
          )
        );
      }

      case "stats":
        return <StatsView
          study={study} 
          todayKey={today}
          streakDoneToday={streakDoneToday}
          ready={studyReady}
          loadError={studyError}
          decks={vocab.decks} 
          onBack={goBack} 
        />

      case "admin":
        return sectionsGate(
          <AdminView sections={sections} onBack={goBack} onChanged={refetch} />
        );

      case "vocab":
        // VocabView tự xử lý loading/error
        return (
          <VocabView
            decks={vocab.decks}
            loading={vocab.loading}
            error={vocab.error}
            onBack={goBack}
            onRefetch={vocab.refetch}
            onStudy={(deckId) => navigate({ name: "vocabStudy", deckId })}
            onAdmin={() => navigate({ name: "vocabAdmin" })}
          />
        );

      case "vocabStudy": {
        const deck = vocab.decks.find((d) => d.id === view.deckId);
        return (
          <DataGate loading={vocab.loading} error={vocab.error} onRetry={vocab.refetch}>
            {deck ? (
              <VocabStudyView deck={deck} onGrade={vocab.gradeWord} onBack={goBack} />
            ) : (
              <NotFoundState message="Không tìm thấy bộ từ vựng này." onBack={goBack} />
            )}
          </DataGate>
        );
      }

      case "vocabAdmin":
        return (
          <DataGate loading={vocab.loading} error={vocab.error} onRetry={vocab.refetch}>
            <VocabAdminView
              decks={vocab.decks}
              onBack={goBack}
              addDeck={vocab.addDeck}
              updateDeck={vocab.updateDeck}
              deleteDeck={vocab.deleteDeck}
              addWord={vocab.addWord}
              updateWord={vocab.updateWord}
              deleteWord={vocab.deleteWord}
              addWordsBulk={vocab.addWordsBulk}
            />
          </DataGate>
        );

      default: {
        // Thêm view mới mà quên xử lý thì TypeScript báo lỗi ngay tại đây
        const _exhaustive: never = view;
        return _exhaustive;
      }
    }
  }

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Nền trang trí */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-background via-background to-muted/30" />
        <div className="absolute -top-40 left-1/2 h-96 w-240 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-size-[24px_24px] opacity-40 mask-[linear-gradient(to_bottom,black,transparent_60%)]" />
      </div>

        <AppHeader
          view={view}
          streak={streak}
          streakDoneToday={streakDoneToday}
          todaySeconds={todaySeconds}
          counting={counting}
          onNavigate={navigate}
        />

      <main
        className={cn(
          "mx-auto w-full px-4 py-6 sm:py-8",
          isFocus ? "max-w-3xl" : "max-w-5xl pb-28 md:pb-10"
        )}
      >
        <div
          key={viewKey(view)}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
        >
          {renderView()}
        </div>
      </main>

      {!isFocus && <MobileNav view={view} onNavigate={navigate} />}
    </div>
  );
}