import SitemapGenerator from 'sitemap-generator';

// 생성기 인스턴스 생성
const generator = SitemapGenerator('http://localhost:5173', {
    stripQuerystring: false
});

// 이벤트 리스너 설정
generator.on('done', () => {
    console.log('Sitemap 생성 완료!');
});

// 크롤링 시작 및 파일로 저장
generator.start(() => {
    console.log('크롤링 시작');
});