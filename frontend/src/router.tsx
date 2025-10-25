import { createBrowserRouter } from 'react-router-dom';
import NewMeetingPage from './pages/NewMeetingPage';
import JoinPage from './pages/JoinPage';
import ParticipantsPage from './pages/ParticipantsPage';
import MapPage from './pages/MapPage';

export const router = createBrowserRouter([
    { path: '/', element: <NewMeetingPage /> },
    { path: '/new', element: <NewMeetingPage /> },
    { path: '/m/:meetingId', element: <JoinPage /> },
    { path: '/m/:meetingId/participants', element: <ParticipantsPage /> },
    { path: '/m/:meetingId/map', element: <MapPage /> },
]);