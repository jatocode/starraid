var gulp = require('gulp');
var rsync  = require('gulp-rsync');
var minify = require('gulp-minify');

gulp.task('default', function() {
    console.log('Gulpigulp');
});

gulp.task('deploy', function() {
	rsyncPaths = ['index.html', 'js', 'img' ];

	// Default options for rsync
	rsyncConf = {
		progress: false,
		incremental: true,
		relative: true,
		emptyDirectories: true,
		recursive: true,
		clean: true,
		silent: true,
		exclude: ['.AppleDouble', '.DS_Store'],
		hostname: 'hallonpaj.local',
    	username : 'pi',
    	destination: '/var/www/html',
	};

	return gulp.src(rsyncPaths).pipe(rsync(rsyncConf));
});
 
gulp.task('compress', function() {
  gulp.src('js/*.js')
    .pipe(minify({
        ext:{
            src:'.js',
            min:'-min.js'
        },
        ignoreFiles: ['-min.js']
    }))
    .pipe(gulp.dest('dist'))
});
