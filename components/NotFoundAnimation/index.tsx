import React from 'react';
import { useBreakpointValue } from 'bumbag';
import Lottie from 'react-lottie';
import animationData from './lottiefile.json';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export const NotFoundAnimation: React.FC = () => {
  const width = useBreakpointValue({
    default: 600,
    mobile: 250,
  });

  const height = useBreakpointValue({
    default: 350,
    mobile: 150,
  });

  return (
    <Lottie
      isClickToPauseDisabled
      options={defaultOptions}
      height={height}
      width={width}
    />
  );
};
