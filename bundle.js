const esbuild = require(`esbuild`)
const yargs = require(`yargs`)
const fs = require('fs')
const stylePlugin = require('esbuild-style-plugin')
const autoprefixer = require('autoprefixer')
const path = require('path')
const { copy } = require('esbuild-plugin-copy')

const argv = yargs(process.argv)
  .option(`build`, {
    alias: `b`,
    type: `string`,
    default: `index`
  })
  .option(`watch`, {
    alias: `a`,
    type: `boolean`,
    default: false
  })
  .option(`sourcemap`, {
    alias: `sm`,
    type: `boolean`,
    default: false
  })
  .option(`minify`, {
    alias: `m`,
    type: `boolean`,
    default: false
  })
  .option(`env`, {
    alias: `e`,
    type: `string`,
    default: `./env.json`
  }).parse()

const sourcemap = argv.sourcemap ? `inline` : false

const loader = {
  '.js': `jsx`,
  '.woff': 'file',
  '.woff2': 'file',
  '.svg': 'file',
  '.ttf': 'file',
  '.eot': 'file'
}

const external = [`*.svg`]

const logRebuild = (name) => {
  return {
    name: 'log-rebuild',
    setup(build) {
      build.onEnd(() => {
        console.log(`Rebuild ${name} - ${new Date().toLocaleString()}`)
      })
    }
  }
}

const copyPublic = (to) => {
  return copy({
    resolveFrom: 'cwd',
    assets: {
      from: ['./public/**/*'],
      to: [to],
    },
    watch: argv.watch,
  })
}

const copyIndexHtml = () => {
  return copy({
    resolveFrom: 'cwd',
    assets: {
      from: ['./index.html'],
      to: ['./dist/index/index.html'],
    },
    watch: argv.watch,
  })
}

const defineEnv = () => {
  const envData = fs.readFileSync(argv.env, { encoding: `utf-8` })
  const env = JSON.parse(envData)
  Object.keys(env).forEach((key) => {
    const value = env[key]
    if (typeof value === 'string') env[key] = `"${value}"`
  })

  return env
}

const build = async (options) => {
  if (argv.watch) {
    const ctx = await esbuild.context(options)
    await ctx.watch()
  } else {
    const result = await esbuild.build({
      ...options,
      metafile: true
    })

    // save bundle to analyze here https://esbuild.github.io/analyze/
    fs.writeFileSync(path.join(options.outdir, 'meta.json'), JSON.stringify(result.metafile))
  }
}

const buildCloudflare = async () => {
  const options = {
    bundle: true,
    jsx: `automatic`,
    loader,
    minify: argv.minify,
    sourcemap,
    define: defineEnv(),
    external
  }

  // _worker
  build({
    ...options,
    format: 'esm',
    outdir: `./dist/cf`,
    entryPoints: [`./src/ssr/_worker`],
    plugins: [
      stylePlugin({
        extract: false,
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
      logRebuild('cf-worker')
    ]
  })

  // client
  build({
    ...options,
    outdir: `./dist/cf/public`,
    entryPoints: [`./src/ssr/client`],
    plugins: [
      stylePlugin({
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
      logRebuild('cf-client'),
      copyPublic(`./dist/cf/public`)
    ]
  })
}

const buildNodeServer = () => {
  const options = {
    bundle: true,
    jsx: `automatic`,
    minify: argv.minify,
    loader,
    sourcemap,
    define: defineEnv(),
    external,
  }

  // node_server
  build({
    ...options,
    platform: 'node',
    outdir: `./dist/node_server`,
    entryPoints: [`./src/ssr/node_server`],
    plugins: [
      stylePlugin({
        extract: false,
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
      logRebuild('node-server')
    ]
  })

  // client
  build({
    ...options,
    outdir: `./dist/node_server/public`,
    entryPoints: [`./src/ssr/client`],
    plugins: [
      stylePlugin({
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
      logRebuild('node-client'),
      copyPublic(`./dist/node_server/public`)
    ]
  })
}

// No ssr
const buildIndex = () => {
  const options = {
    outdir: `./dist/index/public`,
    entryPoints: [`./src/client`],
    bundle: true,
    jsx: `automatic`,
    minify: argv.minify,
    loader,
    sourcemap,
    define: defineEnv(),
    external,
    plugins: [
      stylePlugin({
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
      logRebuild('index'),
      copyPublic('./dist/index/public'),
      copyIndexHtml()
    ]
  }

  build(options)
}

const main = async () => {
  if (argv.build === `index`) {
    buildIndex()
  }

  if (argv.build === `cf_worker`) {
    buildCloudflare()
  }

  if (argv.build === `node_server`) {
    buildNodeServer()
  }
}

main()
