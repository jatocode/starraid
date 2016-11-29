var gulp = require('gulp');
var rsync  = require('gulp-rsync');

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
