"use client"

import * as React from "react"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function InteractionCommand({ triggerContent, onSelect, commands }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {triggerContent}
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search command..." />
                    <CommandEmpty>No command found.</CommandEmpty>
                    <CommandGroup>
                        {commands.map((command) => (
                            <CommandItem
                                key={command.id}
                                onSelect={() => {
                                    onSelect(command.id)
                                    setOpen(false)
                                }}
                            >
                                {command.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
