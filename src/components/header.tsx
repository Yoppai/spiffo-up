import React from 'react';
import { Box } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';

interface TuiHeaderProps {
  title?: string;
}

export const TuiHeader: React.FC<TuiHeaderProps> = ({ title = 'SPIFFO-UP' }) => {
  return (
    <Box justifyContent="center" flexShrink={0}>
      <Box flexDirection="column" alignItems="center">
        <Gradient name="rainbow">
          <BigText text={title} font="tiny" />
        </Gradient>
      </Box>
    </Box>
  );
};
