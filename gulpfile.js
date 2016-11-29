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
		exclude: ['.AppleDouble', '.DS_Store'],
	};

	rsyncConf.hostname = 'hallonpaj.local'; // hostname
    rsyncConf.username = 'pi'; // ssh username
    rsyncConf.destination = '/var/www/html'; // path where uploaded files go

    // Use gulp-rsync to sync the files 
  return gulp.src(rsyncPaths).pipe(rsync(rsyncConf));
});
