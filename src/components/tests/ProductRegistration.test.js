import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductRegistration from '../views/ProductRegistration';
import { addDoc, runTransaction } from 'firebase/firestore';
import { uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';

// Firebase 모듈을 모의(Mock)합니다.
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mocked-product-id' })),
    runTransaction: jest.fn((db, transactionFunction) => transactionFunction({
        update: jest.fn(),
        get: jest.fn(() => ({
            exists: () => true, // exists 함수 추가
            data: () => ({ count: 1 })
        }))
    })),
    doc: jest.fn(() => ({ id: 'mocked-doc-id' })),
}));

jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(() => Promise.resolve()),
    getDownloadURL: jest.fn(() => Promise.resolve('https://mocked-url.com/image.jpg')),
}));

jest.mock('../../context/AuthContext', () => ({
    useAuth: jest.fn(() => ({
        user: { userId: 'test-user-id' },
    })),
}));

// firebase.js를 모의(Mock)하여 실제 초기화가 되지 않도록 합니다.
jest.mock('../../firebase', () => ({
    auth: jest.fn(),
    db: jest.fn(),
    storage: jest.fn(),
}));

global.alert = jest.fn();

describe('ProductRegistration', () => {
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
        jest.clearAllMocks();
    });

    test('handles form submission with new product creation', async () => {
        renderWithProviders(<ProductRegistration />);

        // Form 요소에 입력값을 설정합니다.
        fireEvent.change(screen.getByLabelText(/상품 이름/i), { target: { value: 'New Product' } });
        fireEvent.change(screen.getByLabelText(/상품 설명/i), { target: { value: 'This is a new product' } });
        fireEvent.change(screen.getByLabelText(/상품 가격/i), { target: { value: '20000' } });
        fireEvent.change(screen.getByLabelText(/상품 갯수/i), { target: { value: '20' } });
        fireEvent.change(screen.getByLabelText(/상품 카테고리/i), { target: { value: '옷' } });

        // 파일을 업로드하는 이벤트를 모의합니다.
        const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
        const fileInput = screen.getByLabelText(/상품 이미지 첨부/i);
        Object.defineProperty(fileInput, 'files', {
            value: [file],
        });
        fireEvent.change(fileInput);

        // 폼을 제출합니다.
        fireEvent.click(screen.getByRole('button', { name: /상품 등록/i }));

        // Firebase 함수들이 호출되었는지 확인합니다.
        await waitFor(() => {
            expect(runTransaction).toHaveBeenCalledTimes(1);
            expect(addDoc).toHaveBeenCalledTimes(1);
            expect(uploadBytes).toHaveBeenCalledTimes(1);
            expect(getDownloadURL).toHaveBeenCalledTimes(1);
        });

        // alert가 호출되었는지 확인합니다.
        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('상품이 성공적으로 등록되었습니다!');
        }, { timeout: 3000 }); // 3초 동안 기다립니다.
    });
});