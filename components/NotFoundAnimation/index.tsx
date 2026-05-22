import Lottie from 'lottie-react';
import animationData from './lottiefile.json';

interface Props {
  isMobile: boolean;
}

export const NotFoundAnimation: React.FC<Props> = ({ isMobile }) => {
  const width = isMobile ? 250 : 600;
  const height = isMobile ? 150 : 350;

  return (
    <div className="mb-0">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width, height }}
      />
    </div>
  );
};
