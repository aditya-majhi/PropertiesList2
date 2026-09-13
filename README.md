# Property Listings

## WordPress iframe embed

Embed the deployed app with an iframe and let the app report its content height. This keeps the WordPress page from showing a nested scrollbar.

```html
<iframe
  id="property-listings"
  src="https://your-app-domain.com/property-listings/"
  title="Property listings"
  style="display:block;width:100%;height:1px;border:0;"
></iframe>

<script>
  window.addEventListener("message", function (event) {
    if (event.data?.type !== "property-listings-height") return;

    // Replace this with the exact origin where the React app is deployed.
    if (event.origin !== "https://your-app-domain.com") return;

    const iframe = document.getElementById("property-listings");
    if (iframe && Number.isFinite(event.data.height)) {
      iframe.style.height = `${Math.ceil(event.data.height)}px`;
    }
  });
</script>
```

Replace both placeholder domains with the real deployed app URL. Do not set a fixed iframe height or `overflow:auto`; the iframe should grow to the height reported by the app.

If the nested scrollbar remains, the parent listener is not running or its `event.origin` check does not match the React app's actual origin. The listener must be placed on the WordPress page outside the iframe, and the iframe must use the same `id` shown above.

The script can be added through a WordPress Custom HTML block or the site theme, depending on whether that WordPress installation allows inline scripts.

## Development

The project is built with React, TypeScript, and Vite.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
