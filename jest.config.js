module.exports = {
    preset: 'ts-jest',
    // testEnvironment: 'jsdom', // '@happy-dom/jest-environment'
    runner: 'jest-electron/runner',
    testEnvironment: 'jest-electron/environment',
    // runner: '@jest-runner/electron',
    // testEnvironment: '@jest-runner/electron/environment',
    coverageReporters: ['lcov'],
    coverageDirectory: './coverage',
    roots: ['<rootDir>/src'],
    // reporters: ['jest-silent-reporter'],
    globals: {
        'ts-jest': {
            tsconfig: {
                module: 'system',
            },
        },
    },
};
