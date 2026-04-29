import React from 'react';
import type { ReactNode } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../hooks/use-theme.js';

export interface SelectableMenuItem {
  id: string;
  icon: string;
  label: ReactNode;
}

interface SelectableMenuProps {
  items: SelectableMenuItem[];
  selectedIndex: number;
}

export const SelectableMenu: React.FC<SelectableMenuProps> = ({ items, selectedIndex }) => {
  const { colors } = useTheme();
  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const selected = selectedIndex === index;

        return (
          <Text key={item.id} color={selected ? colors.focus : colors.text} inverse={selected}>
            {selected ? '>' : ' '}[{item.icon}] {item.label}
          </Text>
        );
      })}
    </Box>
  );
};
