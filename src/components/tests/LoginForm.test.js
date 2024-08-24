import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../views/LoginForm';
import { signInWithEmailAndPassword } from "firebase/auth";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

jest.mock('firebase/auth');
jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    doc: jest.fn(),
}));

jest.mock('../../firebase', () => ({
    auth: jest.fn(),
    db: jest.fn(),
}));

describe('LoginForm', () => {
    const queryClient = new QueryClient();

    const renderWithProviders = (ui) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {ui}
                </BrowserRouter>
            </QueryClientProvider>
        );
    };

    beforeEach(() => {
        signInWithEmailAndPassword.mockClear();
        getDoc.mockClear();
        queryClient.clear();
    });

    test('renders login form', () => {
        renderWithProviders(<LoginForm />);

        expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
        expect(screen.getByText(/회원가입/i)).toBeInTheDocument();
    });

    test('handles form submission with valid credentials', async () => {
        // Mock Firebase Auth and Firestore
        signInWithEmailAndPassword.mockResolvedValue({
            user: { uid: 'test-uid' },
        });

        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ userId: 'test-user-id' }),
        });

        const setQueryDataMock = jest.spyOn(queryClient, 'setQueryData');

        renderWithProviders(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'Test@1234' } });

        fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'Test@1234');
        });

        // Add additional wait time if necessary
        await waitFor(() => {
            expect(setQueryDataMock).toHaveBeenCalled();
            expect(setQueryDataMock).toHaveBeenCalledWith('user', expect.any(Object));
            expect(setQueryDataMock).toHaveBeenCalledWith('userData', expect.any(Object));
        }, { timeout: 2000 });
    });

    test('shows error message for invalid credentials', async () => {
        signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid email or password'));

        renderWithProviders(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'invalid@example.com' } });
        fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'wrongpassword' } });

        fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
        });
    });
});