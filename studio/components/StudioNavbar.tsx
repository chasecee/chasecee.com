import { Card, Flex, Text } from "@sanity/ui";
import type { NavbarProps } from "sanity";

export function StudioNavbar(props: NavbarProps) {
  return (
    <>
      {props.renderDefault(props)}
      <Card borderTop padding={2}>
        <Flex justify="flex-end">
          <a href="https://chasecee.com" target="_blank" rel="noreferrer">
            <Text size={1}>Open chasecee.com</Text>
          </a>
        </Flex>
      </Card>
    </>
  );
}
