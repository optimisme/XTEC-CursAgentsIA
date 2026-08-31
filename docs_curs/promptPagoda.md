Create a new WebGL website inside the `./webs` folder.

Create exactly these five files:

- `./webs/pagoda.html`
- `./webs/pagoda.css`
- `./webs/pagoda.js`
- `./webs/pagoda.vert`
- `./webs/pagoda.frag`

Build an interactive 3D Japanese pagoda using WebGL.

Requirements:

- The pagoda must be built mainly from cubes and rectangular blocks.
- Use a voxel / Minecraft-like visual style.
- The pagoda should have 5 clearly visible floors.
- Each upper floor should be slightly smaller than the floor below it.
- Give every floor a wide overhanging roof with raised corners.
- Use dark wood for the structure, red accents for columns and walls, and dark gray roof tiles.
- Add a central entrance and simple windows or openings.
- Place the pagoda on a stone base.
- Add a simple ground area around it, such as grass, stone paths, or a small courtyard.
- Use lighting and shadows so the shape of the pagoda is easy to understand.
- Use a sky or neutral background that provides good contrast.

Interaction:

- The user must be able to rotate the camera around the pagoda by dragging with the mouse.
- The mouse wheel must zoom in and out.
- The camera should initially show the complete pagoda from a slightly elevated three-quarter view.
- Prevent the camera from zooming too close or too far away.

Implementation constraints:

- Before implementing, read current WebGL documentation from the web, including how to implement shadow mapping.
- Do not use external 3D models.
- Do not use external JavaScript libraries or frameworks.
- Generate the pagoda procedurally in `pagoda.js` using custom WebGL cube and box geometry primitives.
- Keep vertex shader code only in `pagoda.vert`.
- Keep fragment shader code only in `pagoda.frag`.
- Do not embed GLSL shader source inside `pagoda.js`.
- Keep the shaders small and simple.
- Use at most 8 low-resolution 16x16 dynamically generated textures.
- Avoid textures when simple material colors are sufficient.
- Keep the JavaScript simple, modular, and readable.
- Prefer small focused functions over large functions.
- Split responsibilities correctly between HTML, CSS, JavaScript, vertex shader, and fragment shader files.
- Do not create any files other than the five requested files.
- The page may be served through a simple local HTTP server; do not rely on `file://` compatibility.

Suggested responsibility split:

- `pagoda.html`: canvas and page structure only.
- `pagoda.css`: page layout and canvas styling only.
- `pagoda.js`: WebGL setup, geometry generation, camera controls, materials, lighting, shadow framebuffer setup, scene generation, resize handling, and render loop.
- `pagoda.vert`: vertex transformations, normals, and shadow-map coordinates.
- `pagoda.frag`: lighting, material colors, and shadow-map sampling.

Keep context usage low:

- Do not duplicate shader code or geometry data across files.
- Do not generate large hard-coded vertex arrays.
- Reuse one cube/box mesh and transform it to build the scene.
- Use procedural loops for repeated pagoda floors, columns, roof blocks, paths, and other repeated structures.
- Avoid unnecessary abstractions or helper classes.
- Avoid unrelated features or visual effects.

Before finishing, perform a static consistency check:

1. Ensure the HTML references the CSS and JavaScript files correctly.
2. Ensure `pagoda.js` loads `pagoda.vert` and `pagoda.frag` correctly.
3. Check the JavaScript for obvious syntax errors and undefined variables.
4. Ensure shader attribute, uniform, and varying names match between JavaScript and GLSL.
5. Ensure the render loop and window resize handler are present.
6. Ensure the camera controls are attached to the canvas.
7. Ensure mouse wheel zoom limits are configured.
8. Ensure the shadow framebuffer and shadow-map pass are configured.
9. Ensure no files other than the five requested files were created.