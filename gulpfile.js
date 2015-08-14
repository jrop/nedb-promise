var gulp = require('gulp')

var babel = require('gulp-babel')
var rimraf = require('rimraf')

function e(err) {
	console.error(err.stack)
	this.emit('end')
}

gulp.task('default', [ 'js' ])

gulp.task('js', function() {
	return gulp.src('src/**/*.js')
		.pipe(babel({
			stage: 1,
			optional: [ 'runtime' ]
		})).on('error', e)
		.pipe(gulp.dest('build'))
})

gulp.task('watch', [ 'default' ], function() {
	gulp.watch('src/**/*.js', [ 'js' ])
})

gulp.task('clean', function(cb) {
	rimraf.sync('build/')
	cb()
})
