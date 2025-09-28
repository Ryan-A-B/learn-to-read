import { createBrowserRouter } from 'react-router-dom'
import App from './App';
import Home from './routes/Home';
import SandPaperLetters from './SandPaperLetters';
import NotFound from './routes/NotFound';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <Home /> },
            { path: 'sand-paper-letters', element: <SandPaperLetters /> }
        ],
        errorElement: <NotFound />
    }
]);

export default router;