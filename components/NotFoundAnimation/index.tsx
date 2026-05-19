import React from 'react';
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
  const width = isMobile ? 250 : 600;
  const height = isMobile ? 150 : 350;

  return (
    <div className="mb-0">
      <Lottie
        isClickToPauseDisabled
        options={defaultOptions}
        height={height}
        width={width}
      />
    </div>
  );
};
