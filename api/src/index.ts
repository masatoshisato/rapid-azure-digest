import { app } from '@azure/functions';
import './functions/articles';

app.setup({
    enableHttpStream: true,
});
