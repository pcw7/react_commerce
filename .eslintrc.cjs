module.exports = {
  root: true, // 프로젝트의 최상위 디렉토리에서 ESLint 설정 파일임을 지정
  env: { browser: true, es2020: true }, // 코드가 실행될 환경(browser: true: 브라우저 환경을 대상으로 함, es2020: true: ECMAScript 2020 기능들을 사용할 수 있음)
  extends: [
    'eslint:recommended', // ESLint에서 권장하는 기본 규칙들을 적용
    'plugin:react/recommended', // React 관련 규칙들이 포함된 추천 설정
    'plugin:react/jsx-runtime', // React 17 이상의 JSX 변환 설정을 위한 규칙
    'plugin:react-hooks/recommended', // React hooks 사용 시 권장되는 규칙들이 적용
    'prettier', //  Prettier와 충돌할 수 있는 ESLint 규칙들을 비활성화
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'], // 검사에서 제외(빌드 결과물이 생성되는 dist 디렉토리, ESLint 설정 파일)
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }, // ecmaVersion: 'latest': 최신 ECMAScript 버전을 사용, sourceType: 'module': 모듈 시스템을 사용함
  settings: { react: { version: '18.2' } }, // ESLint가 React의 버전을 자동으로 인식하지 못하는 경우, 명시적으로 버전을 설정
  plugins: ['react-refresh', 'prettier'], // react-refresh: React 컴포넌트의 핫 리로드(HMR) 시 사용하는 플러그인, prettier: Prettier 플러그인을 사용하여 코드 스타일 규칙을 적용
  rules: {
    'prettier/prettier': 'error', // Prettier가 감지한 스타일 오류를 ESLint 오류로 표시
    'react/react-in-jsx-scope': 'off', // React 17 이상에서는 JSX를 사용하기 위해 React를 import할 필요가 없으므로 이 규칙을 비활성화
    'react/prop-types': 'off', // PropTypes를 사용하는 대신 TypeScript를 사용하거나, PropTypes를 사용하지 않는 경우 이 규칙을 비활성화
    'react/jsx-no-target-blank': 'off', // react/jsx-no-target-blank': 'off': target="_blank" 속성을 사용하는 경우에 대해 경고하지 않도록 설정
    'react-refresh/only-export-components': [ // React 컴포넌트만 export하도록 권장하며, 상수를 export하는 것은 허용
      'warn',
      { allowConstantExport: true },
    ],
  },
}
