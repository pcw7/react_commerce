module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest'
    },
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',  // 경로 별칭을 Jest에서 인식하도록 설정
    },
    setupFilesAfterEnv: ['./jest.setup.js'],
};