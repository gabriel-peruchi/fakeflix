export interface VideoTranscriptAdapter {
  generateTranscript(videoUrl: string): Promise<string | undefined>
}

export const VideoTranscriptAdapter = Symbol('VideoTranscriptAdapter')
