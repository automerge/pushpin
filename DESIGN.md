# Pushpin Design Notes

In an attempt to have a strong design culture for a project with diverse contributors, this document tries to collect design decisions & principles for reference. Ideally, a PR that conforms with the principles outlined here will be accepted, and by making these principles explicit we can question and evolve them over time. (This list will always be incomplete, of course, and project maintainers make no guarantee about accepting any particular PR.)

## Design should be consistent

It is important to reuse styles, spacing, font sizes, and other elements as much as practicable.

## Information should be visible when and only when it is important.

If an element is always visible, it should always be important and vice versa.
Ask yourself, what would Tufte say? Can we accomplish the same thing with less “ink”?

## The user is here for their work, not ours.

Don’t clutter the UI.

## Less, but better

In general, unless there's a compelling reason to add a feature, we'll pass on it. This is because every feature competes with every other concept in the application for usage and attention and requires maintenance and support over time.

## Respect the user’s attention and focus.

We avoid pop-ups, badges, and other interruptions.

## User input is sacred

Don’t lose data. Don’t delete user data. Don’t move things where a user didn’t put them.

## Performance matters

If we can’t do it on the next frame, we probably shouldn’t do it at all.

## Focus on efficient interactions.

Support accomplishing the user’s goal in as few keystrokes, clicks, and so on.
No-look interactions can save 200-300ms of human round-trip time.
Keyboard input is (usually) efficient.

## Interactions must be discoverable.

How can a user find out this feature or interaction exists? "It's in the documenetation" is a poor answer.

## Don't depend on the internet

Aggressively download data when you can. Save things locally. Allow progress offline. Avoid, at all times, relying on a lively internet connection.
A user should never realize they don’t have a piece of data they want or need when there’s no internet.
Example: An early version of the URL content did not fetch the HTML until the first time the page was displayed. That violated this principle.

## Don't require users to be online at the same time unless you really have to

In general, support asynchronous collaboration. Don't rely on two users to have PushPin open in front of them simultaneously to perform tasks. Remember that your collaborators maybe anywhere in the world.

## Think about collaboration across a single user's devices

Many of us have more than one computer we work from. How can we support all those devices and ensure they're always up-to-date.

## Plan for extensibility

PushPin aspires to be an "open" application in that we hope some day users will be able to extend it for themselves. Although we aren't working on that right now, we're unlikely to make technical decisions that we feel might move us away from that.

## Minimize eccentricity

Follow precedent for keyboard shortcuts. Use colors in established ways. Take advantage of people’s intuitions. Study how similar interactions work in other applications and interpret the results.

## Embrace collaboration & collaborator presence.

Find ways to make the application feel alive with other users when they’re around.

## Innovate on local-first experiences

We believe this is the definitional piece of “local-first” software. Where we encounter local-first concepts, we expect to have to lead. Be sensitive to places where variable network connectivity, changing collaborators, and desynchronization might affect the experience.

## PushPin is a desktop application

Follow desktop application UX principles. Follow conventions for things like mouse cursors and keyboard shortcuts found on desktop application, not in the web.

## PushPin reflects its users

Our UX is designed to reflect the tone and content you put into it, so the app itself should avoid having a strong personality, much like a great notebook.
