import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import '../../App.css';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import LogoutButton from './LogoutButton';

function Home() {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const isSeller = useSelector(state => state.auth.isSeller);
    return (
        <div className="w-full h-screen flex flex-col justify-start items-center">
            <Alert>
            <AlertTitle>안녕하세요 수강생 여러분 반갑습니다.</AlertTitle>
            <AlertDescription>
                항해99 취업 리부트 프로그램에 오신걸 환영합니다.
            </AlertDescription>
            </Alert>

            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="mt-5">
                버튼을 눌러주세요.
                </Button>
            </AlertDialogTrigger>

            {isAuthenticated && (
              <div>
                <p>환영합니다! {isSeller ? '판매자' : '구매자'}로 로그인되었습니다.</p>
              </div>
            )}

            {/* <AlertDialogAction asChild>
                <Link to="/signup" className="text-blue-500">회원가입</Link>            
            </AlertDialogAction>
            <AlertDialogAction asChild>            
                <Link to="/login" className="text-blue-500">로그인</Link>
            </AlertDialogAction> */}
            {!isAuthenticated ? (
              <>
                <AlertDialogAction asChild>
                  <Link to="/signup" className="text-blue-500">회원가입</Link>
                </AlertDialogAction>
                <AlertDialogAction asChild>
                  <Link to="/login" className="text-blue-500">로그인</Link>
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogAction asChild>
                  <LogoutButton />
                </AlertDialogAction>
                <AlertDialogAction asChild>
                  <Link to="/mypage" className="text-blue-500">마이페이지</Link>
                </AlertDialogAction>
              </>
            )}
            
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>프로젝트 셋팅을 완료하셨습니다.</AlertDialogTitle>
                <AlertDialogDescription>
                    이제 1주차 기능 구현 과제들을 구현해주세요. 화이팅입니다!
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction>완료</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default Home;