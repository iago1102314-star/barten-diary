"use client";

import { DiaryGenerationPanel } from "@/components/diary-ai/diary-generation-panel";
import { AudioRecorder } from "@/components/recorder/audio-recorder";
import { TranscriptPanel } from "@/components/recorder/transcript-panel";
import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { useTranscribe } from "@/hooks/use-transcribe";
import { useCallback } from "react";

export function RecordingWorkspace() {
  const recorder = useRecorder();
  const transcription = useTranscribe();
  const diaryGeneration = useGenerateDiary();

  const handleReset = useCallback(() => {
    recorder.reset();
    transcription.reset();
    diaryGeneration.reset();
  }, [recorder, transcription, diaryGeneration]);

  const handleTranscribe = useCallback(() => {
    if (!recorder.blob || !recorder.mimeType) return;
    diaryGeneration.reset();
    void transcription.transcribe(recorder.blob, recorder.mimeType);
  }, [recorder.blob, recorder.mimeType, transcription, diaryGeneration]);

  const handleGenerateDiary = useCallback(() => {
    if (!transcription.transcript) return;
    void diaryGeneration.generate(
      transcription.transcript,
      "master",
      new Date().toISOString(),
    );
  }, [transcription.transcript, diaryGeneration]);

  return (
    <div className="space-y-0">
      <AudioRecorder recorder={recorder} onReset={handleReset} />
      <TranscriptPanel
        blob={recorder.blob}
        mimeType={recorder.mimeType}
        canTranscribe={recorder.status === "stopped"}
        status={transcription.status}
        transcript={transcription.transcript}
        error={transcription.error}
        onTranscribe={handleTranscribe}
      />
      {transcription.status === "success" && transcription.transcript && (
        <DiaryGenerationPanel
          transcript={transcription.transcript}
          status={diaryGeneration.status}
          result={diaryGeneration.result}
          error={diaryGeneration.error}
          onGenerate={handleGenerateDiary}
        />
      )}
    </div>
  );
}
