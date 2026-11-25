# CSS Flexbox

## Level

Beginner

## Estimated Duration

50 minutes

## Learning Outcomes

- Explain the role of a flex container and flex items.
- Use `display: flex` to create a one-dimensional layout.
- Control horizontal and vertical alignment with Flexbox.
- Build a simple responsive row or column layout.

## Prior Knowledge

- Basic HTML structure.
- Basic CSS selectors and properties.
- Understanding of block elements.

## Key Concepts

- Flex container: the parent element with `display: flex`.
- Flex items: the direct children of the flex container.
- Main axis: the primary direction of the layout.
- Cross axis: the axis perpendicular to the main axis.
- `justify-content`: alignment along the main axis.
- `align-items`: alignment along the cross axis.
- `flex-direction`: controls row or column direction.

## Guided Explanation Steps

1. Start with three boxes stacked normally in HTML.
2. Add `display: flex` to the parent and observe the layout change.
3. Identify the parent as the flex container and the children as flex items.
4. Use `flex-direction` to compare row and column layouts.
5. Use `justify-content` to move items along the main axis.
6. Use `align-items` to align items on the cross axis.
7. Combine the properties to create a simple navigation bar or card row.
8. Discuss how wrapping or column direction can help on small screens.

## Checking Questions

- Which element receives `display: flex`?
- What is the difference between the container and the items?
- What does `justify-content` control?
- What changes when `flex-direction` becomes `column`?

## Common Mistakes

- Applying `display: flex` to the wrong element.
- Confusing the main axis and cross axis.
- Expecting `justify-content` to always mean horizontal alignment.
- Forgetting that only direct children become flex items.

