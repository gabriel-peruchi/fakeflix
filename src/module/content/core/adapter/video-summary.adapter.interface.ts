export interface VideoSummaryAdapter {
  generateSummary(videoUrl: string): Promise<string | undefined>
}

export const VideoSummaryAdapter = Symbol('VideoSummaryAdapter')
