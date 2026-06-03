import Lottie from 'lottie-react';
import animationData from './lottiefile.json';

interface Props {
  isMobile: boolean;
}

export const NotFoundAnimation: React.FC<Props> = ({ isMobile }) => {
  return (
    <div className="mb-0">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{
          width: isMobile ? 250 : 600,
          height: isMobile ? 150 : 350,
        }}
      />
    </div>
  );
};
