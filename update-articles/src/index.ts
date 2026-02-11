import { app } from '@azure/functions';

// Import functions
// Timer trigger requires AzureWebJobsStorage - temporarily disabled for local testing
// import './functions/update-articles-timer';
import './functions/update-articles-manual';

export default app;