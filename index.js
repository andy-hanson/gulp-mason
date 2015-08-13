'use strict'

const
	Buffer = require('buffer').Buffer,
	_0 = require('gulp-util'),
	log = _0.log, PluginError = _0.PluginError, replaceExtension = _0.replaceExtension,
	obj = require('through2').obj,
	applySourceMap = require('vinyl-sourcemaps-apply'),
	compile = require('mason-compile/dist/compile').default,
	CompileError = require('mason-compile/dist/CompileError').default,
	manglePath = require('mason-compile/dist/private/manglePath').default,
	_1 = require('mason-node-util/dist/format-compile-error'),
	formatCompileError = _1.default,
	formatWarning = _1.formatWarning

const Name = 'gulp-mason'

module.exports = opts => {
	// TODO:ES6 Optional arguments
	if (opts === undefined) opts = { }

	return obj(function(file, enc, cb) {
		if (file.isNull())
			cb(null, file)
		else if (file.isStream()) {
			this.emit('error', new PluginError(Name, 'Streaming not supported.'))
			cb()
		} else {
			const src = file.contents.toString('utf8')
			const outFile = manglePath(replaceExtension(file.path, '.js'))
			if (Object.prototype.hasOwnProperty.call(opts, 'inFile'))
				throw new Error('inFile set by stream')
			const allOpts = Object.assign({inFile: file.path}, opts)
			// TODO:ES6 { warnings, result } = ...
			const _2 = compile(src, allOpts), warnings = _2.warnings, result = _2.result

			for (const _ of warnings)
				log(formatWarning(_, file.path))

			if (result instanceof CompileError) {
				const message = formatCompileError(result, file.path)
				// Not cb(new PluginError(...)).
				// See https://github.com/gulpjs/gulp/issues/71#issuecomment-53942279
				this.emit('error', new PluginError(Name, message))
				cb()
			} else {
				// TODO:ES6 { code, sourceMap } = ...
				const code = result.code, sourceMap = result.sourceMap
				applySourceMap(file, sourceMap)
				file.contents = new Buffer(code)
				file.path = outFile
				cb(null, file)
			}
		}
	})
}
