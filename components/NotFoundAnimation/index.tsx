import React from 'react';
import { Box, useBreakpointValue } from 'bumbag';
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

interface Props {
  isMobile: boolean;
}

export const NotFoundAnimation: React.FC<Props> = ({ isMobile }) => {
  const width = isMobile
    ? 250
    : useBreakpointValue({
        default: 600,
        mobile: 250,
      });

  const height = isMobile
    ? 150
    : useBreakpointValue({
        default: 350,
        mobile: 150,
      });

  return (
    <Box marginBottom="major-0">
      <Lottie
        isClickToPauseDisabled
        options={defaultOptions}
        height={height}
        width={width}
      />
    </Box>
  );
};
