module.exports = function(grunt) {

    grunt.initConfig({
        eslint: {
            all: ['Gruntfile.cjs', 'src/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.registerTask('default', ['eslint']);
};