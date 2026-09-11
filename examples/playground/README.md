# Local playground

Build the package, then serve the repository root with any static HTTP server:

```sh
npm run build
python3 -m http.server
```

Open `http://localhost:8000/examples/playground/`. The page imports the local `dist` build and processes a selected file entirely in the browser.
