export interface AgeRecommendationSchema {
  ageRating: number
  explanation: string
  categories: string[]
}

export interface VideoRecommendationAdapter {
  getAgeRecommendation(
    videoUrl: string,
  ): Promise<AgeRecommendationSchema | undefined>
}

export const VideoRecommendationAdapter = Symbol('VideoRecommendationAdapter')
