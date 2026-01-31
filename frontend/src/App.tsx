import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ChatProvider>
                    <AppRoutes />
                </ChatProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;