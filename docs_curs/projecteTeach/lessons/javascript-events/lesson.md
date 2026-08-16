# Esdeveniments en JavaScript

## Level

Beginner

## Estimated Duration

45 minutes

## Learning Outcomes

- Explain what a browser event is.
- Use `addEventListener` to react to a user action.
- Read basic information from an event object.
- Avoid common mistakes when attaching event listeners.

## Prior Knowledge

- Basic HTML elements.
- Basic JavaScript variables and functions.
- Basic DOM selection with `document.querySelector`.

## Key Concepts

- Event: something that happens in the browser, such as a click or key press.
- Event target: the element where the event happened.
- Event listener: a function that runs when an event happens.
- `addEventListener`: method used to attach a listener to an element.
- Event object: data passed to the listener with information about the event.

## Guided Explanation Steps

1. Start with a familiar action: clicking a button on a web page.
2. Explain that the browser creates an event when the action happens.
3. Select a DOM element with `document.querySelector`.
4. Attach a listener with `addEventListener("click", handler)`.
5. Show that the handler function runs only after the click.
6. Introduce the event object as an optional parameter.
7. Use `event.target` to identify the clicked element.
8. Connect the concept to a small interaction, such as changing text after a click.

## Checking Questions

- What is an event in the browser?
- What does `addEventListener` do?
- Why do we pass a function instead of calling the function immediately?
- What information can `event.target` give us?

## Common Mistakes

- Calling the handler immediately: `button.addEventListener("click", handleClick())`.
- Selecting an element before it exists in the DOM.
- Forgetting the event type string, such as `"click"`.
- Trying to use `event` without receiving it as a function parameter.

