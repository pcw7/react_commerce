module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest'
    },
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['./jest.setup.js'],
};