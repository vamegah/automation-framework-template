// Load environment variables
import './utils/env';

// Import and register custom skills (commands)
import './skills';
import 'cypress-axe';

// Browser-side support should avoid exporting Node-oriented agent modules.
export * from './pages';
