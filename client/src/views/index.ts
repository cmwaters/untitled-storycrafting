import { StartView, CreateFirstStoryView } from "./setup"
import { StoryView } from "./story"
import { StartWritingButton } from "../components/buttons"
import { Component } from "../components"
import { Story, StoryEvents } from "../model"
import { mount, unmount, el } from "redom"
import { notifier } from "./notifier"
import { IconButton } from "../components/buttons"
import { PersonFillIcon } from "../components/icons"
import { StoryTitle } from "../components/inputs"
import "./view.css"
import { Events } from "fabletree"

export { notifier }

export const view = {

    current: null as Component | null,

    init: () => {
        // set up key event listeners
        document.onkeydown = (e: KeyboardEvent) => {
            if (view.current && view.current.onkeydown) {
                view.current.onkeydown(e.key)
            }
        }

        document.onkeyup = (e: KeyboardEvent) => {
            if (view.current && view.current.onkeyup) {
                view.current.onkeyup(e.key)
            }
        }

        view.enableNotifications()
    },

    startPage: (callback: (title: string, description: string) => void) => {
        view.change(StartView({
            startButton: StartWritingButton({
                execute: () => view.change(CreateFirstStoryView({
                    callback: callback,
                }))
            })
        }))
    },

    userPage: (props: {
        story: Story,
        events: Events,
    }) => {
        view.change(new StoryView({
            story: props.story,
            events: props.events
        }))
        mount(view.current!, el("div"))
    },

    storyPage: (props: {
        story: Story
        events: StoryEvents
        home: () => void
    }) => {
        view.change(new StoryView({
            story: props.story,
            events: props.events.nodes!
        }))
        mount(view.current!, new StoryTitle({
            title: props.story.header.title,
            onTitleChange: props.events.onTitleChange
        }))
        mount(view.current!, el("div", new IconButton({
            execute: props.home,
            icon: PersonFillIcon({
                style: {
                    fill: "#7c848c"
                }
            }),
            width: 30
        }), {
            style: {
                position: "absolute",
                right: 10,
                top: 10,
            }
        }))
    },

    change: (page: Component) => {
        if (view.current) {
            unmount(document.body, view.current)
        }
        mount(document.body, page)
        view.current = page
    },

    enableNotifications: () => {
        mount(document.body, notifier.el)
    },

    disableNotifications: () => {
        unmount(document.body, notifier.el)
    }

}