declare module "@vladmandic/human" {
  interface EmotionResult {
    emotion: string;
    score: number;
  }

  interface FaceResult {
    emotion?: EmotionResult[];
    [key: string]: unknown;
  }

  interface DetectResult {
    face?: FaceResult[];
    [key: string]: unknown;
  }

  interface HumanConfig {
    modelBasePath?: string;
    face?: {
      enabled?: boolean;
      emotion?: { enabled?: boolean };
      [key: string]: unknown;
    };
    body?: { enabled?: boolean };
    hand?: { enabled?: boolean };
    gesture?: { enabled?: boolean };
    object?: { enabled?: boolean };
    [key: string]: unknown;
  }

  class Human {
    constructor(config?: HumanConfig);
    load(): Promise<void>;
    warmup(): Promise<void>;
    detect(
      input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    ): Promise<DetectResult>;
  }

  export default Human;
}
