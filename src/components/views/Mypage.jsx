import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function Mypage() {
    const isSeller = useSelector(state => state.auth.isSeller);

    return (
        <div>
            <h1>마이페이지</h1>
            <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>

            {isSeller && (
                <Link to="/product-registration">
                    <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
                        판매등록
                    </button>
                </Link>
            )}
        </div>
    );
}

export default Mypage;