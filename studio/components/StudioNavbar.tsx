import { Button, Flex } from "@sanity/ui";
import type { NavbarProps } from "sanity";

const SITE_URL = "https://chasecee.com";

export function StudioNavbar(props: NavbarProps) {
  return (
    <Flex align="center" gap={1}>
      <Button
        as="a"
        href={SITE_URL}
        target="_blank"
        rel="noreferrer"
        text="chasecee.com"
        mode="bleed"
        tone="primary"
        fontSize={1}
        padding={2}
      />
      <Flex flex={1} align="center">
        {props.renderDefault(props)}
      </Flex>
    </Flex>
  );
}
