/**
 * drag-and-drop XBlock initializer.
 *
 * This file serves as the entry point. It uses the native browser `import`
 * to load the main module and then executes it.
 */

// Import the Main function directly from its module file.
// The './' makes it a relative path, which is standard practice.
// Note the inclusion of the '.js' extension is required for native browser ES modules.
import Main from './capa/drag_and_drop/main.js';

// Execute the main function to initialize the drag-and-drop interface.
Main();
