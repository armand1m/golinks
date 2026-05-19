declare module 'react-lottie' {
  import { Component } from 'react';

  interface LottieOptions {
    loop?: boolean;
    autoplay?: boolean;
    animationData?: unknown;
    rendererSettings?: Record<string, unknown>;
    path?: string;
  }

  interface LottieProps {
    options: LottieOptions;
    height?: number | string;
    width?: number | string;
    isClickToPauseDisabled?: boolean;
    style?: React.CSSProperties;
  }

  class Lottie extends Component<LottieProps> {}
  export default Lottie;
}
