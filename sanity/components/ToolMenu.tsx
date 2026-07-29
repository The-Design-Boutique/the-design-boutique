'use client'

import { forwardRef, type ReactNode } from 'react'
import { Button, Menu, MenuButton, MenuItem, Flex } from '@sanity/ui'
import { ToolLink, type ToolMenuProps } from 'sanity'

/**
 * The top navigation, grouped rather than laid out flat.
 *
 * Nine tools in a single row is a lot to read, and worse, it gives equal weight
 * to things used constantly and things opened once a month. Two groups make the
 * distinction the eye is already trying to make: the place you write, and the
 * places you find out how it is doing.
 *
 * Anything not named in a group stays a button of its own rather than being
 * hidden. That matters because tool names come partly from Sanity itself and
 * could change in an upgrade: the failure mode is a tool sitting outside a
 * dropdown, not a tool disappearing.
 *
 * In the narrow layout the default list is used instead. A dropdown inside an
 * already-collapsed sidebar is two taps to reach what a list shows outright.
 */

/**
 * ToolLink with optional children.
 *
 * Sanity types children as required, while MenuItem and Button render their own
 * from the text and icon props. Wrapping is honest about that; casting the type
 * away would hide a real mismatch if the component ever changes.
 */
const ToolAnchor = forwardRef<HTMLAnchorElement, { name: string; children?: ReactNode }>(
  function ToolAnchor({ name, children, ...rest }, ref) {
    return (
      <ToolLink ref={ref} name={name} {...rest}>
        {children}
      </ToolLink>
    )
  },
)

const GROUPS: Array<{ label: string; tools: string[] }> = [
  {
    label: 'CMS',
    tools: ['structure', 'preview', 'vision', 'releases'],
  },
  {
    label: 'Data',
    tools: ['core-web-vitals', 'analytics', 'dead-links', 'search-files'],
  },
]

export function ToolMenu(props: ToolMenuProps) {
  const { activeToolName, context, tools, renderDefault } = props

  // The sidebar is the narrow-screen layout. Nesting dropdowns inside it adds a
  // tap to reach everything, so it keeps the plain list. Everything below
  // therefore runs in the topbar only, which is why closing the sidebar is not
  // wired to these links: there is no sidebar open to close.
  if (context === 'sidebar') return renderDefault(props)

  const byName = new Map(tools.map((t) => [t.name, t]))
  const grouped = new Set(GROUPS.flatMap((g) => g.tools))
  const ungrouped = tools.filter((t) => !grouped.has(t.name))

  return (
    <Flex gap={1} align="center">
      {GROUPS.map((group) => {
        const members = group.tools.map((n) => byName.get(n)).filter(Boolean) as typeof tools
        if (!members.length) return null

        // Showing which group you are inside matters more than it looks: without
        // it there is no way to tell where the current screen came from.
        const holdsActive = members.some((t) => t.name === activeToolName)

        return (
          <MenuButton
            key={group.label}
            id={`tool-group-${group.label.toLowerCase()}`}
            button={
              <Button
                text={group.label}
                mode={holdsActive ? 'default' : 'bleed'}
                tone={holdsActive ? 'primary' : 'default'}
                fontSize={1}
                padding={3}
              />
            }
            menu={
              <Menu>
                {members.map((tool) => (
                  <MenuItem
                    key={tool.name}
                    as={ToolAnchor}
                    name={tool.name}
                    text={tool.title || tool.name}
                    icon={tool.icon}
                    selected={tool.name === activeToolName}
                  />
                ))}
              </Menu>
            }
            popover={{ portal: true, placement: 'bottom-start' }}
          />
        )
      })}

      {ungrouped.map((tool) => (
        <Button
          key={tool.name}
          as={ToolAnchor}
          name={tool.name}
          text={tool.title || tool.name}
          icon={tool.icon}
          mode={tool.name === activeToolName ? 'default' : 'bleed'}
          tone={tool.name === activeToolName ? 'primary' : 'default'}
          fontSize={1}
          padding={3}
        />
      ))}
    </Flex>
  )
}
