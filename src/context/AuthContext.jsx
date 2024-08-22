import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [loading, setLoading] = useState(true);  // 로딩 상태 추가

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'User', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({ ...user, userId: userData.userId }); // Firestore의 userId를 포함시킴
                    setIsSeller(userData.isSeller);
                }
            } else {
                setUser(null);
                setIsSeller(false);
            }
            setLoading(false);  // 로딩 완료
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isSeller, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};