basePath = '../';

files = [
    JASMINE,
    JASMINE_ADAPTER,
    'src/main/js/**/*.js',
    'src/test/js/**/*.js'
];

autoWatch = true;

browsers = ['PhantomJS'];

junitReporter = {
    outputFile: 'test_out/unit.xml',
    suite: 'unit'
};
