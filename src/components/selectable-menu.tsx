import React from 'react';
import type { ReactNode } from 'react';
import { Box, Text } from 'ink';

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
  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const selected = selectedIndex === index;

        return (
          <Text key={item.id} color={selected ? 'cyan' : undefined} inverse={selected}>
            {selected ? '>' : ' '}[{item.icon}] {item.label}
          </Text>
        );
      })}
    </Box>
  );
};
